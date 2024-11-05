// src/Region.js
import React from 'react';
import VPC from './VPC';

const Region = ({ regionData }) => (
  <div className="region">
    <h1>Region: {regionData.regionName}</h1>
    {regionData.vpcs.map((vpc, index) => (
      <VPC key={index} vpc={vpc} />
    ))}
  </div>
);

export default Region;
