const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in";

let shiprocketToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getShiprocketToken() {
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

export async function checkServiceability(deliveryPincode: string) {
  try {
    const token = await getShiprocketToken();
    const pickupPincode = "110030"; // Placeholder for merchant pincode
    
    const response = await fetch(
      `${SHIPROCKET_BASE_URL}/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=1&cod=0`,
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

export async function trackOrder(shipmentId: string) {
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
