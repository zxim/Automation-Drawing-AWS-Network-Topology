import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container); // createRoot를 사용하여 React 18 방식으로 변경
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
