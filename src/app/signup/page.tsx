"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Phone, User, Eye, EyeOff, Check, X, ArrowRight } from "lucide-react";

export default function Signup() {
  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Password Requirements
  const passwordReqs = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const isPasswordValid = Object.values(passwordReqs).every(Boolean);

  // Real-time validation
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (touched.firstName && !firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }
    if (touched.lastName && !lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }
    if (touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (touched.phone && phone && !/^\+?[0-9\s\-\(\)]{7,15}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number.";
    }
    if (touched.password && !isPasswordValid) {
      newErrors.password = "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.";
    }
    if (touched.confirmPassword && confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
  }, [firstName, lastName, email, phone, password, confirmPassword, touched, isPasswordValid]);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required.";
    if (!lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Please enter a valid email address.";
    if (!phone) newErrors.phone = "Phone number is required.";
    if (!/^\+?[0-9\s\-\(\)]{7,15}$/.test(phone)) newErrors.phone = "Please enter a valid phone number.";
    if (!isPasswordValid) newErrors.password = "Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.";
    if (confirmPassword !== password) newErrors.confirmPassword = "Passwords do not match.";
    
    setErrors(newErrors);
    setTouched({
      firstName: true, lastName: true, email: true, phone: true, password: true, confirmPassword: true
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setServerError("An account with this email already exists. Please log in instead.");
        } else {
          setServerError(error.message);
        }
      } else if (data?.user?.identities?.length === 0) {
         setServerError("An account with this email already exists. Please log in instead.");
      } else {
        // Success
        router.push("/account");
        router.refresh();
      }
    } catch (err: any) {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setServerError(error.message);
  };

  const isFormInvalid = !firstName || !lastName || !email || !phone || !isPasswordValid || password !== confirmPassword || Object.keys(errors).length > 0;

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 px-4 min-h-[90vh] bg-gray-50/50 dark:bg-transparent">
      <div className="w-full max-w-lg p-6 sm:p-10 bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl shadow-2xl shadow-primary/5 dark:shadow-none transition-all duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Create an account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Join blueنز for a premium fashion experience
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-start">
            <X className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* First Name */}
            <div className="space-y-1">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input 
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => handleBlur("firstName")}
                  className={`block w-full pl-10 pr-3 py-3 md:py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors ${
                    errors.firstName ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary"
                  }`}
                  placeholder="Jane"
                  autoComplete="given-name"
                />
              </div>
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input 
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => handleBlur("lastName")}
                  className={`block w-full pl-10 pr-3 py-3 md:py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors ${
                    errors.lastName ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary"
                  }`}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-5 w-5" />
              </div>
              <input 
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                className={`block w-full pl-10 pr-3 py-3 md:py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors ${
                  errors.email ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary"
                }`}
                placeholder="jane@example.com"
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Phone className="h-5 w-5" />
              </div>
              <input 
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => handleBlur("phone")}
                className={`block w-full pl-10 pr-3 py-3 md:py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors ${
                  errors.phone ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary"
                }`}
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
            </div>
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input 
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                className={`block w-full pl-10 pr-10 py-3 md:py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors ${
                  errors.password ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary"
                }`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
              <input 
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                className={`block w-full pl-10 pr-10 py-3 md:py-2.5 border rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 sm:text-sm transition-colors ${
                  errors.confirmPassword ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-gray-200 dark:border-white/10 focus:ring-primary/20 focus:border-primary"
                }`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isLoading || isFormInvalid}
            className="w-full flex justify-center items-center py-3 md:py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-6"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-gray-900/50 backdrop-blur-xl text-gray-500">OR</span>
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleGoogleSignup} 
              className="w-full flex items-center justify-center space-x-2 border border-gray-200 dark:border-white/10 py-3 md:py-2.5 px-4 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
