"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RefreshCcw, Eye, Save } from "lucide-react";

export default function OrderAdminRow({ order }: { order: any }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const supabase = createClient();

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setSaving(true);
    try {
      await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    } catch (error) {
      alert("Failed to update status");
      setStatus(order.status);
    }
    setSaving(false);
  };

  const retryShiprocket = async () => {
    setSyncing(true);
    alert(`Attempting to retry Shiprocket sync for order ${order.id}...`);
    setTimeout(() => {
      setSyncing(false);
      alert("Simulated: Shiprocket Sync triggered successfully! In a real app, this hits a dedicated server action.");
    }, 1500);
  };

  let parsedAddress: any = {};
  try {
    parsedAddress = JSON.parse(order.shipping_address || "{}");
  } catch(e) {}

  const customerName = parsedAddress.firstName ? `${parsedAddress.firstName} ${parsedAddress.lastName}` : "Guest / Unknown";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-900 font-bold">
        {order.id.substring(0, 8)}...
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-bold text-gray-900">{customerName}</div>
        <div className="text-gray-500 text-xs">{parsedAddress.email || "No email"}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {new Date(order.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
        ₹{order.total_amount.toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <select 
            value={status} 
            onChange={handleStatusChange}
            disabled={saving}
            className={`text-xs font-bold rounded-full px-3 py-1.5 outline-none appearance-none border cursor-pointer shadow-sm
              ${status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' : 
                status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' : 
                'bg-blue-100 text-blue-800 border-blue-200'}`}
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {saving && <Save className="w-3 h-3 text-gray-400 animate-pulse" />}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end space-x-2">
        {!order.shiprocket_order_id && order.payment_status === 'paid' && (
          <button 
            onClick={retryShiprocket} 
            disabled={syncing}
            title="Retry Shiprocket Sync"
            className="text-orange-600 hover:text-orange-800 p-2 bg-orange-50 hover:bg-orange-100 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button title="View Details" className="text-primary hover:text-primary/80 p-2 bg-blue-50 hover:bg-blue-100 rounded transition-colors">
          <Eye className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
