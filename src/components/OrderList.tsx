"use client";

import { useState } from "react";
import { Package, Truck } from "lucide-react";

import Image from "next/image";

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

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("pending")) return "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200";
    if (s.includes("paid") || s.includes("success") || s.includes("delivered")) return "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200";
    if (s.includes("fail") || s.includes("cancel")) return "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200";
    return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
  };

  if (!orders || orders.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">You have no recent orders.</p>;
  }

  return (
    <div className="space-y-6">
      {orders.map(order => (
        <div key={order.id} className="border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white overflow-hidden shadow-sm">
          <div className="flex justify-between items-start p-5 bg-gray-50 dark:bg-transparent border-b border-gray-200 dark:border-white/10">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Order ID: {order.id.substring(0, 8)}...</p>
              <p className="text-sm font-medium mt-1">
                {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary dark:text-white text-lg">₹{order.total_amount.toFixed(2)}</p>
              <p className={`text-[10px] uppercase px-2 py-0.5 rounded-sm inline-block mt-1 font-bold tracking-wider ${getStatusColor(order.status)}`}>
                {order.status}
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {order.order_items?.map((item: any) => {
              const product = item.product_variants?.products || {};
              const imageUrl = product.images?.[0] || 'https://via.placeholder.com/80';
              const name = product.name || 'Unknown Product';
              const size = item.product_variants?.size || 'N/A';
              const color = item.product_variants?.color || 'N/A';

              return (
                <div key={item.id} className="flex items-center gap-4 py-2">
                  <div className="relative w-16 h-20 flex-shrink-0 bg-gray-100 dark:bg-white/5 rounded-md overflow-hidden">
                    <Image src={imageUrl} alt={name} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">{name}</p>
                    <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
                      {color !== 'Default' && `Color: ${color} | `}Size: {size}
                    </p>
                    <p className="text-sm font-medium text-gray-700 dark:text-white/80 mt-1">
                      {item.quantity} × ₹{item.price_at_purchase.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 dark:text-white text-sm">₹{(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
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
