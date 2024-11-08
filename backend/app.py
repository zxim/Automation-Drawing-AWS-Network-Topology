from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import boto3

app = Flask(__name__)
CORS(app)
load_dotenv()

def create_aws_session():
    aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    aws_region = os.getenv('AWS_REGION')

    if not aws_access_key or not aws_secret_key or not aws_region:
        raise ValueError("Missing AWS credentials")

    return boto3.Session(
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region
    )

@app.route('/vpcs', methods=['GET'])
def list_vpcs():
    try:
        session = create_aws_session()
        ec2 = session.client('ec2')
        response = ec2.describe_vpcs()

        vpc_data = [
            {
                "VpcId": vpc.get("VpcId"),
                "CidrBlock": vpc.get("CidrBlock"),
                "State": vpc.get("State"),
                "IsDefault": vpc.get("IsDefault", False),
                "Name": next((tag['Value'] for tag in vpc.get("Tags", []) if tag["Key"] == "Name"), "N/A")
            }
            for vpc in response['Vpcs']
        ]

        return jsonify(vpc_data)
    except Exception as e:
        print(f"Error in list_vpcs: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/vpcs/<vpc_id>', methods=['GET'])
def get_vpc_details(vpc_id):
    try:
        session = create_aws_session()
        ec2 = session.client('ec2')

        vpc_info = {
            "VPC ID": vpc_id,
            "Name": next((tag['Value'] for tag in ec2.describe_vpcs(VpcIds=[vpc_id])['Vpcs'][0].get("Tags", []) if tag["Key"] == "Name"), "N/A"),
            "Subnets": [],
            "RouteTables": [],
            "Instances": [],
            "InternetGateway": None
        }

        # Subnet information
        subnets = ec2.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['Subnets']
        for subnet in subnets:
            subnet_name = next((tag['Value'] for tag in subnet.get("Tags", []) if tag["Key"] == "Name"), "N/A")
            vpc_info["Subnets"].append({
                "Subnet ID": subnet.get("SubnetId"),
                "CIDR Block": subnet.get("CidrBlock"),
                "Availability Zone": subnet.get("AvailabilityZone"),
                "State": subnet.get("State"),
                "Name": subnet_name,
                "RouteTableID": None,
                "isNatConnected": False  # 기본값 설정
            })

        # Route Table information
        route_tables = ec2.describe_route_tables(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['RouteTables']
        for route_table in route_tables:
            route_table_name = next((tag['Value'] for tag in route_table.get("Tags", []) if tag["Key"] == "Name"), "N/A")
            routes = [{"Destination": route.get("DestinationCidrBlock"), "Target": route.get("GatewayId", "N/A")} for route in route_table.get("Routes", [])]
            associations = [assoc.get("SubnetId") for assoc in route_table.get("Associations", []) if assoc.get("SubnetId")]
            
            for subnet_id in associations:
                subnet = next((s for s in vpc_info["Subnets"] if s["Subnet ID"] == subnet_id), None)
                if subnet:
                    subnet["RouteTableID"] = route_table.get("RouteTableId")
                    subnet["isNatConnected"] = any(route.get("Target") and "igw-" in route.get("Target") for route in routes)

            vpc_info["RouteTables"].append({
                "Route Table ID": route_table.get("RouteTableId"),
                "Routes": routes,
                "Name": route_table_name,
                "AssociatedSubnets": associations
            })

        # Internet Gateway information
        internet_gateways = ec2.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )['InternetGateways']
        
        if internet_gateways:
            igw = internet_gateways[0]
            igw_name = next((tag['Value'] for tag in igw.get("Tags", []) if tag["Key"] == "Name"), "N/A")
            vpc_info["InternetGateway"] = {"GatewayId": igw.get("InternetGatewayId"), "Name": igw_name}

        return jsonify(vpc_info)
    except Exception as e:
        print(f"Error in get_vpc_details: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
