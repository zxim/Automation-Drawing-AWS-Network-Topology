import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import VPCDiagram from './VPCDiagram';
import TopologyDiagram from './TopologyDiagram';
import './App.css';

function App() {
    const [vpcs, setVpcs] = useState([]);
    const [selectedVpc, setSelectedVpc] = useState("");
    const [vpcDetails, setVpcDetails] = useState(null);
    const [topologyData, setTopologyData] = useState(null);

    const region = "ap-northeast-2";

    useEffect(() => {
        fetch('/vpcs')
            .then(response => response.json())
            .then(data => setVpcs(data || []))
            .catch(error => console.error('Error fetching VPCs:', error));
    }, []);

    const handleVpcSelect = (vpcId) => {
        setSelectedVpc(vpcId);
        if (vpcId) {
            fetch(`/vpcs/${vpcId}`)
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
                .catch(error => console.error('Error fetching VPC details:', error));
        } else {
            setVpcDetails(null);
            setTopologyData(null);
        }
    };

    return (
        <Router>
            <Routes>
                <Route
                    path="/"
                    element={
                        <div>
                            <h1>AWS VPC Information</h1>
                            <select value={selectedVpc} onChange={(e) => handleVpcSelect(e.target.value)}>
                                <option value="">Select VPC</option>
                                {vpcs.map((vpc) => (
                                    <option key={vpc.VpcId} value={vpc.VpcId}>
                                        {vpc.Name} ({vpc.VpcId})
                                    </option>
                                ))}
                            </select>
                            {selectedVpc && (
                                <>
                                    <Link to={`/diagram/${selectedVpc}`}>
                                        <button>Draw Diagram</button>
                                    </Link>
                                    <Link to={`/topology/${selectedVpc}`}>
                                        <button>Draw Topology</button>
                                    </Link>
                                </>
                            )}
                            {vpcDetails && (
                                <div>
                                    <h2>VPC Details</h2>
                                    <table border="1">
                                        <tbody>
                                            <tr><th>VPC Name</th><td>{vpcDetails.Name}</td></tr>
                                            <tr><th>VPC ID</th><td>{vpcDetails["VPC ID"]}</td></tr>
                                            <tr><th>State (Region)</th><td>{vpcDetails.State}</td></tr>
                                        </tbody>
                                    </table>
                                    <h3>Internet Gateway</h3>
                                    {vpcDetails.InternetGateway ? (
                                        <table border="1">
                                            <thead>
                                                <tr>
                                                    <th>Gateway Name</th>
                                                    <th>Gateway ID</th>
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
                                        <p>No Internet Gateway available for this VPC.</p>
                                    )}

                                    <h3>Subnets</h3>
                                    {(vpcDetails.Subnets || []).length > 0 ? (
                                        <table border="1">
                                            <thead>
                                                <tr>
                                                    <th>Subnet Name</th>
                                                    <th>Subnet ID</th>
                                                    <th>CIDR Block</th>
                                                    <th>Availability Zone</th>
                                                    <th>State</th>
                                                    <th>Route Table ID</th>
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
                                        <p>No subnets available for this VPC.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    }
                />
                <Route path="/diagram/:vpcId" element={<VPCDiagram vpcDetails={vpcDetails} />} />
                <Route path="/topology/:vpcId" element={<TopologyDiagram topologyData={topologyData} regionName={region} />} />
            </Routes>
        </Router>
    );
}

export default App;
