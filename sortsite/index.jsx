import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// eslint-disable-next-line no-unused-vars
import React from 'react';
import App from './src/App';
import './src/index.css';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
