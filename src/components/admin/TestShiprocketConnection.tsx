"use client";

import { useState } from "react";
import { testShiprocketConnection } from "@/app/actions/fulfilment";

export default function TestShiprocketConnection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await testShiprocketConnection();
      setResult(res as any);
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleTest}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium transition-colors"
      >
        {loading ? "Testing..." : "Test Shiprocket Connection"}
      </button>

      {result && (
        <span className={`text-sm font-medium ${result.success ? "text-green-600" : "text-red-600"}`}>
          {result.success ? result.message : result.error}
        </span>
      )}
    </div>
  );
}
