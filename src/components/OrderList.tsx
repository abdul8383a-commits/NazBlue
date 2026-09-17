"use client";

import { useState } from "react";
import { Package, Truck } from "lucide-react";

export default function OrderList({ orders }: { orders: any[] }) {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (orderId: string) => {
    if (trackingOrder === orderId) {
      setTrackingOrder(null);
      return;
    }
    
    setTrackingOrder(orderId);
    setLoadingTracking(true);
    setError("");
    setTrackingData(null);
    
    try {
      const res = await fetch("/api/shipping/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok) {
        // Shiprocket tracking response structure varies, we grab the summary status or error
        if (data.tracking_data && data.tracking_data.error) {
           setError("Tracking details not yet available from courier.");
        } else {
           // Simplistic parse of shiprocket track_status or shipment_status
           const trackStatus = data.tracking_data?.track_status === 0 ? "Pending Pickup" 
                             : data.tracking_data?.shipment_status === 7 ? "Delivered"
                             : data.tracking_data?.shipment_track?.[0]?.current_status || "In Transit";
           setTrackingData(trackStatus);
        }
      } else {
        setError(data.error || "Failed to fetch tracking");
      }
    } catch (e) {
      setError("Failed to fetch tracking");
    }
    setLoadingTracking(false);
  };

  if (!orders || orders.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">You have no recent orders.</p>;
  }

  return (
    <div className="space-y-6">
      {orders.map(order => (
        <div key={order.id} className="border dark:border-white/20 rounded-lg p-4 bg-gray-50 dark:bg-transparent text-gray-900 dark:text-white">
          <div className="flex justify-between items-start mb-4 border-b dark:border-white/20 pb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Order ID: {order.id.substring(0, 8)}...</p>
              <p className="text-sm font-medium mt-1">
                Placed on: {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-white/60">Total Amount</p>
              <p className="font-bold text-primary dark:text-white">₹{order.total_amount.toFixed(2)}</p>
              <p className="text-xs uppercase bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded inline-block mt-1 font-bold tracking-wider">
                {order.status}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-4 text-sm">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-sm py-2">
                <span className="text-gray-600 dark:text-white/80">{item.quantity}x {item.product_name} (Size: {item.size}, Color: {item.color})</span>
                <span className="text-gray-900 dark:text-white font-medium">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {order.shiprocket_order_id && (
            <div className="mt-4 pt-4 border-t dark:border-white/20">
              <button 
                onClick={() => handleTrack(order.id)}
                className="flex items-center space-x-2 text-sm text-white bg-primary px-4 py-2 rounded hover:opacity-90 transition-opacity"
              >
                <Package className="w-4 h-4" />
                <span>{trackingOrder === order.id ? "Hide Tracking" : "Track Package"}</span>
              </button>

              {trackingOrder === order.id && (
                <div className="mt-4 p-4 bg-white dark:bg-primary/10 border border-gray-200 dark:border-white/20 rounded text-sm">
                  {loadingTracking && <p className="text-gray-500 dark:text-gray-400 animate-pulse">Connecting to Shiprocket API...</p>}
                  {error && <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>}
                  {trackingData && (
                    <div className="space-y-2">
                      <div className="flex items-center text-primary dark:text-white font-bold text-lg mb-2">
                        <Truck className="w-5 h-5 mr-2" />
                        Status: {trackingData}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-xs mt-2">
                        Live tracking powered by Shiprocket.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
