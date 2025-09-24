import React from "react";
import { useParams, Link } from "react-router-dom";

const KYCForm: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 flex items-center">
          <Link to={`/order/${orderId}`} className="mr-4">
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
          <h1 className="text-xl font-semibold text-gray-900">
            👤 KYC Verification
          </h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 mb-4">
            KYC form will be implemented next...
          </p>
        </div>
      </div>
    </div>
  );
};

export default KYCForm;
