"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-transparent p-8 rounded-lg shadow-sm border border-gray-200 dark:border-primary/20 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 dark:text-white/70 mb-8">
          Thank you for shopping with BLUE ناز. Your payment was successful and an email receipt has been sent.
        </p>
        
        {orderId && (
          <div className="bg-gray-50 dark:bg-primary/5 p-4 rounded text-left mb-8">
            <p className="text-sm text-gray-500 dark:text-white/60 mb-1">Order Reference:</p>
            <p className="font-mono font-medium text-gray-900 dark:text-white break-all">{orderId}</p>
          </div>
        )}

        <div className="space-y-4">
          <Link 
            href="/account"
            className="block w-full bg-primary text-primary-foreground py-3 rounded font-bold hover:opacity-90"
          >
            View Order Status
          </Link>
          <Link 
            href="/"
            className="block w-full bg-white dark:bg-transparent text-primary dark:text-white border border-primary py-3 rounded font-bold hover:bg-gray-50 dark:hover:bg-primary/10"
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
