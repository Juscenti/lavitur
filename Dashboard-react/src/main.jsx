import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AuthHandoff from './components/AuthHandoff';
import App from './App';
import './styles/admin.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthHandoff>
        <App />
      </AuthHandoff>
    </BrowserRouter>
  </React.StrictMode>
);
