"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "phone">("login");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else {
        router.push("/account");
        router.refresh();
      }
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    if (error) setError(error.message);
    else setMessage("OTP sent to your phone! (This requires Supabase SMS provider setup)");
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[70vh]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-transparent border border-primary/20 dark:border-white/20 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold text-primary dark:text-white mb-6 text-center">
          {mode === "login" ? "Login" : mode === "signup" ? "Create Account" : "Phone Login"}
        </h1>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-sm">{message}</div>}

        <div className="flex justify-center space-x-4 mb-6">
          <button onClick={() => setMode("login")} className={`pb-2 ${mode === "login" ? "border-b-2 border-primary dark:border-white dark:text-white font-semibold" : "text-gray-500 dark:text-gray-400"}`}>Login</button>
          <button onClick={() => setMode("signup")} className={`pb-2 ${mode === "signup" ? "border-b-2 border-primary dark:border-white dark:text-white font-semibold" : "text-gray-500 dark:text-gray-400"}`}>Signup</button>
          <button onClick={() => setMode("phone")} className={`pb-2 ${mode === "phone" ? "border-b-2 border-primary dark:border-white dark:text-white font-semibold" : "text-gray-500 dark:text-gray-400"}`}>Phone</button>
        </div>

        {mode !== "phone" ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border dark:border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border dark:border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent dark:text-white" />
            </div>
            {mode === "login" && (
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot Password?</Link>
              </div>
            )}
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded font-semibold hover:opacity-90">
              {mode === "login" ? "Sign In" : "Sign Up"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Phone Number</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" className="w-full p-2 border dark:border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-primary/50 bg-transparent dark:text-white" />
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded font-semibold hover:opacity-90">
              Send OTP
            </button>
          </form>
        )}

        <div className="mt-6 border-t dark:border-white/20 pt-6">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center space-x-2 border border-gray-300 dark:border-white/20 py-2 rounded hover:bg-gray-50 dark:hover:bg-white/10 transition-colors dark:text-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
