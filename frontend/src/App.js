import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/toaster";

// Auth Components
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";

// Layout Components
import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";

// Feature Components
import Dashboard from "./components/Dashboard/Dashboard";
import MembersList from "./components/Members/MembersList";
import MembershipCard from "./components/Card/MembershipCard";
import PlansList from "./components/Plans/PlansList";
import PublicPlans from "./components/Plans/PublicPlans";
import AttendanceTracker from "./components/Attendance/AttendanceTracker";
import PaymentsList from "./components/Payments/PaymentsList";
import ReportsAnalytics from "./components/Reports/ReportsAnalytics";
import GymSettings from "./components/Settings/GymSettings";
import BalanceManagement from "./components/Balance/BalanceManagement";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Layout with Sidebar and Navbar
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicPlans />} />
      <Route path="/pricing" element={<PublicPlans />} />
      <Route path="/login" element={<Login />} />
      {/* Signup disabled - redirect to login */}
      <Route path="/signup" element={<Navigate to="/login" replace />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MembersList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-card"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MembershipCard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlansList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AttendanceTracker />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PaymentsList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-payments"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PaymentsList />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ReportsAnalytics />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <GymSettings />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/balance"
        element={
          <ProtectedRoute>
            <AppLayout>
              <BalanceManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
