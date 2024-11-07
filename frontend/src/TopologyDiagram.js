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
    const azSpacing = 150; // AZ 간의 간격
    const subnetSpacing = 50;
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
        });

        // VPC node within Region
        elements.push({
            data: { id: 'vpc', label: `VPC: ${topologyData.vpcName}`, parent: 'region' },
            classes: 'vpc',
        });

        // AZs
        topologyData.azs.forEach((az, azIndex) => {
            const azNodeId = `az-${azIndex}`;
            const azPositionX = 300; // AZ의 x축 위치 (세로로 나열)
            const azPositionY = 100 + azIndex * (azHeight + azSpacing); // AZ 간의 세로 간격을 설정

            elements.push({
                data: { id: azNodeId, label: `AZ: ${az.name}`, parent: 'vpc' },
                classes: 'az',
                position: { x: azPositionX, y: azPositionY }
            });

            // 같은 AZ 내의 서브넷을 같은 y값에 배치하고, 인스턴스를 서브넷의 중앙에 위치
            az.subnets.forEach((subnet, subnetIndex) => {
                const subnetNodeId = `subnet-${azIndex}-${subnetIndex}`;
                const subnetPositionX = azPositionX + subnetIndex * (subnetWidth + subnetSpacing); // 서브넷 가로 위치
                const subnetPositionY = azPositionY; // 같은 AZ 내에서는 같은 y값에 위치

                elements.push({
                    data: { id: subnetNodeId, label: `Subnet: ${subnet.name}`, parent: azNodeId },
                    classes: 'subnet',
                    position: { x: subnetPositionX, y: subnetPositionY }
                });

                subnet.instances.forEach((instance, instanceIndex) => {
                    const instanceNodeId = `instance-${azIndex}-${subnetIndex}-${instanceIndex}`;
                    const instancePositionX = subnetPositionX; // 서브넷의 x값과 동일
                    const instancePositionY = subnetPositionY; // 서브넷 중앙에 인스턴스를 배치

                    elements.push({
                        data: { id: instanceNodeId, label: `Instance: ${instance.name}`, parent: subnetNodeId },
                        classes: 'instance',
                        position: { x: instancePositionX, y: instancePositionY },
                        style: { width: instanceSize, height: instanceSize }
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
                    selector: '.region',
                    style: {
                        'background-opacity': 0,
                        'border-width': 3,
                        'border-color': '#4b8bbe',
                        'label': 'data(label)',
                        'width': regionWidth,
                        'height': regionHeight,
                        'shape': 'rectangle'
                    }
                },
                {
                    selector: '.vpc',
                    style: {
                        'background-opacity': 0,
                        'border-width': 3,
                        'border-color': '#1f78b4',
                        'label': 'data(label)',
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
                        'min-width': subnetWidth,
                        'min-height': subnetHeight,
                        'padding-left': 10,
                        'padding-right': 10,
                        'padding-top': 10,
                        'padding-bottom': 10,
                        'shape': 'rectangle'
                    }
                },
                {
                    selector: '.instance',
                    style: {
                        'background-color': '#a6cee3',
                        'label': 'data(label)',
                        'width': instanceSize,
                        'height': instanceSize,
                        'min-width': instanceSize,
                        'min-height': instanceSize,
                        'shape': 'rectangle'
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
