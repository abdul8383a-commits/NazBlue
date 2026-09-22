const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in";

let shiprocketToken: string | null = null;
let tokenExpiry: number | null = null;

// Mock Mode Helper - Explicitly safe
const isMockMode = () => {
  if (process.env.SHIPROCKET_MODE === 'live') return false;
  if (process.env.NODE_ENV === 'production' && process.env.SHIPROCKET_MODE !== 'mock') {
    throw new Error("Shiprocket live integration requires SHIPROCKET_MODE='live' and valid credentials.");
  }
  return !process.env.SHIPROCKET_API_EMAIL || process.env.SHIPROCKET_API_EMAIL.includes("placeholder") || process.env.SHIPROCKET_MODE === 'mock';
};

export async function getShiprocketToken() {
  if (isMockMode()) return "mock-token-12345";

  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_API_EMAIL,
      password: process.env.SHIPROCKET_API_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with Shiprocket");
  }

  const data = await response.json();
  shiprocketToken = data.token;
  tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; 
  return shiprocketToken;
}

export async function checkServiceability(pickupPincode: string, deliveryPincode: string, weight: number, cod: number = 0) {
  if (isMockMode()) {
    // Return mock available couriers
    return {
      available_courier_companies: [
        { courier_company_id: 1, courier_name: "Mock Express", estimated_delivery_days: "2", rate: 50 },
        { courier_company_id: 2, courier_name: "Mock Logistics", estimated_delivery_days: "4", rate: 40 },
      ]
    };
  }

  try {
    const token = await getShiprocketToken();
    const response = await fetch(
      `${SHIPROCKET_BASE_URL}/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${cod}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data.data; 
  } catch (e) {
    console.error("Serviceability check failed:", e);
    return null;
  }
}

export async function createShiprocketOrder(orderDetails: any) {
  if (isMockMode()) {
    return {
      order_id: `mock-sr-order-${Date.now()}`,
      shipment_id: `mock-sr-shipment-${Date.now()}`,
      status: "NEW"
    };
  }

  const token = await getShiprocketToken();
  const response = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/orders/create/ad-hoc`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(orderDetails),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shiprocket Order Creation Failed: ${errorText}`);
  }

  const data = await response.json();
  return data;
}

export async function generateAWB(shipmentId: string, courierId: string) {
  if (isMockMode()) {
    return {
      awb_assign_status: 1,
      response: {
        data: {
          awb_code: `MOCK-AWB-${Date.now()}`,
          courier_company_id: courierId,
          courier_name: "Mock Express"
        }
      }
    };
  }

  const token = await getShiprocketToken();
  const response = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/courier/assign/awb`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: courierId
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AWB Generation Failed: ${errorText}`);
  }

  return await response.json();
}

export async function requestPickup(shipmentId: string) {
  if (isMockMode()) {
    return {
      pickup_status: 1,
      response: {
        pickup_token_number: `MOCK-PICKUP-${Date.now()}`,
        pickup_scheduled_date: new Date().toISOString()
      }
    };
  }

  const token = await getShiprocketToken();
  const response = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/courier/generate/pickup`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      shipment_id: [shipmentId]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pickup Request Failed: ${errorText}`);
  }

  return await response.json();
}

export async function generateShippingLabel(shipmentId: string) {
  if (isMockMode()) {
    return {
      label_created: 1,
      label_url: "https://example.com/mock-label.pdf"
    };
  }

  const token = await getShiprocketToken();
  const response = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/courier/generate/label`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      shipment_id: [shipmentId]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Label Generation Failed: ${errorText}`);
  }

  return await response.json();
}

export async function generateInvoice(orderIds: string[]) {
  if (isMockMode()) {
    return {
      is_invoice_created: true,
      invoice_url: "https://example.com/mock-invoice.pdf"
    };
  }

  const token = await getShiprocketToken();
  const response = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/orders/print/invoice`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      ids: orderIds
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Invoice Generation Failed: ${errorText}`);
  }

  return await response.json();
}

export async function trackOrder(shipmentId: string) {
  if (isMockMode()) {
    return {
      tracking_data: {
        track_status: 1,
        shipment_status: 3, // In transit
        shipment_track: [{ current_status: "In Transit" }]
      }
    };
  }

  try {
    const token = await getShiprocketToken();
    const response = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/courier/track/shipment/${shipmentId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Tracking fetch failed:", e);
    return null;
  }
}
