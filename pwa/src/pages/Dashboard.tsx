import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ordersAPI } from "../services/api";

interface Order {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await ordersAPI.getAllOrders();
      setOrders(data);

      // Calculate stats
      const stats = data.reduce(
        (acc: any, order: Order) => {
          acc.total++;
          switch (order.status.toLowerCase()) {
            case "pending":
              acc.pending++;
              break;
            case "in_progress":
            case "processing":
              acc.inProgress++;
              break;
            case "completed":
            case "delivered":
              acc.completed++;
              break;
          }
          return acc;
        },
        { total: 0, pending: 0, inProgress: 0, completed: 0 }
      );

      setStats(stats);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/profile"
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
          </div>

          {orders.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No orders available
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.slice(0, 10).map((order) => (
                <Link
                  key={order.id}
                  to={`/order/${order.id}`}
                  className="block px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">
                          Order #{order.id}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        ₹{order.total_amount} •{" "}
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
