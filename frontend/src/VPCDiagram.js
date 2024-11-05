// src/VPCDiagram.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, { Background, Controls, MiniMap } from 'react-flow-renderer';

const VPCDiagram = () => {
    const { vpcId } = useParams();
    const [elements, setElements] = useState([]);

    useEffect(() => {
        // Fetch VPC details using the vpcId to get the necessary data
        fetch(`/vpcs/${vpcId}`)
            .then(response => response.json())
            .then(data => {
                const nodes = [];
                const edges = [];

                // Create nodes for the VPC and its sub-components (subnets, route tables, instances)
                nodes.push({
                    id: 'vpc',
                    data: { label: `VPC: ${data["VPC ID"]}` },
                    position: { x: 250, y: 50 },
                });

                // Create nodes and edges for subnets
                data.Subnets.forEach((subnet, index) => {
                    const subnetId = `subnet-${index}`;
                    nodes.push({
                        id: subnetId,
                        data: { label: `Subnet: ${subnet["Subnet ID"]} (${subnet["CIDR Block"]})` },
                        position: { x: 100, y: 150 + index * 100 },
                    });
                    edges.push({ id: `vpc-${subnetId}`, source: 'vpc', target: subnetId });
                });

                // Create nodes and edges for route tables
                data.RouteTables.forEach((routeTable, index) => {
                    const routeTableId = `routeTable-${index}`;
                    nodes.push({
                        id: routeTableId,
                        data: { label: `Route Table: ${routeTable["Route Table ID"]}` },
                        position: { x: 400, y: 150 + index * 100 },
                    });
                    edges.push({ id: `vpc-${routeTableId}`, source: 'vpc', target: routeTableId });
                });

                // Create nodes and edges for instances
                data.Instances.forEach((instance, index) => {
                    const instanceId = `instance-${index}`;
                    nodes.push({
                        id: instanceId,
                        data: { label: `Instance: ${instance["Instance ID"]} (${instance["Instance Type"]})` },
                        position: { x: 250, y: 300 + index * 100 },
                    });
                    edges.push({ id: `subnet-${instanceId}`, source: `subnet-${index}`, target: instanceId });
                });

                setElements([...nodes, ...edges]);
            })
            .catch(error => console.error('Error fetching VPC details:', error));
    }, [vpcId]);

    return (
        <div style={{ height: 600 }}>
            <h1>VPC Diagram for {vpcId}</h1>
            <ReactFlow elements={elements} style={{ width: '100%', height: '100%' }}>
                <MiniMap />
                <Controls />
                <Background color="#aaa" gap={16} />
            </ReactFlow>
        </div>
    );
};

export default VPCDiagram;
