import React from "react";
import { useParams, Link } from "react-router-dom";

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

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
          <h1 className="text-xl font-semibold text-gray-900">Order #{id}</h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Order Details</h2>
          <p className="text-gray-600">
            Order details will be implemented next...
          </p>

          <div className="mt-6 flex flex-col space-y-3">
            <Link
              to={`/camera/${id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-center"
            >
              📷 Capture Photo
            </Link>
            <Link
              to={`/signature/${id}`}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-center"
            >
              ✍️ Capture Signature
            </Link>
            <Link
              to={`/kyc/${id}`}
              className="bg-purple-600 text-white px-4 py-2 rounded-md text-center"
            >
              👤 KYC Form
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
