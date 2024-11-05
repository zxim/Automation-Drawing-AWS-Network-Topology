import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import VPCDiagram from './VPCDiagram';

function App() {
    const [vpcs, setVpcs] = useState([]);
    const [selectedVpc, setSelectedVpc] = useState("");
    const [vpcDetails, setVpcDetails] = useState(null);

    useEffect(() => {
        fetch('/vpcs')
            .then(response => response.json())
            .then(data => setVpcs(data))
            .catch(error => console.error('Error fetching VPCs:', error));
    }, []);

    const handleVpcSelect = (vpcId) => {
        setSelectedVpc(vpcId);
        if (vpcId) {
            fetch(`/vpcs/${vpcId}`)
                .then(response => response.json())
                .then(data => setVpcDetails(data))
                .catch(error => console.error('Error fetching VPC details:', error));
        } else {
            setVpcDetails(null);
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
                                <Link to={`/diagram/${selectedVpc}`}>
                                    <button>Draw Diagram</button>
                                </Link>
                            )}
                            {vpcDetails && (
                                <div>
                                    <h2>VPC Details</h2>
                                    <table border="1">
                                        <tbody>
                                            <tr><th>VPC ID</th><td>{vpcDetails["VPC ID"]}</td></tr>
                                            <tr><th>State</th><td>{vpcDetails.State}</td></tr>
                                        </tbody>
                                    </table>

                                    <h3>Subnets</h3>
                                    {vpcDetails.Subnets.length > 0 ? (
                                        <table border="1">
                                            <thead>
                                                <tr>
                                                    <th>Subnet ID</th>
                                                    <th>CIDR Block</th>
                                                    <th>Availability Zone</th>
                                                    <th>State</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vpcDetails.Subnets.map((subnet, index) => (
                                                    <tr key={index}>
                                                        <td>{subnet["Subnet ID"]}</td>
                                                        <td>{subnet["CIDR Block"]}</td>
                                                        <td>{subnet["Availability Zone"]}</td>
                                                        <td>{subnet.State}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No subnets available for this VPC.</p>
                                    )}

                                    <h3>Route Tables</h3>
                                    {vpcDetails.RouteTables.length > 0 ? (
                                        <table border="1">
                                            <thead>
                                                <tr>
                                                    <th>Route Table ID</th>
                                                    <th>Routes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vpcDetails.RouteTables.map((routeTable, index) => (
                                                    <tr key={index}>
                                                        <td>{routeTable["Route Table ID"]}</td>
                                                        <td>
                                                            <ul>
                                                                {routeTable.Routes.map((route, routeIndex) => (
                                                                    <li key={routeIndex}>
                                                                        Destination: {route.Destination}, Target: {route.Target}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No route tables available for this VPC.</p>
                                    )}

                                    <h3>Instances</h3>
                                    {vpcDetails.Instances.length > 0 ? (
                                        <table border="1">
                                            <thead>
                                                <tr>
                                                    <th>Instance ID</th>
                                                    <th>Instance Type</th>
                                                    <th>Private IP</th>
                                                    <th>Public IP</th>
                                                    <th>State</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vpcDetails.Instances.map((instance, index) => (
                                                    <tr key={index}>
                                                        <td>{instance["Instance ID"]}</td>
                                                        <td>{instance["Instance Type"]}</td>
                                                        <td>{instance["Private IP"]}</td>
                                                        <td>{instance["Public IP"]}</td>
                                                        <td>{instance.State}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No instances available for this VPC.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    }
                />
                <Route path="/diagram/:vpcId" element={<VPCDiagram vpcDetails={vpcDetails} />} />
            </Routes>
        </Router>
    );
}

export default App;
