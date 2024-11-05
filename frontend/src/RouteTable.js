// src/RouteTable.js
import React from 'react';

const RouteTable = ({ routeTable }) => (
  <div>
    <p>Route Table ID: {routeTable["Route Table ID"]}</p>
    {routeTable.Routes.map((route, index) => (
      <p key={index}>Destination: {route.Destination}, Target: {route.Target}</p>
    ))}
  </div>
);

export default RouteTable;
