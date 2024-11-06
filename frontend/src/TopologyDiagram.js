import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const DynamicTopology = ({ topologyData }) => {
    const cyRef = useRef(null);

    // Set dynamic dimensions based on topology data
    const azCount = topologyData?.azs.length || 0;
    const maxSubnets = topologyData ? Math.max(...topologyData.azs.map(az => az.subnets.length)) : 0;
    const vpcWidth = 1000;  // Fixed width for VPC
    const azWidth = vpcWidth - 100;  // AZ width slightly smaller than VPC
    const azHeight = 100 + maxSubnets * 50;  // Reduced AZ height
    const vpcHeight = azCount * (azHeight + 50);  // VPC height based on AZ count

    useEffect(() => {
        if (!topologyData || !topologyData.vpcName) {
            console.warn("Topology data is not available.");
            return;
        }

        const elements = [];
        
        // VPC node
        elements.push({
            data: { id: 'vpc', label: `VPC: ${topologyData.vpcName}` },
            classes: 'vpc',
            position: { x: vpcWidth / 2, y: vpcHeight / 2 }
        });

        // Add AZs and subnets
        topologyData.azs.forEach((az, azIndex) => {
            const azNodeId = `az-${azIndex}`;
            const azPositionX = (vpcWidth - azWidth) / 2;
            const azPositionY = 100 + azIndex * (azHeight + 50);

            elements.push({
                data: { id: azNodeId, label: `AZ: ${az.name}` },
                classes: 'az',
                position: { x: azPositionX + azWidth / 2, y: azPositionY + azHeight / 2 }
            });

            az.subnets.forEach((subnet, subnetIndex) => {
                const subnetNodeId = `subnet-${azIndex}-${subnetIndex}`;
                const subnetWidth = 180;  // Fixed width for subnets

                const subnetPositionX = azPositionX + 100 + subnetIndex * (subnetWidth + 50);
                const subnetPositionY = azPositionY + 50;

                elements.push({
                    data: { id: subnetNodeId, label: `Subnet: ${subnet.name}` },
                    classes: 'subnet',
                    position: { x: subnetPositionX, y: subnetPositionY }
                });

                // Add Route Table, NAT Gateway, Instances inside the subnet
                if (subnet.routeTable) {
                    elements.push({
                        data: { id: `routeTable-${subnetNodeId}`, label: `Route Table` },
                        classes: 'route-table',
                        position: { x: subnetPositionX - 50, y: subnetPositionY + 50 }
                    });
                }

                if (subnet.gateway) {
                    elements.push({
                        data: { id: `gateway-${subnetNodeId}`, label: `NAT Gateway` },
                        classes: 'gateway',
                        position: { x: subnetPositionX + 50, y: subnetPositionY + 50 }
                    });
                }

                subnet.instances.forEach((instance, instanceIndex) => {
                    const instanceNodeId = `instance-${azIndex}-${subnetIndex}-${instanceIndex}`;
                    const instancePositionY = subnetPositionY + 100 + instanceIndex * 30;

                    elements.push({
                        data: { id: instanceNodeId, label: `Instance: ${instance.name}` },
                        classes: 'instance',
                        position: { x: subnetPositionX, y: instancePositionY }
                    });
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
                    selector: '.vpc',
                    style: {
                        'background-opacity': 0,
                        'border-width': 3,
                        'border-color': '#1f78b4',
                        'label': 'data(label)',
                        'width': vpcWidth,
                        'height': vpcHeight,
                        'shape': 'rectangle'
                    }
                },
                {
                    selector: '.az',
                    style: {
                        'background-opacity': 0,
                        'border-width': 2,
                        'border-color': '#33a02c',
                        'label': 'data(label)',
                        'width': azWidth,
                        'height': azHeight,
                        'shape': 'rectangle'
                    }
                },
                {
                    selector: '.subnet',
                    style: {
                        'background-opacity': 0,
                        'border-width': 2,
                        'border-color': '#ff7f00',
                        'label': 'data(label)',
                        'width': 180,
                        'height': 100 + 30 * maxSubnets,
                        'shape': 'rectangle'
                    }
                },
                {
                    selector: '.route-table',
                    style: {
                        'background-color': '#ffff99',
                        'label': 'data(label)',
                        'width': 100,
                        'height': 50,
                        'shape': 'rectangle'
                    }
                },
                {
                    selector: '.gateway',
                    style: {
                        'background-color': '#ffcc99',
                        'label': 'data(label)',
                        'width': 100,
                        'height': 50,
                        'shape': 'rectangle'
                    }
                },
                {
                    selector: '.instance',
                    style: {
                        'background-color': '#a6cee3',
                        'label': 'data(label)',
                        'width': 100,
                        'height': 30,
                        'shape': 'rectangle'
                    }
                }
            ],
            layout: { name: 'preset' }
        });
    }, [topologyData, azHeight, vpcHeight, azWidth, vpcWidth, maxSubnets]);

    return (
        <div style={{ width: '100%', height: 'auto' }}>
            {!topologyData && <p>Loading topology data...</p>}
            <div id="cy" style={{ width: '100%', height: `${vpcHeight + 100}px` }}></div>
        </div>
    );
};

export default DynamicTopology;
