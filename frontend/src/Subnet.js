// src/Subnet.js
import React from 'react';

const Subnet = ({ subnet }) => (
  <div>
    <p>Subnet ID: {subnet["Subnet ID"]}</p>
    <p>CIDR Block: {subnet["CIDR Block"]}</p>
  </div>
);

export default Subnet;
