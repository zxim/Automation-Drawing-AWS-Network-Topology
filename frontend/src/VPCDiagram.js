import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const VPCDiagram = ({ vpcDetails }) => {
    const cyRef = useRef(null);

    useEffect(() => {
        if (!vpcDetails) return;

        const nodes = [];
        const edges = [];

        // VPC 전체를 감싸는 투명 상자 추가
        nodes.push({
            data: { id: 'vpc-box', label: `VPC: ${vpcDetails.Name || vpcDetails["VPC ID"]}` },
            classes: 'vpc-box',
            position: { x: 500, y: 400 } // VPC 박스의 중앙 위치 조정
        });

        // 인터넷 게이트웨이 노드 추가
        if (vpcDetails.InternetGateway) {
            const gatewayId = vpcDetails.InternetGateway["GatewayId"];
            nodes.push({
                data: { id: gatewayId, label: `Internet Gateway: ${vpcDetails.InternetGateway.Name || gatewayId}`, parent: 'vpc-box' },
                classes: 'gateway',
                position: { x: 500, y: 150 }
            });
        }

        // 서브넷과 라우팅 테이블 그룹화
        const groupedSubnets = {};
        vpcDetails.Subnets.forEach((subnet) => {
            const routeTableId = subnet["RouteTableID"];
            if (!groupedSubnets[routeTableId]) {
                groupedSubnets[routeTableId] = { subnets: [], instances: [] };
            }
            groupedSubnets[routeTableId].subnets.push(subnet);
        });

        vpcDetails.Instances.forEach((instance) => {
            const subnetId = instance["Subnet ID"];
            const subnet = vpcDetails.Subnets.find(sub => sub["Subnet ID"] === subnetId);
            const routeTableId = subnet ? subnet["RouteTableID"] : null;
            if (routeTableId) {
                groupedSubnets[routeTableId].instances.push(instance);
            }
        });

        // 라우팅 테이블 및 서브넷, 인스턴스 배치
        let routeTablePositionX = 200;  // 첫 번째 라우팅 테이블 x 시작 위치
        const routeTablePositionY = 250;  // 라우팅 테이블의 y 위치
        const horizontalGapBetweenTables = 300; // 서로 다른 라우팅 테이블 간의 간격

        Object.keys(groupedSubnets).forEach((routeTableId, index) => {
            const routeTable = vpcDetails.RouteTables.find(rt => rt["Route Table ID"] === routeTableId);
            if (routeTable) {
                // 라우팅 테이블 노드 추가
                nodes.push({
                    data: { id: `routeTable-${routeTableId}`, label: `Route Table: ${routeTable.Name || routeTableId}`, parent: 'vpc-box' },
                    classes: 'route-table',
                    position: { x: routeTablePositionX, y: routeTablePositionY }
                });

                // 인터넷 게이트웨이와 라우팅 테이블 연결 설정
                if (vpcDetails.InternetGateway) {
                    const isGatewayConnected = routeTable.Routes.some(route =>
                        route.Destination === '0.0.0.0/0' &&
                        route.Target === vpcDetails.InternetGateway["GatewayId"]
                    );
                    if (isGatewayConnected) {
                        edges.push({
                            data: { id: `routeTable-gateway-${routeTableId}`, source: `routeTable-${routeTableId}`, target: vpcDetails.InternetGateway["GatewayId"] }
                        });
                    }
                }

                let subnetPositionX = routeTablePositionX - 100;
                let subnetPositionY = routeTablePositionY + 150;

                groupedSubnets[routeTableId].subnets.forEach((subnet, subnetIndex) => {
                    const subnetId = subnet["Subnet ID"];
                    nodes.push({
                        data: { id: `subnet-${subnetId}`, label: subnet.Name || subnetId, cidr: subnet["CIDR Block"], parent: 'vpc-box' },
                        classes: 'subnet',
                        position: { x: subnetPositionX + subnetIndex * 200, y: subnetPositionY }
                    });

                    edges.push({
                        data: { id: `subnet-routeTable-${subnetId}`, source: `subnet-${subnetId}`, target: `routeTable-${routeTableId}` }
                    });

                    let instancePositionY = subnetPositionY + 100;

                    groupedSubnets[routeTableId].instances
                        .filter(instance => instance["Subnet ID"] === subnetId)
                        .forEach((instance, instanceIndex) => {
                            const instanceId = instance["Instance ID"];
                            nodes.push({
                                data: { id: `instance-${instanceId}`, label: `Instance: ${instance.Name || instanceId} (${instance["Instance Type"]})`, parent: 'vpc-box' },
                                classes: 'instance',
                                position: { x: subnetPositionX + subnetIndex * 200, y: instancePositionY + instanceIndex * 100 }
                            });

                            edges.push({
                                data: { id: `subnet-instance-${instanceId}`, source: `subnet-${subnetId}`, target: `instance-${instanceId}` }
                            });
                        });
                });

                routeTablePositionX += groupedSubnets[routeTableId].subnets.length * 200 + horizontalGapBetweenTables;
            }
        });

        if (cyRef.current) {
            cyRef.current.destroy();
        }

        // Cytoscape 초기화
        cyRef.current = cytoscape({
            container: document.getElementById('cy'),
            elements: [...nodes, ...edges],
            style: [
                {
                    selector: '.vpc-box',
                    style: {
                        'shape': 'rectangle',
                        'background-opacity': 0, // 투명 배경
                        'border-width': 2,
                        'border-color': '#000',
                        'label': 'data(label)',
                        'text-valign': 'top',
                        'text-halign': 'center',
                        'color': '#000',
                        'font-size': 16,
                        'width': 1200,
                        'height': 800,
                    }
                },
                {
                    selector: '.gateway',
                    style: {
                        'shape': 'round-rectangle',
                        'background-color': '#ffcc99',
                        'label': 'data(label)',
                        'font-size': 14,
                        'width': 150,
                        'height': 50
                    }
                },
                {
                    selector: '.route-table',
                    style: {
                        'shape': 'round-rectangle',
                        'background-color': '#ccccff',
                        'label': 'data(label)',
                        'font-size': 12,
                        'width': 120,
                        'height': 50
                    }
                },
                {
                    selector: '.subnet',
                    style: {
                        'shape': 'round-rectangle',
                        'background-color': '#ccffcc',
                        'label': 'data(label)',
                        'color': '#333',
                        'font-size': 14,
                        'text-valign': 'center',
                        'width': 180,  // 너비 증가
                        'height': 80   // 높이 증가
                    }
                },
                {
                    selector: '.instance',
                    style: {
                        'shape': 'ellipse',
                        'background-color': '#cccccc',
                        'label': 'data(label)',
                        'color': '#000',
                        'font-size': 10,
                        'width': 120,
                        'height': 50
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle'
                    }
                }
            ],
            layout: { name: 'preset' }
        });
    }, [vpcDetails]);

    return <div id="cy" style={{ width: '100%', height: '800px' }} />;
};

export default VPCDiagram;
