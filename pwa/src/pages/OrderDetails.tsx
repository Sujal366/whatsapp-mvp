import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient, { ensureAuthenticated } from "../services/api";

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
}

interface OrderDetail {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  phone_number: string;
  items: OrderItem[];
  photo_captured?: boolean;
  photo_captured_at?: string;
  signature_captured?: boolean;
  signature_captured_at?: string;
  customer_name?: string;
  kyc_completed?: boolean;
  kyc_completed_at?: string;
  updated_at?: string;
}

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!id) return;

      try {
        // Ensure agent is authenticated before making the request
        await ensureAuthenticated();
        
        const response = await apiClient.get(`/orders/${id}`);
        setOrder(response.data.order);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // const getStatusDescription = (status: string) => {
  //   switch (status) {
  //     case "pending":
  //       return "No agent actions completed yet";
  //     case "in_progress":
  //       return "Agent actions in progress";
  //     case "delivered":
  //       return "Delivery confirmed with photo and signature";
  //     case "completed":
  //       return "All agent actions completed";
  //     case "cancelled":
  //       return "Order was cancelled";
  //     default:
  //       return "Status unknown";
  //   }
  // };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || "Order not found"}</p>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="px-4 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-medium">Order Summary</h2>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                order.status
              )}`}
            >
              {order.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Order ID</p>
              <p className="font-medium">#{order.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone Number</p>
              <p className="font-medium">{order.phone_number}</p>
            </div>
            <div>
              <p className="text-gray-500">Order Date</p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="font-medium text-green-600">
                ₹{order.total_amount}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b last:border-b-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{item.price * item.quantity}</p>
                  <p className="text-sm text-gray-500">₹{item.price} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status */}
        {/* <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Current Status</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  order.status === "pending"
                    ? "bg-yellow-500"
                    : order.status === "in_progress"
                    ? "bg-blue-500"
                    : order.status === "delivered"
                    ? "bg-green-500"
                    : order.status === "completed"
                    ? "bg-emerald-500"
                    : "bg-gray-400"
                }`}
              ></div>
              <div>
                <p className="font-medium text-gray-900">
                  {order.status.toUpperCase().replace("_", " ")}
                </p>
                <p className="text-sm text-gray-500">
                  {getStatusDescription(order.status)}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                order.status
              )}`}
            >
              {order.status.toUpperCase().replace("_", " ")}
            </span>
          </div>
        </div> */}

        {/* Agent Progress Tracking */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Delivery Progress</h3>
          <div className="space-y-3">
            {/* Photo Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    order.photo_captured ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  {order.photo_captured ? (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs text-gray-600">1</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">Delivery Photo</p>
                  <p className="text-sm text-gray-500">
                    {order.photo_captured
                      ? `Captured on ${new Date(
                          order.photo_captured_at!
                        ).toLocaleDateString()}`
                      : "Not captured yet"}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  order.photo_captured
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {order.photo_captured ? "Completed" : "Pending"}
              </span>
            </div>

            {/* Signature Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    order.signature_captured ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  {order.signature_captured ? (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs text-gray-600">2</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">Customer Signature</p>
                  <p className="text-sm text-gray-500">
                    {order.signature_captured
                      ? `Signed by ${order.customer_name} on ${new Date(
                          order.signature_captured_at!
                        ).toLocaleDateString()}`
                      : "Not captured yet"}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  order.signature_captured
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {order.signature_captured ? "Completed" : "Pending"}
              </span>
            </div>

            {/* KYC Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    order.kyc_completed ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  {order.kyc_completed ? (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs text-gray-600">3</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">KYC Verification</p>
                  <p className="text-sm text-gray-500">
                    {order.kyc_completed
                      ? `Completed on ${new Date(
                          order.kyc_completed_at!
                        ).toLocaleDateString()}`
                      : "Not completed yet"}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  order.kyc_completed
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {order.kyc_completed ? "Completed" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium mb-4">Agent Actions</h3>
          <div className="flex flex-col space-y-3">
            <Link
              to={`/camera/${id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-center font-medium transition-colors"
            >
              📷 Capture Delivery Photo
            </Link>
            <Link
              to={`/signature/${id}`}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md text-center font-medium transition-colors"
            >
              ✍️ Capture Customer Signature
            </Link>
            <Link
              to={`/kyc/${id}`}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md text-center font-medium transition-colors"
            >
              👤 Complete KYC Verification
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
