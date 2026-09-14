"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        We encountered an unexpected error while processing your request. Our team has been notified.
      </p>
      <div className="space-x-4">
        <button
          onClick={() => reset()}
          className="bg-primary text-white px-6 py-2 rounded font-bold hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-primary text-primary px-6 py-2 rounded font-bold hover:bg-gray-50 inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
