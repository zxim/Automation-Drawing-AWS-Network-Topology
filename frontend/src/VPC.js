// src/VPC.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Subnet from './Subnet';
import RouteTable from './RouteTable';
import Instance from './Instance';

const VPC = ({ vpc }) => {
  const navigate = useNavigate();

  const handleViewDiagram = () => {
    navigate(`/vpc-diagram/${vpc["VPC ID"]}`);
  };

  return (
    <div className="vpc">
      <h2>VPC: {vpc["VPC ID"]}</h2>
      <p><strong>Name:</strong> {vpc.Name}</p>
      <p><strong>CIDR Block:</strong> {vpc["CIDR Block"]}</p>
      <p><strong>State:</strong> {vpc.State}</p>
      <p><strong>Default:</strong> {vpc.Default ? "Yes" : "No"}</p>

      <h3>Subnets</h3>
      <div className="subnet-list">
        {vpc.Subnets.map((subnet, index) => (
          <Subnet key={index} subnet={subnet} />
        ))}
      </div>

      <h3>Route Tables</h3>
      <div className="route-table-list">
        {vpc.RouteTables.map((routeTable, index) => (
          <RouteTable key={index} routeTable={routeTable} />
        ))}
      </div>

      <h3>Instances</h3>
      <div className="instance-list">
        {vpc.Instances.map((instance, index) => (
          <Instance key={index} instance={instance} />
        ))}
      </div>

      <button onClick={handleViewDiagram} className="view-diagram-button">
        View Diagram
      </button>
    </div>
  );
};

export default VPC;
