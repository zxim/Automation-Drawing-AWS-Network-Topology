// src/Instance.js
import React from 'react';

const Instance = ({ instance }) => (
  <div>
    <p>Instance ID: {instance["Instance ID"]}</p>
    <p>Instance Type: {instance["Instance Type"]}</p>
    <p>Private IP: {instance["Private IP"]}</p>
    <p>Public IP: {instance["Public IP"]}</p>
  </div>
);

export default Instance;
