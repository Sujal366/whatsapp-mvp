import React, { useRef, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient, { ensureAuthenticated } from "../services/api";

const SignaturePad: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [customerName, setCustomerName] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        // Set line properties
        context.strokeStyle = "#000000";
        context.lineWidth = 2;
        context.lineCap = "round";
        context.lineJoin = "round";

        // Set canvas background to white
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const getPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    setIsDrawing(true);
    setIsEmpty(false);

    const canvas = canvasRef.current;
    const { x, y } = getPosition(e);

    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.beginPath();
        context.moveTo(x, y);
      }
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const { x, y } = getPosition(e);

    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.lineTo(x, y);
        context.stroke();
      }
    }
  };

  const stopDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignature(null);
    setIsEmpty(true);
  };

  const saveSignature = async () => {
    if (isEmpty || !customerName.trim()) {
      alert("Please provide customer name and signature before saving.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setSaving(true);
    try {
      // Add customer name and timestamp to the signature
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#000000";
        context.font = "14px Arial";
        context.fillText(`Customer: ${customerName}`, 10, canvas.height - 30);
        context.fillText(
          `Date: ${new Date().toLocaleDateString()}`,
          10,
          canvas.height - 10
        );
      }

      const signatureData = canvas.toDataURL("image/png");
      setSignature(signatureData);

      // Ensure agent is authenticated before making the request
      await ensureAuthenticated();

      // Save signature data to backend
      await apiClient.post(`/orders/${orderId}/signature`, {
        signatureData,
        customerName: customerName.trim(),
      });

      alert(
        `✅ Customer signature saved for Order #${orderId}!\n\nSigned by: ${customerName}`
      );
      navigate(`/order/${orderId}`);
    } catch (error: any) {
      console.error("Failed to save signature:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to save signature";
      alert(`❌ Error: ${errorMessage}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

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
            ✍️ Customer Signature
          </h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Digital Signature
            </h2>
            <p className="text-sm text-gray-600">
              Collect customer signature to confirm successful delivery of Order
              #{orderId}
            </p>
          </div>

          {/* Customer Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter customer's full name"
              required
            />
          </div>

          {/* Signature Canvas */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signature *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="border-2 border-gray-300 rounded-md w-full bg-white cursor-crosshair touch-none"
                style={{ touchAction: "none" }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Please sign above using your finger or stylus
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={clearSignature}
              disabled={saving}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              🗑️ Clear Signature
            </button>
            <button
              onClick={saveSignature}
              disabled={saving || isEmpty || !customerName.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                "✅ Save Signature"
              )}
            </button>
          </div>

          {signature && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">
                ✅ Signature captured successfully for {customerName}!
              </p>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Ensure the customer signs clearly within
              the signature area. The signature will be timestamped
              automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
