"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/update-password`,
    });

    if (error) setError(error.message);
    else setMessage("If an account exists, a password reset email has been sent.");
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-transparent border border-primary/20 dark:border-white/20 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-primary dark:text-white mb-4 text-center">Reset Password</h1>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">{message}</div>}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border dark:border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent dark:text-white" />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded font-semibold hover:opacity-90">
            Send Reset Link
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
