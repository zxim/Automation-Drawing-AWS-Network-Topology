import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import LoginPage from './LoginPage';
import VPCDiagram from './VPCDiagram';
import TopologyDiagram from './TopologyDiagram';
import './App.css';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [vpcs, setVpcs] = useState([]);
    const [selectedVpc, setSelectedVpc] = useState("");
    const [vpcDetails, setVpcDetails] = useState(null);
    const [topologyData, setTopologyData] = useState(null);
    const region = "ap-northeast-2";

    // 로그인 처리 함수, 로그인 성공 시 자격 증명을 상태에 저장
    const handleLogin = (accessKeyId, secretAccessKey) => {
        setCredentials({ accessKeyId, secretAccessKey });
        setIsLoggedIn(true);
    };

    useEffect(() => {
        if (isLoggedIn && credentials) {
            fetch('/vpcs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    region: region
                })
            })
                .then(response => response.json())
                .then(data => setVpcs(data || []))
                .catch(error => console.error('VPC 데이터를 가져오는 중 오류 발생:', error));
        }
    }, [isLoggedIn, credentials]);

    const handleVpcSelect = (vpcId) => {
        setSelectedVpc(vpcId);
        if (vpcId && credentials) {
            fetch(`/vpcs/${vpcId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                    region: region
                })
            })
                .then(response => response.json())
                .then(data => {
                    data.State = region;
                    setVpcDetails(data);

                    const topology = {
                        regionName: region,
                        vpcName: data.Name || data["VPC ID"],
                        azs: (data.Subnets || []).reduce((acc, subnet) => {
                            const az = acc.find(a => a.name === subnet["Availability Zone"]);
                            if (az) {
                                az.subnets.push({
                                    name: subnet.Name || subnet["Subnet ID"],
                                    isNatConnected: subnet.isNatConnected,
                                    instances: (data.Instances || []).filter(
                                        instance => instance["Subnet ID"] === subnet["Subnet ID"]
                                    ).map(instance => ({
                                        name: instance.Name || instance["Instance ID"],
                                    })),
                                });
                            } else {
                                acc.push({
                                    name: subnet["Availability Zone"],
                                    subnets: [
                                        {
                                            name: subnet.Name || subnet["Subnet ID"],
                                            isNatConnected: subnet.isNatConnected,
                                            instances: (data.Instances || []).filter(
                                                instance => instance["Subnet ID"] === subnet["Subnet ID"]
                                            ).map(instance => ({
                                                name: instance.Name || instance["Instance ID"],
                                            })),
                                        },
                                    ],
                                });
                            }
                            return acc;
                        }, []),
                    };
                    setTopologyData(topology);
                })
                .catch(error => console.error('VPC 상세 정보를 가져오는 중 오류 발생:', error));
        } else {
            setVpcDetails(null);
            setTopologyData(null);
        }
    };

    return (
        <Router>
            <div>
                {isLoggedIn ? (
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <div>
                                    <h1>AWS VPC 정보</h1>
                                    <select value={selectedVpc} onChange={(e) => handleVpcSelect(e.target.value)}>
                                        <option value="">VPC 선택</option>
                                        {vpcs.map((vpc) => (
                                            <option key={vpc.VpcId} value={vpc.VpcId}>
                                                {vpc.Name} ({vpc.VpcId})
                                            </option>
                                        ))}
                                    </select>
                                    {selectedVpc && (
                                        <>
                                            <Link to={`/diagram/${selectedVpc}`}>
                                                <button>다이어그램 그리기</button>
                                            </Link>
                                            <Link to={`/topology/${selectedVpc}`}>
                                                <button>토폴로지 그리기</button>
                                            </Link>
                                        </>
                                    )}
                                    {vpcDetails && (
                                        <div>
                                            <h2>VPC 상세 정보</h2>
                                            <table border="1">
                                                <tbody>
                                                    <tr><th>VPC 이름</th><td>{vpcDetails.Name}</td></tr>
                                                    <tr><th>VPC ID</th><td>{vpcDetails["VPC ID"]}</td></tr>
                                                    <tr><th>상태 (리전)</th><td>{vpcDetails.State}</td></tr>
                                                </tbody>
                                            </table>

                                            <h3>인터넷 게이트웨이</h3>
                                            {vpcDetails.InternetGateway ? (
                                                <table border="1">
                                                    <thead>
                                                        <tr>
                                                            <th>게이트웨이 이름</th>
                                                            <th>게이트웨이 ID</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>{vpcDetails.InternetGateway.Name || 'N/A'}</td>
                                                            <td>{vpcDetails.InternetGateway["GatewayId"] || 'N/A'}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p>이 VPC에는 인터넷 게이트웨이가 없습니다.</p>
                                            )}

                                            <h3>서브넷</h3>
                                            {(vpcDetails.Subnets || []).length > 0 ? (
                                                <table border="1">
                                                    <thead>
                                                        <tr>
                                                            <th>서브넷 이름</th>
                                                            <th>서브넷 ID</th>
                                                            <th>CIDR 블록</th>
                                                            <th>가용 영역</th>
                                                            <th>상태</th>
                                                            <th>라우트 테이블 ID</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vpcDetails.Subnets.map((subnet, index) => (
                                                            <tr key={index}>
                                                                <td>{subnet.Name || 'N/A'}</td>
                                                                <td>{subnet["Subnet ID"]}</td>
                                                                <td>{subnet["CIDR Block"]}</td>
                                                                <td>{subnet["Availability Zone"]}</td>
                                                                <td>{subnet.State}</td>
                                                                <td>{subnet["RouteTableID"] || 'N/A'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p>이 VPC에는 서브넷이 없습니다.</p>
                                            )}

                                            <h3>인스턴스</h3>
                                            {(vpcDetails.Instances || []).length > 0 ? (
                                                <table border="1">
                                                    <thead>
                                                        <tr>
                                                            <th>인스턴스 ID</th>
                                                            <th>인스턴스 유형</th>
                                                            <th>가용 영역</th>
                                                            <th>상태</th>
                                                            <th>AMI ID</th>
                                                            <th>AMI 이름</th>
                                                            <th>AMI 설명</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {vpcDetails.Instances.map((instance, index) => (
                                                            <tr key={index}>
                                                                <td>{instance["Instance ID"]}</td>
                                                                <td>{instance.InstanceType}</td>
                                                                <td>{instance.AvailabilityZone}</td>
                                                                <td>{instance.State}</td>
                                                                <td>{instance["AMI ID"]}</td>
                                                                <td>{instance["AMI Name"] || 'N/A'}</td>
                                                                <td>{instance["AMI Description"] || 'N/A'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p>이 VPC에는 인스턴스가 없습니다.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            }
                        />
                        <Route path="/diagram/:vpcId" element={<VPCDiagram vpcDetails={vpcDetails} />} />
                        <Route path="/topology/:vpcId" element={<TopologyDiagram topologyData={topologyData} regionName={region} />} />
                    </Routes>
                ) : (
                    <LoginPage onLogin={handleLogin} />
                )}
            </div>
        </Router>
    );
}

export default App;
