import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterSelectPage from './pages/RegisterSelectPage';
import PharmacyRegisterPage from './pages/PharmacyRegisterPage';
import PharmacyPendingPage from './pages/PharmacyPendingPage';
import PharmacyRejectedPage from './pages/PharmacyRejectedPage';
import PharmacyApprovedPage from './pages/PharmacyApprovedPage';
import AdminWelcomePage from './pages/AdminWelcomePage';
import PendingPage from './pages/PendingPage';
import DeclinedPage from './pages/DeclinedPage';
import DashboardPage from './pages/DashboardPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AvailabilityPage from './pages/AvailabilityPage';
import PatientsPage from './pages/PatientsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ExtraRequestsPage from './pages/ExtraRequestsPage';
import DoctorChanellingSearchPage from './pages/DoctorChanellingSearchPage';

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

        {/* Unified registration entry — pick Doctor or Pharmacy */}
        <Route path="/register" element={<RegisterSelectPage />} />

        {/* Doctor registration (existing form — untouched) */}
        <Route path="/doctor/register" element={<RegisterPage />} />

        {/* Pharmacy registration flow */}
        <Route path="/pharmacy/register"   element={<PharmacyRegisterPage />} />
        <Route path="/pharmacy/pending"    element={<PharmacyPendingPage />} />
        <Route path="/pharmacy/rejected"   element={<PharmacyRejectedPage />} />
        <Route path="/pharmacy/approved"   element={<PharmacyApprovedPage />} />


        {/* Admin auth flow */}
        <Route path="/admin/welcome"  element={<AdminWelcomePage />} />

        <Route path="/pending"  element={<PendingPage />} />
        <Route path="/declined" element={<DeclinedPage />} />
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
        <Route
            path="/chanelling-search"
            element={
                <PrivateRoute>
                    <DoctorChanellingSearchPage />
                </PrivateRoute>
            }
        />
            <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
};

export default AppRoutes;