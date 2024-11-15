# Result Image
![Topology example](https://github.com/zxim/Automation-Drawing-AWS-Network-Topology/blob/main/result.png)

<br>

## Velog Link
**👉 See more contents. Click my [Velog Link](https://velog.io/@tlaals44/%EC%82%AC%EC%9D%B4%EB%93%9C-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8)** [![Velog](https://img.shields.io/badge/Velog-20C997?style=for-the-badge&logo=Velog&logoColor=white)](https://velog.io/@tlaals44/%EC%82%AC%EC%9D%B4%EB%93%9C-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8)

<br>

# Create a .env File in the Root Directory(project)
## .env File Contents
**AWS_ACCESS_KEY_ID**: The Access Key ID issued when creating the IAM user <br>
**AWS_SECRET_ACCESS_KEY**: The Secret Access Key associated with the IAM user  <br>
**AWS_REGION**: The AWS region    for example: 'ap-northeast-2'  <br>

<br>

## Development Environment
### Frontend
<div> <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" /> <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" /> <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" /> </div>


### Backend
<div> <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" /> <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" /></div>

### Others
<div> <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" /> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" /> <img src="https://img.shields.io/badge/Visual%20Studio%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" /> </div>

<br>

<br>

## IAM Account Creation and Role Assignments
### AWSServiceRoleForElasticLoadBalancing
**Trusted Entity**: AWS Service (elasticloadbalancing) <br>
**Description**: This role is automatically created by AWS for use with the Elastic Load Balancing service, enabling it to perform tasks related to load balancers.

### AWSServiceRoleForRDS
**Trusted Entity**: AWS Service (rds) <br>
**Description**: This role is automatically created by AWS for Amazon RDS (Relational Database Service) and allows for monitoring and management tasks for database instances.

### AWSServiceRoleForSupport 
**Trusted Entity**: AWS Service (support) <br>
**Description**: This role is used by the AWS Support service to handle and manage support requests.

## AWSServiceRoleForTrustedAdvisor
**Trusted Entity**: AWS Service (trustedadvisor) <br>
**Description**: This role is used by the AWS Trusted Advisor service to review best practices and provide recommendations for your AWS environment.

## rds-monitoring-role
**Trusted Entity**: AWS Service (monitoring.rds) <br>
**Description**: This role is designated for monitoring the performance and health of RDS instances.

<br>

## Additional Installations
Install Docker and Docker-Compose
Install Node.js and npm
Install Python


## How to Start
cd project  (root directory)
docker-compose up --build
go to url: localhost:3000


