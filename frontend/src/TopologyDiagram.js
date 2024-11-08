import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const DynamicTopology = ({ topologyData, regionName }) => {
    const cyRef = useRef(null);

    // Constants for dimensions
    const regionWidth = 1200;
    const regionHeight = 800;
    const subnetWidth = 350;
    const subnetHeight = 250;
    const azWidth = topologyData && topologyData.azs.length > 0 
        ? (topologyData.azs[0].subnets.length * subnetWidth) - 100 
        : 400;
    const azHeight = 300;
    const regionToVpcSpacing = 200;
    const vpcToAzSpacing = 200;
    const azSpacing = 150;
    const subnetSpacing = 100;
    const instanceSize = 100;

    useEffect(() => {
        if (!topologyData || !topologyData.vpcName) {
            console.warn("Topology data is not available.");
            return;
        }

        const elements = [];

        // Region node
        elements.push({
            data: { id: 'region', label: `Region: ${regionName}` },
            classes: 'region',
            position: { x: regionWidth / 2, y: regionToVpcSpacing }
        });

        // VPC node within Region
        elements.push({
            data: { id: 'vpc', label: `VPC: ${topologyData.vpcName}`, parent: 'region' },
            classes: 'vpc',
            position: { x: regionWidth / 2, y: regionToVpcSpacing + 150 }
        });

        // AZs (only if present)
        topologyData.azs?.forEach((az, azIndex) => {
            const azNodeId = `az-${azIndex}`;
            const azPositionX = 300;
            const azPositionY = regionToVpcSpacing + 150 + azIndex * (azHeight + vpcToAzSpacing);

            elements.push({
                data: { id: azNodeId, label: `AZ: ${az.name}`, parent: 'vpc' },
                classes: 'az',
                position: { x: azPositionX, y: azPositionY }
            });

            // Subnets (only if present)
            az.subnets?.forEach((subnet, subnetIndex) => {
                const subnetNodeId = `subnet-${azIndex}-${subnetIndex}`;
                const subnetPositionX = azPositionX + subnetIndex * (subnetWidth + subnetSpacing);
                const subnetPositionY = azPositionY;

                elements.push({
                    data: { id: subnetNodeId, label: `Subnet: ${subnet.name}`, parent: azNodeId },
                    classes: 'subnet',
                    position: { x: subnetPositionX, y: subnetPositionY }
                });

                // Fixed position for Route Table in the subnet
                const routeTablePositionX = subnetPositionX + 20;
                const routeTablePositionY = subnetPositionY + subnetHeight / 2 - 20;

                elements.push({
                    data: { id: `routeTable-${azIndex}-${subnetIndex}`, label: 'Route Table', parent: subnetNodeId },
                    classes: 'route-table',
                    position: { x: routeTablePositionX, y: routeTablePositionY },
                    style: { width: 60, height: 60 }
                });

                // Fixed position for Instance in the subnet
                const instancePositionX = routeTablePositionX + 120;
                const instancePositionY = routeTablePositionY;

                subnet.instances?.forEach((instance, instanceIndex) => {
                    const instanceNodeId = `instance-${azIndex}-${subnetIndex}-${instanceIndex}`;
                    
                    elements.push({
                        data: { id: instanceNodeId, label: `Instance: ${instance.name}`, parent: subnetNodeId },
                        classes: 'instance',
                        position: { x: instancePositionX, y: instancePositionY },
                        style: { width: instanceSize, height: instanceSize }
                    });
                });
            });
        });

        // Gateway (if present)
        if (topologyData.gateway) {
            elements.push({
                data: { id: 'gateway', label: `Gateway: ${topologyData.gateway}`, parent: 'vpc' },
                classes: 'gateway',
                position: { x: regionWidth / 2, y: regionToVpcSpacing + 250 }
            });
        }

        // Route Table (if present)
        if (topologyData.routeTable) {
            elements.push({
                data: { id: 'routeTable', label: `Route Table: ${topologyData.routeTable}`, parent: 'vpc' },
                classes: 'routeTable',
                position: { x: regionWidth / 2 + 200, y: regionToVpcSpacing + 250 }
            });
        }

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
                        'border-color': '#4b8bbe',
                        'label': 'data(label)',
                        'width': regionWidth,
                        'height': regionHeight,
                        'shape': 'rectangle',
                        'background-image': 'url("/icons/region.png")',
                        'background-fit': 'none',
                        'background-clip': 'none',
                        'background-width': '25px',
                        'background-height': '20px',
                        'background-position-x': '5px',
                        'background-position-y': '5px'
                    }
                },
                {
                    selector: '.vpc',
                    style: {
                        'background-opacity': 0,
                        'border-width': 3,
                        'border-color': '#1f78b4',
                        'label': 'data(label)',
                        'background-image': 'url("/icons/vpc.png")',
                        'background-fit': 'none',
                        'background-clip': 'none',
                        'background-width': '25px',
                        'background-height': '20px',
                        'background-position-x': '5px',
                        'background-position-y': '5px'
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
                        'min-width': azWidth,
                        'min-height': azHeight,
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
                        'width': subnetWidth,
                        'height': subnetHeight,
                        'shape': 'rectangle',
                        'min-width': subnetWidth,
                        'min-height': subnetHeight,
                        'background-image': 'url("/icons/subnet.png")',
                        'background-fit': 'none',
                        'background-clip': 'none',
                        'background-width': '25px',
                        'background-height': '25px',
                        'background-position-x': '5px',
                        'background-position-y': '5px'
                    }
                },
                {
                    selector: '.instance',
                    style: {
                        'background-opacity': 0,
                        'border-width': 2,
                        'border-color': '#a6cee3',
                        'label': 'data(label)',
                        'width': instanceSize,
                        'height': instanceSize,
                        'shape': 'rectangle',
                        'background-image': 'url("/icons/instance.png")',
                        'background-fit': 'none',
                        'background-clip': 'none',
                        'background-width': '60px',
                        'background-height': '60px',
                        'background-position-x': '50%',
                        'background-position-y': '50%'
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
                        'background-image': 'url("/icons/route-table.png")',
                        'background-fit': 'cover',
                        'background-position-x': '50%',
                        'background-position-y': '50%',
                        'shape': 'rectangle'
                    }
                },
                {
                    selector: '.gateway',
                    style: {
                        'background-opacity': 0,
                        'border-width': 2,
                        'border-color': '#d62728',
                        'label': 'data(label)',
                        'shape': 'ellipse',
                        'width': 50,
                        'height': 50,
                        'background-image': 'url("/icons/gateway.png")',
                        'background-fit': 'cover'
                    }
                },
                {
                    selector: '.routeTable',
                    style: {
                        'background-opacity': 0,
                        'border-width': 2,
                        'border-color': '#9467bd',
                        'label': 'data(label)',
                        'shape': 'rectangle',
                        'width': 100,
                        'height': 50,
                        'background-image': 'url("/icons/routetable.png")',
                        'background-fit': 'cover'
                    }
                }
            ],
            layout: { name: 'preset' },
            zoom: 1,
            pan: { x: 0, y: 0 }
        });
    }, [topologyData, regionName, regionWidth, regionHeight, azWidth, azHeight, subnetWidth, subnetHeight, azSpacing, subnetSpacing, instanceSize]);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            {!topologyData && <p>Loading topology data...</p>}
            <div id="cy" style={{ width: '100%', height: '100%' }}></div>
        </div>
    );
};

export default DynamicTopology;
