"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    serviceable?: boolean;
    days?: number;
    estimated_delivery_date?: string;
    error?: string;
  } | null>(null);

  const checkPincode = async () => {
    if (!pincode || pincode.length !== 6) {
      setResult({ error: "Please enter a valid 6-digit pincode." });
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/shipping/serviceability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
      } else {
        setResult({ error: data.error || "Failed to check serviceability." });
      }
    } catch (e) {
      setResult({ error: "Network error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border border-gray-200 dark:border-primary/20 rounded-lg p-4 bg-gray-50 dark:bg-primary/5">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-gray-900 dark:text-white">
        <MapPin className="w-4 h-4 text-primary" /> Delivery Options
      </h3>
      <div className="flex gap-2 mb-3">
        <input 
          type="text" 
          placeholder="Enter Pincode" 
          value={pincode}
          maxLength={6}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-primary/30 rounded focus:outline-none focus:border-primary text-sm bg-white dark:bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400"
        />
        <button 
          onClick={checkPincode}
          disabled={loading || pincode.length < 6}
          className="px-4 py-2 bg-primary text-white dark:text-primary-foreground text-sm font-medium rounded hover:bg-opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[80px]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
        </button>
      </div>

      {result && (
        <div className="text-sm">
          {result.error ? (
            <p className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" /> {result.error}
            </p>
          ) : result.serviceable ? (
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Delivery Available
              </p>
              {result.estimated_delivery_date && (
                <p className="text-gray-600 dark:text-white/70 pl-6">
                  Expected by {new Date(result.estimated_delivery_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              )}
              {result.days && (
                <p className="text-gray-500 dark:text-white/50 text-xs pl-6">
                  Usually delivers in {result.days} working days.
                </p>
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" /> Currently not serviceable in this area.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
