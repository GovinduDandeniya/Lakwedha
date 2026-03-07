import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './assets/styles/index.css';
import 'react-toastify/dist/ReactToastify.css';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <AuthProvider>
            <App />
            <ToastContainer position="top-right" autoClose={3000} />
            </AuthProvider>
        </BrowserRouter>
        </QueryClientProvider>
    </React.StrictMode>
);