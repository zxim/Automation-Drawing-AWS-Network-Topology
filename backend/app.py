from flask import Flask, jsonify, request
from flask_cors import CORS
import boto3

app = Flask(__name__)
CORS(app)

def create_aws_session(aws_access_key, aws_secret_key, aws_region):
    return boto3.Session(
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region
    )

@app.route('/src/<path:filename>')
def ignore_static_files(filename):
    return jsonify({"error": "File not served by backend"}), 404

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    aws_access_key = data.get('accessKeyId')
    aws_secret_key = data.get('secretAccessKey')
    aws_region = data.get('region', 'ap-northeast-2')  # 기본 리전 설정

    try:
        session = create_aws_session(aws_access_key, aws_secret_key, aws_region)
        ec2 = session.client('ec2')
        ec2.describe_vpcs()  # VPC 조회로 자격 증명 검증
        return jsonify({"message": "로그인 성공"}), 200
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "잘못된 자격 증명입니다."}), 401

@app.route('/vpcs', methods=['POST'])
def list_vpcs():
    try:
        data = request.json
        aws_access_key = data.get('accessKeyId')
        aws_secret_key = data.get('secretAccessKey')
        aws_region = data.get('region', 'ap-northeast-2')

        session = create_aws_session(aws_access_key, aws_secret_key, aws_region)
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

@app.route('/vpcs/<vpc_id>', methods=['POST'])
def get_vpc_details(vpc_id):
    try:
        data = request.json
        aws_access_key = data.get('accessKeyId')
        aws_secret_key = data.get('secretAccessKey')
        aws_region = data.get('region', 'ap-northeast-2')

        session = create_aws_session(aws_access_key, aws_secret_key, aws_region)
        ec2 = session.client('ec2')
        elbv2 = session.client('elbv2')
        wafv2 = session.client('wafv2')
        autoscaling = session.client('autoscaling')

        vpc_info = {
            "VPC ID": vpc_id,
            "Name": next((tag['Value'] for tag in ec2.describe_vpcs(VpcIds=[vpc_id])['Vpcs'][0].get("Tags", []) if tag["Key"] == "Name"), "N/A"),
            "Subnets": [],
            "RouteTables": [],
            "Instances": [],
            "InternetGateway": None,
            "ALBs": [],
            "WAFs": [],
            "AutoScalingInstances": [],
            "NetworkACLs": []
        }

        # 서브넷 정보
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
                "isNatConnected": False
            })

        # 라우트 테이블 정보
        route_tables = ec2.describe_route_tables(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['RouteTables']
        for route_table in route_tables:
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
                "AssociatedSubnets": associations
            })

        # 인터넷 게이트웨이 정보
        internet_gateways = ec2.describe_internet_gateways(Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}])['InternetGateways']
        
        if internet_gateways:
            igw = internet_gateways[0]
            igw_name = next((tag['Value'] for tag in igw.get("Tags", []) if tag["Key"] == "Name"), "N/A")
            vpc_info["InternetGateway"] = {"GatewayId": igw.get("InternetGatewayId"), "Name": igw_name}

        # EC2 인스턴스 정보
        instances = ec2.describe_instances(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['Reservations']
        for reservation in instances:
            for instance in reservation['Instances']:
                instance_name = next((tag['Value'] for tag in instance.get("Tags", []) if tag["Key"] == "Name"), "N/A")
                ami_id = instance.get("ImageId")
                
                # AMI 정보 가져오기
                ami_info = ec2.describe_images(ImageIds=[ami_id])['Images'][0]
                ami_name = ami_info.get("Name", "N/A")
                ami_description = ami_info.get("Description", "N/A")

                vpc_info["Instances"].append({
                    "Instance ID": instance.get("InstanceId"),
                    "InstanceType": instance.get("InstanceType"),
                    "AvailabilityZone": instance.get("Placement", {}).get("AvailabilityZone"),
                    "State": instance.get("State", {}).get("Name"),
                    "Name": instance_name,
                    "AMI ID": ami_id,
                    "AMI Name": ami_name,
                    "AMI Description": ami_description
                })

                # ALB 정보 가져오기
        try:
            albs = elbv2.describe_load_balancers()
            for alb in albs['LoadBalancers']:
                if alb['VpcId'] == vpc_id:
                    vpc_info["ALBs"].append({
                        "LoadBalancerName": alb['LoadBalancerName'],
                        "LoadBalancerArn": alb['LoadBalancerArn'],
                        "DNSName": alb['DNSName'],
                        "Scheme": alb['Scheme'],
                        "State": alb['State']['Code']
                    })
        except Exception as e:
            print(f"Error fetching ALBs: {e}")
        
        # WAF 정보 가져오기
        try:
            wafs = wafv2.list_web_acls(Scope='REGIONAL')
            for waf in wafs['WebACLs']:
                waf_details = wafv2.get_web_acl(Name=waf['Name'], Scope='REGIONAL', Id=waf['Id'])
                vpc_info["WAFs"].append({
                    "Name": waf['Name'],
                    "Id": waf['Id'],
                    "Arn": waf['ARN'],
                    "Rules": waf_details['WebACL']['Rules']
                })
        except Exception as e:
            print(f"Error fetching WAFs: {e}")

        # Auto Scaling Instance 정보 가져오기
        try:
            asg_instances = autoscaling.describe_auto_scaling_instances()
            for instance in asg_instances['AutoScalingInstances']:
                if instance['VpcId'] == vpc_id:
                    vpc_info["AutoScalingInstances"].append({
                        "InstanceId": instance['InstanceId'],
                        "AutoScalingGroupName": instance['AutoScalingGroupName'],
                        "LifecycleState": instance['LifecycleState'],
                        "HealthStatus": instance['HealthStatus'],
                        "AvailabilityZone": instance['AvailabilityZone']
                    })
        except Exception as e:
            print(f"Error fetching Auto Scaling Instances: {e}")

        # Network ACL 정보 가져오기
        try:
            acls = ec2.describe_network_acls(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
            for acl in acls['NetworkAcls']:
                entries = [
                    {
                        "RuleNumber": entry['RuleNumber'],
                        "Protocol": entry['Protocol'],
                        "RuleAction": entry['RuleAction'],
                        "Egress": entry['Egress'],
                        "CidrBlock": entry.get('CidrBlock', 'N/A')
                    }
                    for entry in acl['Entries']
                ]
                vpc_info["NetworkACLs"].append({
                    "AclId": acl['NetworkAclId'],
                    "IsDefault": acl['IsDefault'],
                    "Entries": entries
                })
        except Exception as e:
            print(f"Error fetching NetworkACLs: {e}")

        return jsonify(vpc_info)
    except Exception as e:
        print(f"Error in get_vpc_details: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
