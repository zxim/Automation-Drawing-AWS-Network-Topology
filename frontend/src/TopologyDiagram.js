import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const TopologyDiagram = ({ topologyData, regionName }) => {
    const cyRef = useRef(null);

    // Constants for dimensions
    const regionFixedX = 400;  // 리전 박스의 x 고정 위치
    const regionFixedY = 100;  // 리전 박스의 y 고정 위치
    const regionWidth = 1200;
    const regionHeight = 850;
    const vpcWidth = 850; // VPC의 너비 설정
    const vpcHeight = 850; // VPC의 높이 설정
    const subnetWidth = 200;
    const subnetHeight = 200;
    const azWidth = topologyData && topologyData.azs.length > 0 
        ? (topologyData.azs[0].subnets.length * subnetWidth) - 50 
        : 400;
    const azHeight = 250;
    const regionToVpcSpacing = 200;
    const vpcToAzSpacing = 200;
    const azSpacing = 50; 
    const subnetSpacing = 50;
    const instanceSize = 80;

    useEffect(() => {
        if (!topologyData || !topologyData.vpcName) {
            console.warn("Topology data is not available.");
            return;
        }

        const elements = [];

        // Region Node
        elements.push({
            data: { id: 'region', label: `Region: ${regionName}` },
            classes: 'region',
            position: { x: regionFixedX, y: regionFixedY }
        });        

        // VPC Node
        elements.push({
            data: { id: 'vpc', label: `VPC: ${topologyData.vpcName}`, parent: 'region' },
            classes: 'vpc',
            position: { x: regionFixedX, y: regionFixedY + vpcToAzSpacing }
        });

        topologyData.azs?.forEach((az, azIndex) => {
            const azNodeId = `az-${azIndex}`;
            const azPositionX = 300;
            const azPositionY = regionToVpcSpacing + vpcToAzSpacing + azIndex * (azHeight + azSpacing);

            elements.push({
                data: { id: azNodeId, label: `AZ: ${az.name}`, parent: 'vpc' },
                classes: 'az',
                position: { x: azPositionX, y: azPositionY }
            });

            const sortedSubnets = [...az.subnets].sort((a, b) => (a.isNatConnected ? -1 : 1));

            sortedSubnets.forEach((subnet, subnetIndex) => {
                const subnetNodeId = `subnet-${azIndex}-${subnetIndex}`;
                const subnetPositionX = azPositionX + subnetIndex * (subnetWidth + subnetSpacing);
                const subnetPositionY = azPositionY;

                const isNatConnected = subnet.isNatConnected;
                const subnetClass = isNatConnected ? 'public-subnet' : 'private-subnet';

                elements.push({
                    data: { id: subnetNodeId, label: subnet.name, parent: azNodeId },
                    classes: `subnet ${subnetClass}`,
                    position: { x: subnetPositionX, y: subnetPositionY }
                });

                const routeTablePositionX = subnetPositionX + 20;
                const routeTablePositionY = subnetPositionY + subnetHeight / 2 - 20;

                elements.push({
                    data: { id: `routeTable-${azIndex}-${subnetIndex}`, label: 'Route Table', parent: subnetNodeId },
                    classes: 'route-table',
                    position: { x: routeTablePositionX, y: routeTablePositionY },
                    style: { width: 60, height: 60 }
                });

                const infoPositionX = routeTablePositionX + 120;
                const infoPositionY = routeTablePositionY;

                elements.push({
                    data: {
                        id: isNatConnected ? `nat-info-${azIndex}-${subnetIndex}` : `private-instance-${azIndex}-${subnetIndex}`,
                        label: isNatConnected ? 'NAT' : 'Private Instance',
                        parent: subnetNodeId
                    },
                    classes: isNatConnected ? 'nat-info' : 'private-instance',
                    position: { x: infoPositionX, y: infoPositionY }
                });
            });
        });

        if (cyRef.current) {
            cyRef.current.destroy();
        }

        cyRef.current = cytoscape({
            container: document.getElementById('cy'),
            elements: elements,
            style: [
                {
                    selector: '.region',
                    style: {
                        'background-opacity': 0,
                        'border-width': 3,
                        'border-color': '#3c3c3c',
                        'label': 'data(label)',
                        'width': regionWidth,
                        'height': regionHeight,
                        'shape': 'rectangle',
                        'background-image': 'url("/icons/region.png")',
                        'background-width': '35px',
                        'background-height': '30px',
                        'background-position-x': '5px',
                        'background-position-y': '5px'
                    }
                },
                {
                    selector: '.vpc',
                    style: {
                        'background-opacity': 0,
                        'border-width': 3,
                        'border-color': '#B24BE5',
                        'label': 'data(label)',
                        'background-image': 'url("/icons/vpc.png")',
                        'background-width': '35px',
                        'background-height': '30px',
                        'background-position-x': '5px',
                        'background-position-y': '5px'
                    }
                },
                {
                    selector: '.az',
                    style: {
                        'background-opacity': 0,
                        'border-width': 2,
                        'border-color': '#00EBFF',
                        'label': 'data(label)',
                        'width': azWidth,
                        'height': azHeight,
                        'shape': 'rectangle',
                        'min-height': azHeight
                    }
                },
                {
                    selector: '.subnet',
                    style: {
                        'background-opacity': 0,
                        'border-width': 2,
                        'label': 'data(label)',
                        'text-valign': 'top',
                        'text-halign': 'center',
                        'width': subnetWidth,
                        'height': subnetHeight,
                        'shape': 'rectangle',
                        'min-width': subnetWidth,
                        'min-height': subnetHeight
                    }
                },
                {
                    selector: '.public-subnet',
                    style: {
                        'border-color': 'green',
                        'background-image': 'url("/icons/public-subnet.png")',
                        'background-width': '25px',
                        'background-height': '25px',
                        'background-position-x': '5px',
                        'background-position-y': '5px'
                    }
                },
                {
                    selector: '.private-subnet',
                    style: {
                        'border-color': 'blue',
                        'background-image': 'url("/icons/private-subnet.png")',
                        'background-width': '25px',
                        'background-height': '25px',
                        'background-position-x': '5px',
                        'background-position-y': '5px'
                    }
                },
                {
                    selector: '.nat-info',
                    style: {
                        'background-opacity': 0.1,
                        'border-width': 2,
                        'border-color': '#ffa07a',
                        'label': 'data(label)',
                        'text-valign': 'top',
                        'text-halign': 'center',
                        'width': instanceSize,
                        'height': instanceSize,
                        'shape': 'rectangle',
                        'background-image': 'url("/icons/NAT-Gateway.png")',
                        'background-width': '50px',
                        'background-height': '45px',
                        'background-position-x': '50%',
                        'background-position-y': '50%'
                    }
                },
                {
                    selector: '.private-instance',
                    style: {
                        'background-opacity': 0.1,
                        'border-width': 2,
                        'border-color': '#a6cee3',
                        'label': 'data(label)',
                        'text-valign': 'top',
                        'text-halign': 'center',
                        'width': instanceSize,
                        'height': instanceSize,
                        'shape': 'rectangle',
                        'background-image': 'url("/icons/instance.png")'
                    }
                },
                {
                    selector: '.route-table',
                    style: {
                        'background-opacity': 0,
                        'border-width': 2,
                        'border-color': '#6a3d9a',
                        'label': 'data(label)',
                        'width': 60,
                        'height': 60,
                        'shape': 'rectangle',
                        'background-image': 'url("/icons/route-table.png")'
                    }
                }
            ],
            layout: { name: 'preset' },
            zoom: 1,
            pan: { x: 0, y: 0 }
        });
    }, [topologyData, regionName]);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            {!topologyData && <p>Loading topology data...</p>}
            <div id="cy" style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
};

export default TopologyDiagram;
