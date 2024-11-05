import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const VPCDiagram = ({ vpcDetails }) => {
    const cyRef = useRef(null);

    useEffect(() => {
        if (!vpcDetails) return;

        const nodes = [];
        const edges = [];

        // VPC 라벨을 상단에 표시
        nodes.push({
            data: { id: 'vpc-label', label: `VPC: ${vpcDetails["VPC ID"]}` },
            position: { x: 400, y: 50 }
        });

        // 인터넷 게이트웨이 노드 추가
        if (vpcDetails.InternetGateway) {
            nodes.push({
                data: { id: 'internet-gateway', label: `Internet Gateway: ${vpcDetails.InternetGateway}` },
                position: { x: 400, y: 150 }
            });
        }

        // 라우팅 테이블 노드 추가 및 연결
        const routingTableMap = {};
        vpcDetails.RouteTables.forEach((routeTable, index) => {
            const routeTableId = routeTable["Route Table ID"];
            if (!routingTableMap[routeTableId]) {
                routingTableMap[routeTableId] = true;
                nodes.push({
                    data: { id: `routeTable-${routeTableId}`, label: `Route Table: ${routeTableId}` },
                    position: { x: 200 + index * 200, y: 250 }
                });

                // 인터넷 게이트웨이에 연결된 라우팅 테이블에 대한 엣지 추가
                if (routeTable.Routes.some(route => route.Target === vpcDetails.InternetGateway)) {
                    edges.push({
                        data: { id: `routeTable-gateway-${routeTableId}`, source: `routeTable-${routeTableId}`, target: 'internet-gateway' }
                    });
                    console.log(`Added edge between routeTable-${routeTableId} and internet-gateway`);
                }
            }
        });

        // 서브넷 노드 추가 및 라우팅 테이블과의 연결
        vpcDetails.Subnets.forEach((subnet, index) => {
            const subnetId = subnet["Subnet ID"];
            nodes.push({
                data: { id: `subnet-${subnetId}`, label: `Subnet: ${subnetId} (${subnet["CIDR Block"]})` },
                position: { x: 200 + index * 150, y: 400 }
            });

            // 서브넷과 라우팅 테이블 연결 확인 및 엣지 생성
            const routeTableId = subnet["RouteTableID"];
            if (routeTableId && routingTableMap[routeTableId]) {
                edges.push({
                    data: { id: `subnet-routeTable-${subnetId}`, source: `subnet-${subnetId}`, target: `routeTable-${routeTableId}` }
                });
                console.log(`Added edge between subnet-${subnetId} and routeTable-${routeTableId}`);
            }
        });

        // 인스턴스 노드 추가 및 서브넷과의 연결
        vpcDetails.Instances.forEach((instance, index) => {
            const instanceId = instance["Instance ID"];
            const subnetId = instance["Subnet ID"];
            nodes.push({
                data: { id: `instance-${instanceId}`, label: `Instance: ${instanceId} (${instance["Instance Type"]})` },
                position: { x: 500, y: 450 + index * 100 }
            });

            // 인스턴스와 서브넷 연결 확인 및 엣지 생성
            if (subnetId) {
                edges.push({
                    data: { id: `subnet-instance-${instanceId}`, source: `subnet-${subnetId}`, target: `instance-${instanceId}` }
                });
                console.log(`Added edge between subnet-${subnetId} and instance-${instanceId}`);
            }
        });

        // Cytoscape 초기화
        if (cyRef.current) {
            cyRef.current.destroy();
        }

        cyRef.current = cytoscape({
            container: document.getElementById('cy'),
            elements: [...nodes, ...edges],
            style: [
                {
                    selector: '#vpc-label',
                    style: {
                        'background-opacity': 0,
                        'color': '#0074D9',
                        'font-size': 24,
                        'text-valign': 'center',
                        'text-halign': 'center'
                    }
                },
                {
                    selector: 'node',
                    style: {
                        'shape': 'round-rectangle',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'background-color': '#ccccff',
                        'label': 'data(label)',
                        'color': '#000',
                        'font-size': 12,
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
            layout: { name: 'preset', padding: 10 }
        });
    }, [vpcDetails]);

    return <div id="cy" style={{ width: '100%', height: '800px' }} />;
};

export default VPCDiagram;
