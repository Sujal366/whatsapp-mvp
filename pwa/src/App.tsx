import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard.tsx";
import OrderDetails from "./pages/OrderDetails.tsx";
import CameraCapture from "./pages/CameraCapture.tsx";
import SignaturePad from "./pages/SignaturePad.tsx";
import KYCForm from "./pages/KYCForm.tsx";
import Profile from "./pages/Profile.tsx";
import LoadingSpinner from "./components/LoadingSpinner";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/:id"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/camera/:orderId"
          element={
            <ProtectedRoute>
              <CameraCapture />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signature/:orderId"
          element={
            <ProtectedRoute>
              <SignaturePad />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc/:orderId"
          element={
            <ProtectedRoute>
              <KYCForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
