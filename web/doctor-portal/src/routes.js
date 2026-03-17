import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AvailabilityPage from './pages/AvailabilityPage';
import PatientsPage from './pages/PatientsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ExtraRequestsPage from './pages/ExtraRequestsPage';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
    return (
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
            path="/dashboard"
            element={
                <PrivateRoute>
                    <DashboardPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/appointments"
            element={
                <PrivateRoute>
                    <AppointmentsPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/availability"
            element={
                <PrivateRoute>
                    <AvailabilityPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/patients"
            element={
                <PrivateRoute>
                    <PatientsPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/profile"
            element={
                <PrivateRoute>
                    <ProfilePage />
                </PrivateRoute>
            }
        />
        <Route
            path="/settings"
            element={
                <PrivateRoute>
                    <SettingsPage />
                </PrivateRoute>
            }
        />
        <Route
            path="/extra-requests"
            element={
                <PrivateRoute>
                    <ExtraRequestsPage />
                </PrivateRoute>
            }
        />
            <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
};

export default AppRoutes;