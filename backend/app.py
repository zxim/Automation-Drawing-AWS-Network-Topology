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
        return jsonify({"error": str(e)}), 500

@app.route('/vpcs/<vpc_id>', methods=['GET'])
def get_vpc_details(vpc_id):
    try:
        session = create_aws_session()
        ec2 = session.client('ec2')

        # VPC 기본 정보
        vpc_info = {
            "VPC ID": vpc_id,
            "Subnets": [],
            "RouteTables": [],
            "Instances": []
        }

        # 서브넷 정보 추가
        subnets = ec2.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['Subnets']
        for subnet in subnets:
            vpc_info["Subnets"].append({
                "Subnet ID": subnet.get("SubnetId"),
                "CIDR Block": subnet.get("CidrBlock"),
                "Availability Zone": subnet.get("AvailabilityZone"),
                "State": subnet.get("State")
            })

        # 라우팅 테이블 정보 추가
        route_tables = ec2.describe_route_tables(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['RouteTables']
        for route_table in route_tables:
            routes = [{"Destination": route.get("DestinationCidrBlock"), "Target": route.get("GatewayId", "N/A")} for route in route_table.get("Routes", [])]
            vpc_info["RouteTables"].append({
                "Route Table ID": route_table.get("RouteTableId"),
                "Routes": routes
            })

        # 인스턴스 정보 추가
        instances = ec2.describe_instances(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['Reservations']
        for reservation in instances:
            for instance in reservation['Instances']:
                vpc_info["Instances"].append({
                    "Instance ID": instance.get("InstanceId"),
                    "Instance Type": instance.get("InstanceType"),
                    "State": instance['State']['Name'],
                    "Private IP": instance.get("PrivateIpAddress", "N/A"),
                    "Public IP": instance.get("PublicIpAddress", "N/A")
                })

        return jsonify(vpc_info)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
