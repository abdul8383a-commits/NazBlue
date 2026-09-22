import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, User, MapPin, CreditCard, ShoppingBag } from "lucide-react";
import OrderStatusEditor from "@/components/admin/OrderStatusEditor";
import FulfilmentManager from "@/components/admin/FulfilmentManager";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;
  const supabase = await createClient();

  // Fetch the order with its items, variants, and products
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      users(name, phone),
      order_items(
        *,
        product_variants(
          size,
          color,
          sku,
          products(
            name,
            images
          )
        )
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
  }

  if (!order) {
    console.error("Order not found. orderId:", orderId, "resolvedParams:", resolvedParams);
    notFound();
  }

  // Safely parse shipping address
  let address = order.shipping_address;
  if (typeof address === 'string') {
    try {
      address = JSON.parse(address);
    } catch (e) {
      address = {};
    }
  }

  // Ensure Customer Info
  const customerName = order.users?.name || address?.firstName + " " + address?.lastName || "Guest";
  const customerEmail = order.users?.email || address?.email || "No email";
  const customerPhone = order.users?.phone || address?.phone || "No phone";

  // Calculate items subtotal based on historical price_at_purchase
  let itemSubtotal = 0;
  order.order_items?.forEach((item: any) => {
    itemSubtotal += item.price_at_purchase * item.quantity;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors bg-white border shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Order <span className="text-primary font-mono text-lg">#{order.id.substring(0,8)}</span>
            </h1>
            <p className="text-gray-500 mt-1">Placed on {new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Order Items & Summary */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-4 mb-4">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg text-gray-900">Order Items</h2>
            </div>
            
            <div className="space-y-4">
              {order.order_items?.map((item: any) => {
                const product = item.product_variants?.products;
                const name = product?.name || "Unknown Product";
                const imageUrl = product?.images?.[0];
                const variantInfo = [item.product_variants?.color, item.product_variants?.size].filter(Boolean).join(" / ") || "Variant unavailable";
                const sku = item.product_variants?.sku;

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded bg-gray-50/50">
                    <div className="w-16 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0 relative">
                      {imageUrl ? (
                         <Image src={imageUrl} alt={name} fill sizes="64px" className="object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 text-center p-1">No Image</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{name}</p>
                      <p className="text-sm text-gray-500 mt-1">{variantInfo}</p>
                      {sku && <p className="text-xs text-gray-400 font-mono mt-0.5">SKU: {sku}</p>}
                    </div>
                    <div className="text-right flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                      <p className="text-sm text-gray-600">{item.quantity} × ₹{item.price_at_purchase.toFixed(2)}</p>
                      <p className="font-bold text-gray-900 mt-1">₹{(item.quantity * item.price_at_purchase).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
             <h2 className="font-bold text-lg text-gray-900 border-b pb-4 mb-4">Price Summary</h2>
             <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal (Historical)</span>
                  <span>₹{itemSubtotal.toFixed(2)}</span>
                </div>
                {/* As requested: Do NOT reverse-engineer discounts or shipping. Just show the final total */}
                <div className="flex justify-between border-t pt-3 mt-3">
                  <span className="font-bold text-gray-900 text-base">Final Order Total</span>
                  <span className="font-bold text-primary text-xl">₹{order.total_amount.toFixed(2)}</span>
                </div>
             </div>
          </div>
          
        </div>

        {/* Right Column - Status, Customer, Payment */}
        <div className="space-y-6">
          
          <FulfilmentManager order={order} />

          {/* Status Editor Component */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <OrderStatusEditor orderId={order.id} currentStatus={order.status} currentPaymentStatus={order.payment_status} />
          </div>

          {/* Customer Info */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3 mb-3">
              <User className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">Customer Details</h2>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-bold text-gray-900">{customerName}</p>
              <p>{customerEmail}</p>
              <p>{customerPhone}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3 mb-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">Shipping Address</h2>
            </div>
            {address ? (
              <div className="space-y-1 text-sm text-gray-600 leading-relaxed">
                <p className="font-bold text-gray-900">{address.firstName} {address.lastName}</p>
                <p>{address.address}</p>
                {address.apartment && <p>{address.apartment}</p>}
                <p>{address.city}, {address.state} {address.pincode}</p>
                <p>Phone: {address.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No shipping address recorded.</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 border-b pb-3 mb-3">
              <CreditCard className="w-5 h-5 text-gray-400" />
              <h2 className="font-bold text-gray-900">Payment Details</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Razorpay Order ID</p>
                <p className="font-mono text-gray-900 mt-0.5">{order.razorpay_order_id || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-bold">Payment ID</p>
                <p className="font-mono text-gray-900 mt-0.5">{order.payment_id || "N/A"}</p>
              </div>
              <div className="pt-2 border-t mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-bold uppercase tracking-wider rounded ${
                  order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
