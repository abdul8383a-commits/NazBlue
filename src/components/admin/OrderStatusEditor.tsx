"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Save, RefreshCw } from "lucide-react";

export default function OrderStatusEditor({ 
  orderId, 
  currentStatus, 
  currentPaymentStatus 
}: { 
  orderId: string, 
  currentStatus: string, 
  currentPaymentStatus: string 
}) {
  const [status, setStatus] = useState(currentStatus);
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleUpdate = async () => {
    if (status === currentStatus && paymentStatus === currentPaymentStatus) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, payment_status: paymentStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      alert("Order status updated successfully.");
      router.refresh();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
      // Reset back to current on failure
      setStatus(currentStatus);
      setPaymentStatus(currentPaymentStatus);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b pb-3 mb-3">
        <RefreshCw className="w-5 h-5 text-gray-400" />
        <h2 className="font-bold text-gray-900">Manage Status</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Order Status</label>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded focus:border-primary outline-none bg-white text-sm"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Payment Status</label>
          <select 
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded focus:border-primary outline-none bg-white text-sm"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleUpdate}
        disabled={loading || (status === currentStatus && paymentStatus === currentPaymentStatus)}
        className="w-full mt-4 flex items-center justify-center space-x-2 bg-primary text-white p-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        <Save className="w-4 h-4" />
        <span>{loading ? 'Saving...' : 'Save Changes'}</span>
      </button>
    </div>
  );
}
