import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";

const SignaturePad: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x =
        "touches" in e
          ? e.touches[0].clientX - rect.left
          : e.clientX - rect.left;
      const y =
        "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

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
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x =
        "touches" in e
          ? e.touches[0].clientX - rect.left
          : e.clientX - rect.left;
      const y =
        "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

      const context = canvas.getContext("2d");
      if (context) {
        context.lineTo(x, y);
        context.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignature(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL("image/png");
      setSignature(signatureData);
      // Here you would typically upload to your backend
      console.log("Signature saved:", signatureData);
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
            ✍️ Digital Signature
          </h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 mb-4">
            Please sign below to confirm delivery:
          </p>

          <canvas
            ref={canvasRef}
            width={350}
            height={200}
            className="border-2 border-gray-300 rounded-md mb-4 w-full touch-none"
            style={{ touchAction: "none" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          <div className="flex space-x-3">
            <button
              onClick={clearSignature}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Clear
            </button>
            <button
              onClick={saveSignature}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md"
            >
              Save Signature
            </button>
          </div>

          {signature && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">
                ✅ Signature captured successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
