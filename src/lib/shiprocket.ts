const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in";

export let shiprocketToken: string | null = null;
export let tokenExpiry: number | null = null;
let tokenPromise: Promise<string> | null = null;

// Mock Mode Helper - Explicitly safe
const isMockMode = () => {
  if (process.env.SHIPROCKET_MODE === 'live') return false;
  if (process.env.NODE_ENV === 'production' && process.env.SHIPROCKET_MODE !== 'mock') {
    throw new Error("Shiprocket live integration requires SHIPROCKET_MODE='live' and valid credentials.");
  }
  return !process.env.SHIPROCKET_API_EMAIL || process.env.SHIPROCKET_API_EMAIL.includes("placeholder") || process.env.SHIPROCKET_MODE === 'mock';
};

// Safe fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    // Explicitly throw a specific error type if it's a network/abort issue
    if (error.name === 'AbortError' || error.name === 'FetchError' || error.message.includes('fetch failed')) {
      throw new Error(`NETWORK_TIMEOUT: ${error.message}`);
    }
    throw error;
  }
}

export async function getShiprocketToken(): Promise<string> {
  if (isMockMode()) return "mock-token-12345";

  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken as string;
  }
  // Prevent token fetch storms
  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    try {
      const response = await fetchWithTimeout(`${SHIPROCKET_BASE_URL}/v1/external/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_API_EMAIL,
          password: process.env.SHIPROCKET_API_PASSWORD,
        }),
      }, 15000); // 15s timeout for auth

      if (!response.ok) {
        throw new Error(`Failed to authenticate with Shiprocket: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.token) {
        throw new Error("Invalid token response from Shiprocket.");
      }

      shiprocketToken = data.token;
      // Shiprocket tokens last ~10 days typically, we play it safe with 24 hours.
      tokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
      return shiprocketToken as string;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise as Promise<string>;
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
    const response = await fetchWithTimeout(
      `${SHIPROCKET_BASE_URL}/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${cod}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
       // Explicitly differentiate between NO couriers (200 with empty array) and a real error (400)
       throw new Error(`Serviceability API Error: ${response.status}`);
    }
    const data = await response.json();
    return data.data; 
  } catch (e: any) {
    if (e.message.includes('NETWORK_TIMEOUT')) {
      throw new Error(`Serviceability failed: Network issue. Try again.`);
    }
    throw e; // Pass through to be logged by caller
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
  const response = await fetchWithTimeout(`${SHIPROCKET_BASE_URL}/v1/external/orders/create/ad-hoc`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(orderDetails),
  }, 20000); // Allow 20 seconds for order creation

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      shiprocketToken = null;
      tokenExpiry = null;
      throw new Error(`Shiprocket Authentication Expired: HTTP 401. Please try again.`);
    }
    if (response.status === 429) {
      throw new Error(`Shiprocket Rate Limit Exceeded: HTTP 429. Please try again later.`);
    }
    if (response.status >= 400 && response.status < 500) {
      throw new Error(`Shiprocket Order Creation Failed: HTTP ${response.status} - ${errorText}`);
    }
    if (response.status >= 500) {
      throw new Error(`Shiprocket Server Error (Unknown Outcome): HTTP ${response.status} - ${errorText}`);
    }
    throw new Error(`Shiprocket Error: HTTP ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data || !data.order_id || !data.shipment_id) {
     throw new Error(`Shiprocket returned an invalid success response missing order_id/shipment_id: ${JSON.stringify(data)}`);
  }
  
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
  const response = await fetchWithTimeout(`${SHIPROCKET_BASE_URL}/v1/external/courier/assign/awb`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: courierId
    }),
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      shiprocketToken = null;
      tokenExpiry = null;
    }
    throw new Error(`AWB Generation Failed: HTTP ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data || data.awb_assign_status !== 1 || !data.response?.data?.awb_code) {
     throw new Error(`Shiprocket returned invalid AWB response: ${JSON.stringify(data)}`);
  }
  return data;
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
  const response = await fetchWithTimeout(`${SHIPROCKET_BASE_URL}/v1/external/courier/generate/pickup`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      shipment_id: [shipmentId]
    }),
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      shiprocketToken = null;
      tokenExpiry = null;
    }
    throw new Error(`Pickup Request Failed: HTTP ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data || data.pickup_status !== 1) {
     throw new Error(`Shiprocket rejected pickup request or returned invalid response: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function generateShippingLabel(shipmentId: string) {
  if (isMockMode()) {
    return {
      label_created: 1,
      label_url: "https://example.com/mock-label.pdf"
    };
  }

  const token = await getShiprocketToken();
  const response = await fetchWithTimeout(`${SHIPROCKET_BASE_URL}/v1/external/courier/generate/label`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      shipment_id: [shipmentId]
    }),
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      shiprocketToken = null;
      tokenExpiry = null;
    }
    throw new Error(`Label Generation Failed: HTTP ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data || data.label_created !== 1 || !data.label_url) {
     throw new Error(`Shiprocket returned invalid label response: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function generateInvoice(orderIds: string[]) {
  if (isMockMode()) {
    return {
      is_invoice_created: true,
      invoice_url: "https://example.com/mock-invoice.pdf"
    };
  }

  const token = await getShiprocketToken();
  const response = await fetchWithTimeout(`${SHIPROCKET_BASE_URL}/v1/external/orders/print/invoice`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      ids: orderIds
    }),
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      shiprocketToken = null;
      tokenExpiry = null;
    }
    throw new Error(`Invoice Generation Failed: HTTP ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data || !data.is_invoice_created || !data.invoice_url) {
     throw new Error(`Shiprocket returned invalid invoice response: ${JSON.stringify(data)}`);
  }
  return data;
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
    const response = await fetchWithTimeout(`${SHIPROCKET_BASE_URL}/v1/external/courier/track/shipment/${shipmentId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }, 15000);

    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (e) {
    console.error("Tracking fetch failed:", e);
    return null;
  }
}
