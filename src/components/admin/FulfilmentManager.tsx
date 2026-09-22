"use client";

import { useState } from "react";
import { PackageOpen, Truck, Printer, FileText, CheckCircle2 } from "lucide-react";
import { 
  sendOrderToShiprocket, 
  fetchCouriers, 
  assignCourierAWB, 
  requestOrderPickup, 
  getOrderLabel, 
  getOrderInvoice 
} from "@/app/actions/fulfilment";

export default function FulfilmentManager({ order }: { order: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [weight, setWeight] = useState(order.package_weight || 0.5);
  const [length, setLength] = useState(order.package_length || 10);
  const [width, setWidth] = useState(order.package_width || 10);
  const [height, setHeight] = useState(order.package_height || 5);

  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>("");

  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleCreateShipment = async () => {
    clearMessages();
    if (weight <= 0 || length <= 0 || width <= 0 || height <= 0) {
      setError("All package dimensions and weight must be positive numbers.");
      return;
    }

    setLoading(true);
    const res = await sendOrderToShiprocket(order.id, { weight, length, width, height });
    if (res.success) {
      setSuccess("Order sent to Shiprocket successfully!");
    } else {
      setError(res.error || "Unknown error creating shipment.");
    }
    setLoading(false);
  };

  const handleFetchCouriers = async () => {
    clearMessages();
    setLoading(true);
    const res = await fetchCouriers(order.id);
    if (res.success && res.couriers) {
      setCouriers(res.couriers);
      if (res.couriers.length > 0) setSelectedCourier(res.couriers[0].courier_company_id.toString());
    } else {
      setError(res.error || "Failed to fetch couriers.");
    }
    setLoading(false);
  };

  const handleAssignAWB = async () => {
    clearMessages();
    if (!selectedCourier) {
      setError("Please select a courier first.");
      return;
    }
    setLoading(true);
    const res = await assignCourierAWB(order.id, selectedCourier);
    if (res.success) {
      setSuccess("AWB assigned successfully!");
      setCouriers([]); // clear out courier list
    } else {
      setError(res.error || "Failed to assign AWB.");
    }
    setLoading(false);
  };

  const handleRequestPickup = async () => {
    clearMessages();
    setLoading(true);
    const res = await requestOrderPickup(order.id);
    if (res.success) {
      setSuccess("Pickup scheduled successfully!");
    } else {
      setError(res.error || "Failed to request pickup.");
    }
    setLoading(false);
  };

  const handleDownloadLabel = async () => {
    clearMessages();
    setLoading(true);
    const res = await getOrderLabel(order.id);
    if (res.success && res.url) {
      window.open(res.url, "_blank");
    } else {
      setError(res.error || "Failed to get label.");
    }
    setLoading(false);
  };

  const handleDownloadInvoice = async () => {
    clearMessages();
    setLoading(true);
    const res = await getOrderInvoice(order.id);
    if (res.success && res.url) {
      window.open(res.url, "_blank");
    } else {
      setError(res.error || "Failed to get invoice.");
    }
    setLoading(false);
  };

  const isCreated = !!order.shiprocket_order_id;
  const isAWBAssigned = !!order.awb_code;
  const isPickupScheduled = order.pickup_scheduled;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-6">
      <div className="flex items-center gap-2 border-b pb-4 mb-4">
        <PackageOpen className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg text-gray-900">Shiprocket Fulfilment</h2>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 text-red-700 rounded text-sm font-medium border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 mb-4 bg-green-50 text-green-700 rounded text-sm font-medium border border-green-200 flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {success}
        </div>
      )}

      {/* STEP 1: CREATE SHIPMENT */}
      {!isCreated && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Enter package details to create a Shiprocket order.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Weight (kg)</label>
              <input type="number" step="0.1" min="0.1" value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Length (cm)</label>
              <input type="number" min="1" value={length} onChange={(e) => setLength(parseFloat(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Width (cm)</label>
              <input type="number" min="1" value={width} onChange={(e) => setWidth(parseFloat(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Height (cm)</label>
              <input type="number" min="1" value={height} onChange={(e) => setHeight(parseFloat(e.target.value))} className="w-full p-2 border border-gray-300 rounded focus:border-primary outline-none" />
            </div>
          </div>
          <button 
            onClick={handleCreateShipment} 
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {loading ? "Sending..." : "Create Shiprocket Order"}
          </button>
        </div>
      )}

      {/* ONCE CREATED */}
      {isCreated && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border text-sm">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Shiprocket Order ID</p>
              <p className="font-mono text-gray-900 mt-1">{order.shiprocket_order_id}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Shipment ID</p>
              <p className="font-mono text-gray-900 mt-1">{order.shiprocket_shipment_id || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Courier</p>
              <p className="font-bold text-gray-900 mt-1">{order.courier_name || "Not Assigned"}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">AWB Code</p>
              <p className="font-mono text-primary font-bold mt-1">{order.awb_code || "Not Assigned"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {/* STEP 2: ASSIGN AWB */}
            {!isAWBAssigned && (
              <div className="w-full space-y-3">
                {couriers.length === 0 ? (
                  <button onClick={handleFetchCouriers} disabled={loading} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors disabled:opacity-50">
                    {loading ? "Loading..." : "Fetch Available Couriers"}
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <select 
                      value={selectedCourier} 
                      onChange={e => setSelectedCourier(e.target.value)}
                      className="p-2 border border-gray-300 rounded text-sm w-full sm:w-64"
                    >
                      {couriers.map(c => (
                        <option key={c.courier_company_id} value={c.courier_company_id}>
                          {c.courier_name} (₹{c.rate}, {c.estimated_delivery_days} days)
                        </option>
                      ))}
                    </select>
                    <button onClick={handleAssignAWB} disabled={loading} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap">
                      {loading ? "Assigning..." : "Assign AWB"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: REQUEST PICKUP */}
            {isAWBAssigned && !isPickupScheduled && (
              <button onClick={handleRequestPickup} disabled={loading} className="flex items-center bg-gray-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
                <Truck className="w-4 h-4 mr-2" />
                {loading ? "Requesting..." : "Request Pickup"}
              </button>
            )}

            {/* STEP 4: PRINT DOCS */}
            {isAWBAssigned && (
              <>
                <button onClick={handleDownloadLabel} disabled={loading} className="flex items-center border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Label
                </button>
                <button onClick={handleDownloadInvoice} disabled={loading} className="flex items-center border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
                  <FileText className="w-4 h-4 mr-2" />
                  Shiprocket Invoice
                </button>
              </>
            )}
          </div>
          
          {isPickupScheduled && (
            <p className="text-sm text-green-600 font-bold mt-2 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Pickup has been scheduled successfully.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
