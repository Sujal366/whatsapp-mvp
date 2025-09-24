import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Profile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 flex items-center">
          <Link to="/" className="mr-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">User Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Username</label>
              <p className="text-gray-900">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p className="text-gray-900">{user?.email || "Not provided"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Role</label>
              <p className="text-gray-900">{user?.role || "Delivery Agent"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
