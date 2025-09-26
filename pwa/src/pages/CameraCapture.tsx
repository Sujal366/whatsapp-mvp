import React, { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient, { ensureAuthenticated } from "../services/api";

const CameraCapture: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(
        "Camera access denied or not available. Please enable camera permissions and try again."
      );
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        // Set canvas size to a reasonable resolution for delivery photos
        const video = videoRef.current;
        const maxWidth = 800; // Limit width to 800px
        const maxHeight = 600; // Limit height to 600px
        
        let { videoWidth, videoHeight } = video;
        
        // Calculate scaled dimensions while maintaining aspect ratio
        if (videoWidth > maxWidth || videoHeight > maxHeight) {
          const aspectRatio = videoWidth / videoHeight;
          if (videoWidth > videoHeight) {
            videoWidth = maxWidth;
            videoHeight = maxWidth / aspectRatio;
          } else {
            videoHeight = maxHeight;
            videoWidth = maxHeight * aspectRatio;
          }
        }
        
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        context.drawImage(video, 0, 0, videoWidth, videoHeight);

        // Add timestamp overlay
        const timestamp = new Date().toLocaleString();
        context.fillStyle = "rgba(0, 0, 0, 0.7)";
        context.fillRect(10, 10, 300, 60);
        context.fillStyle = "white";
        context.font = "16px Arial";
        context.fillText(`Order #${orderId}`, 20, 35);
        context.fillText(`${timestamp}`, 20, 55);

        // Use lower quality (0.5) to reduce file size
        const finalImageData = canvasRef.current.toDataURL("image/jpeg", 0.5);
        setCapturedImage(finalImageData);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const savePhoto = async () => {
    if (!capturedImage) return;

    setSaving(true);
    try {
      // Ensure agent is authenticated before making the request
      await ensureAuthenticated();
      
      // Save photo data to backend
      await apiClient.post(`/orders/${orderId}/photo`, {
        photoData: capturedImage,
      });

      alert(`✅ Delivery photo saved for Order #${orderId}!`);
      stopCamera();
      navigate(`/order/${orderId}`);
    } catch (error: any) {
      console.error("Failed to save photo:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to save photo";
      alert(`❌ Error: ${errorMessage}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
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
            📷 Delivery Photo
          </h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Capture Delivery Photo
            </h2>
            <p className="text-sm text-gray-600">
              Take a photo of the delivered items for Order #{orderId}
            </p>
          </div>

          {!capturedImage ? (
            <>
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 bg-gray-200 rounded-md object-cover"
                />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">
                        Camera not started
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="flex space-x-3">
                {!stream ? (
                  <button
                    onClick={startCamera}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
                  >
                    📷 Start Camera
                  </button>
                ) : (
                  <>
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
                    >
                      📸 Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
                    >
                      ❌ Stop Camera
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <img
                  src={capturedImage}
                  alt="Captured delivery photo"
                  className="w-full h-64 object-cover rounded-md border-2 border-green-200"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={retakePhoto}
                  disabled={saving}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  🔄 Retake Photo
                </button>
                <button
                  onClick={savePhoto}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    "✅ Save Photo"
                  )}
                </button>
              </div>
            </>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Make sure the photo clearly shows the
              delivered items and is well-lit for best results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
