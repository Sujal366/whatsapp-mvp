import React, { useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";

const CameraCapture: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 640, 480);
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        setCapturedImage(imageData);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
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
            📷 Photo Capture
          </h1>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-200 rounded-md mb-4"
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="hidden"
              />

              <div className="flex space-x-3">
                {!stream ? (
                  <button
                    onClick={startCamera}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md"
                  >
                    Start Camera
                  </button>
                ) : (
                  <>
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md"
                    >
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md"
                    >
                      Stop Camera
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-64 object-cover rounded-md mb-4"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setCapturedImage(null)}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Retake
                </button>
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md">
                  Save Photo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
