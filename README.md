## .env는 Root 디렉토리에 작성
## .env 작성 내용
AWS_ACCESS_KEY_ID: IAM 사용자 생성 시 발급된 AWS 접근 키 ID
AWS_SECRET_ACCESS_KEY: 해당 IAM 사용자에 대한 비밀 접근 키
AWS_REGION: AWS 리전, 예를 들어 'ap-northeast-2' 


## IAM 계정 생성 및 역할 추가
AWSServiceRoleForElasticLoadBalancing
신뢰할 수 있는 개체: AWS 서비스 (elasticloadbalancing)
설명: 이 역할은 Elastic Load Balancing 서비스에서 사용되며, 로드 밸런서와 관련된 작업을 수행하기 위해 AWS에서 자동으로 생성한 역할

AWSServiceRoleForRDS
신뢰할 수 있는 개체: AWS 서비스 (rds)
설명: 이 역할은 Amazon RDS (Relational Database Service)에서 사용되며, 데이터베이스 인스턴스의 모니터링 및 관리 작업을 수행하기 위해 AWS에서 자동으로 생성한 역할

AWSServiceRoleForSupport
신뢰할 수 있는 개체: AWS 서비스 (support)
설명: 이 역할은 AWS Support 서비스에서 사용되며, 지원 요청을 처리하고 관리하기 위한 역할

AWSServiceRoleForTrustedAdvisor
신뢰할 수 있는 개체: AWS 서비스 (trustedadvisor)
설명: 이 역할은 AWS Trusted Advisor 서비스에서 사용되며, AWS 환경의 모범 사례를 검토하고 권장 사항을 제공하기 위한 역할

rds-monitoring-role
신뢰할 수 있는 개체: AWS 서비스 (monitoring.rds)
설명: 이 역할은 RDS 인스턴스의 성능 및 상태를 모니터링하기 위한 역할


## 그 외
Docker, Docker-Compose 설치
Node.js 및 npm 설치
Python 설치
