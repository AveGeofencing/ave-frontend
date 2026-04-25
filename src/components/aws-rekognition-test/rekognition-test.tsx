"use client";
import { useState, useEffect, useRef } from "react";
import "@aws-amplify/ui-react/styles.css";
import { Loader, ThemeProvider } from "@aws-amplify/ui-react";
import {
  FaceLivenessDetectorCore,
  AwsCredentialProvider,
} from "@aws-amplify/ui-react-liveness";
import { api } from "@/lib/api";

const credentialProvider: AwsCredentialProvider = async () => ({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
});

type LivenessResult = {
  status: number;
  confidence: number;
  referenceImage: any;
};

export default function Rekognition({
  livenessTestCompletedHandler,
}: {
  livenessTestCompletedHandler: (sessionId: string | null) => void;
}) {
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<LivenessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createSession = async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSessionId("");
    try {
      const { data, error } = await api.post<{ sessionId: string }>(
        `/rekognition/create-session`,
      );
      if (!mountedRef.current) return;
      if (error) throw new Error(error);
      setSessionId(data!.sessionId);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError("Failed to start liveness check session");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleAnalysisComplete = async () => {
    try {
      if (!mountedRef.current) return;
      livenessTestCompletedHandler(sessionId);
    } catch (err: any) {
      if (!mountedRef.current) return;
      livenessTestCompletedHandler(null);
      setError("Failed to get results: " + err.message);
    }
  };

  const handleError = (err: any) => {
    if (!mountedRef.current) return;

    // "Cannot cancel a locked stream" fires when the component unmounts
    // mid-session — it's a cleanup race, not a real user-facing error.
    const isStreamCleanupNoise =
      err?.message?.includes("locked") ||
      err?.message?.includes("cancel") ||
      err?.state === "CONNECTION_TIMEOUT";

    if (isStreamCleanupNoise) return;

    console.error("Liveness error:", err);
    livenessTestCompletedHandler(null);
    setError("Error checking liveness. Please try again.");
    livenessTestCompletedHandler(null);
  };

  const handleRetry = () => {
    createSession();
  };

  // Track mount state so async callbacks don't setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    createSession();
  }, []);

  return (
    <ThemeProvider>
      <div className="max-w-xl mx-auto mt-10 px-4 font-sans">
        <h2 className="text-2xl font-semibold mb-6">Face Liveness Check</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
            <p className="font-medium">⚠️ {error}</p>
            <button
              onClick={handleRetry}
              className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {result && (
          <div className="border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Result</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Status:</span> {result.status}
              </p>
              <p>
                <span className="font-medium">Confidence:</span>{" "}
                {result.confidence?.toFixed(2)}%
              </p>
              <p className="mt-2 text-base">
                {result.confidence >= 80
                  ? "✅ Liveness check passed"
                  : "❌ Liveness check failed (low confidence)"}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="mt-5 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!result &&
          (loading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : (
            sessionId && (
              <FaceLivenessDetectorCore
                sessionId={sessionId}
                region="us-east-1"
                onAnalysisComplete={handleAnalysisComplete}
                onError={handleError}
                config={{ credentialProvider }}
              />
            )
          ))}
      </div>
    </ThemeProvider>
  );
}
