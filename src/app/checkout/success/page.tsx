"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white dark:bg-white/5 p-8 md:p-12 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 text-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-50 dark:bg-green-900/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -z-10"></div>

        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-3">Order Confirmed!</h1>
        <p className="text-gray-600 dark:text-white/70 mb-8 leading-relaxed">
          Thank you for shopping with <span className="font-semibold text-primary dark:text-white">BLUE ناز</span>. Your payment was successful and an email receipt has been sent.
        </p>
        
        {orderId ? (
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-5 rounded-lg text-left mb-8 shadow-sm">
            <p className="text-xs text-gray-500 dark:text-white/60 mb-1 uppercase tracking-wider font-semibold">Order Reference</p>
            <p className="font-mono font-bold text-gray-900 dark:text-white text-sm break-all">{orderId}</p>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 p-4 rounded-lg text-left mb-8">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your order was successful, but we couldn't retrieve the Order ID from the URL. You can check your account for details.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/account"
            className="flex-1 bg-primary text-white dark:text-primary-foreground py-3.5 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            View Order
          </Link>
          <Link 
            href="/"
            className="flex-1 bg-white dark:bg-transparent text-primary dark:text-white border border-primary dark:border-white/20 py-3.5 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
