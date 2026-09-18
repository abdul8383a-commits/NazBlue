"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Country, State, City } from "country-state-city";
import Select, { components } from "react-select";
import Script from "next/script";
import { useTheme } from "next-themes";

const CustomInput = (props: any) => {
  return <components.Input {...props} autoComplete="new-password" />;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { items, isLoading, clearCart } = useCart();
  const router = useRouter();
  const supabase = createClient();
  const { resolvedTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stockError, setStockError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneCode: "+1",
    phone: "",
    addressLine1: "",
    country: "",
    city: "",
    state: "",
    pincode: ""
  });

  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [selectedStateCode, setSelectedStateCode] = useState("");

  const countries = Country.getAllCountries();
  const states = selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [];
  const cities = selectedCountryCode && selectedStateCode ? City.getCitiesOfState(selectedCountryCode, selectedStateCode) : [];

  const phoneOptions = countries.map(c => ({
    value: `+${c.phonecode}`,
    label: `${c.isoCode} (+${c.phonecode})`
  }));

  const countryOptions = countries.map(c => ({
    value: c.isoCode,
    label: c.name
  }));

  const stateOptions = states.map(s => ({
    value: s.isoCode,
    label: s.name
  }));

  const cityOptions = cities.map(c => ({
    value: c.name,
    label: c.name
  }));

  const [edd, setEdd] = useState<string | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const isDark = mounted && resolvedTheme === 'dark';

  const commonSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: '50px',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.3)' : '#d1d5db',
      backgroundColor: 'transparent',
      boxShadow: state.isFocused ? (isDark ? '0 0 0 1px rgba(255,255,255,0.3)' : '0 0 0 1px #163A7A') : 'none',
      '&:hover': {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : '#163A7A'
      }
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDark ? 'white' : '#111827',
    }),
    input: (base: any) => ({
      ...base,
      color: isDark ? 'white' : '#111827',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#1a202c' : 'white',
      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #d1d5db',
      zIndex: 50
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? (isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6') : (isDark ? '#1a202c' : 'white'),
      color: isDark ? 'white' : '#111827',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#e5e7eb'
      }
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af'
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: isDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
      '&:hover': {
        color: isDark ? 'white' : '#374151'
      }
    }),
    indicatorSeparator: (base: any) => ({
      ...base,
      backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db'
    })
  };

  const subtotal = items.reduce((acc, item) => {
    const price = item.variant.product.discount_price || item.variant.product.base_price;
    return acc + price * item.quantity;
  }, 0);
  const shipping = subtotal > 100 || items.length === 0 ? 0 : 10;
  const tax = subtotal * 0.08;
  const grandTotal = subtotal + shipping + tax;

  useEffect(() => {
    setMounted(true);
    
    // Check if user is authenticated and load profile
    const initCheckout = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?redirect=/checkout");
        return;
      }
      
      let initialData = null;

      // 1. Try to load from database first (Default Address)
      const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single();
      if (profile && (profile.address_line1 || profile.city || profile.country)) {
        initialData = {
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          email: profile.email || session.user.email || "",
          phoneCode: "+1",
          phone: profile.phone || "",
          addressLine1: profile.address_line1 || "",
          country: profile.country || "",
          city: profile.city || "",
          state: profile.state || "",
          pincode: profile.pincode || ""
        };
      } else {
        // 2. Fallback to localStorage if no default address in DB
        const savedAddress = localStorage.getItem("blue_naz_saved_address");
        if (savedAddress) {
          try {
            initialData = JSON.parse(savedAddress);
          } catch (e) {
            // ignore parse error
          }
        } else if (profile) {
          // 3. Fallback to just filling basic profile info
          initialData = {
            ...formData,
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            email: profile.email || session.user.email || "",
            phone: profile.phone || ""
          };
        }
      }

      if (initialData) {
        setFormData(prev => ({ ...prev, ...initialData }));
        if (initialData.country) {
          const cCode = Country.getAllCountries().find(c => c.name === initialData.country)?.isoCode;
          if (cCode) {
            setSelectedCountryCode(cCode);
            if (initialData.state) {
              const sCode = State.getStatesOfCountry(cCode).find(s => s.name === initialData.state)?.isoCode;
              if (sCode) setSelectedStateCode(sCode);
            }
          }
        }
      }
    };
    
    initCheckout();

    if (!isLoading && items.length === 0 && step === 1) {
      router.push("/cart");
    }
  }, [items, isLoading, router, step, supabase]);

  // Check pincode when length is 6
  useEffect(() => {
    const checkPin = async () => {
      if (formData.pincode.length === 6) {
        setCheckingPincode(true);
        setPincodeError("");
        setEdd(null);
        try {
          const res = await fetch("/api/shipping/serviceability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pincode: formData.pincode }),
          });
          const data = await res.json();
          if (res.ok && data.serviceable) {
            setEdd(data.estimated_delivery_date);
          } else {
            setPincodeError(data.error || "Not serviceable");
          }
        } catch (e) {
          setPincodeError("Failed to check pincode");
        }
        setCheckingPincode(false);
      } else {
        setEdd(null);
        setPincodeError("");
      }
    };
    
    const timeout = setTimeout(() => { checkPin(); }, 500);
    return () => clearTimeout(timeout);
  }, [formData.pincode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneCodeChange = (option: any) => {
    if (option) setFormData({ ...formData, phoneCode: option.value });
  };

  const handleCountryChange = (option: any) => {
    if (!option) return;
    const code = option.value;
    const countryObj = countries.find(c => c.isoCode === code);
    const name = countryObj?.name || "";
    setSelectedCountryCode(code);
    setSelectedStateCode("");
    setFormData(prev => ({ 
      ...prev, 
      country: name, 
      state: "", 
      city: "",
      phoneCode: countryObj?.phonecode ? `+${countryObj.phonecode}` : prev.phoneCode
    }));
  };

  const handleStateChange = (option: any) => {
    if (!option) return;
    const code = option.value;
    const name = states.find(s => s.isoCode === code)?.name || "";
    setSelectedStateCode(code);
    setFormData({ ...formData, state: name, city: "" });
  };

  const handleCityChange = (option: any) => {
    if (!option) return;
    const name = option.value;
    setFormData({ ...formData, city: name });
  };

  const isAddressComplete = Object.entries(formData).every(([key, val]) => {
    if (key === 'state' && stateOptions.length === 0) return true; // State is optional if no states exist
    if (key === 'city' && cityOptions.length === 0 && val.trim().length === 0) return false; // City is required even if manually typed
    return val.trim().length > 0;
  }) && !pincodeError;
  const fullAddressString = JSON.stringify(formData); 

  const validateStockAndProceed = async () => {
    setValidating(true);
    setStockError(null);
    try {
      let allInStock = true;
      for (const item of items) {
        const { data, error } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.product_variant_id)
          .single();
        
        if (error || !data || data.stock_quantity < item.quantity) {
          allInStock = false;
          break;
        }
      }

      if (allInStock) {
        setStep(3);
      } else {
        setStockError("One or more items in your cart are out of stock. Please return to the cart and update quantities.");
      }
    } catch (e) {
      setStockError("Failed to validate stock. Please try again.");
    }
    setValidating(false);
  };

  const handlePayment = async () => {
    try {
      setValidating(true);
      
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          address: fullAddressString,
          couponCode: "" 
        }),
      });
      
      const orderData = await res.json();
      
      if (!res.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "BLUE ناز",
        description: "Apparel Order",
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              dbOrderId: orderData.dbOrderId
            }),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            clearCart();
            router.push(`/checkout/success?order_id=${orderData.dbOrderId}`);
          } else {
            alert(`Payment verification failed: ${verifyData.error}`);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: `${formData.phoneCode}${formData.phone}`
        },
        theme: {
          color: "#1E3A8A"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setValidating(false);
    }
  };

  if (isLoading) return <div className="py-20 text-center min-h-[70vh]">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-[70vh]">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="text-3xl font-bold text-primary mb-8 text-center">Checkout</h1>

      {/* Stepper */}
      <div className="flex justify-between items-center mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-300 dark:bg-white/20 -z-10 transform -translate-y-1/2"></div>
        {[
          { num: 1, label: "Shipping" },
          { num: 2, label: "Review" },
          { num: 3, label: "Payment" }
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center bg-background px-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
              step >= s.num ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-gray-400 dark:text-white/40 border-gray-300 dark:border-white/20"
            }`}>
              {s.num}
            </div>
            <span className={`text-xs mt-2 font-medium ${step >= s.num ? "text-primary dark:text-white" : "text-gray-400 dark:text-white/40"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-transparent rounded-lg shadow-sm border border-gray-200 dark:border-white/20 p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" required className="w-full p-3 border border-gray-300 dark:border-white/30 rounded focus:outline-none focus:border-primary bg-transparent dark:text-white dark:placeholder:text-white/40" />
              <input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" required className="w-full p-3 border border-gray-300 dark:border-white/30 rounded focus:outline-none focus:border-primary bg-transparent dark:text-white dark:placeholder:text-white/40" />
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email" required className="w-full p-3 border border-gray-300 dark:border-white/30 rounded focus:outline-none focus:border-primary md:col-span-2 bg-transparent dark:text-white dark:placeholder:text-white/40" />
              
              <div className="flex md:col-span-2">
                <div className="w-36 flex-shrink-0">
                  <Select
                    instanceId="phoneCodeSelect"
                    components={{ Input: CustomInput }}
                    options={phoneOptions}
                    value={phoneOptions.find(o => o.value === formData.phoneCode) || null}
                    onChange={handlePhoneCodeChange}
                    styles={{
                      ...commonSelectStyles,
                      control: (base, state) => ({
                        ...commonSelectStyles.control(base, state),
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        backgroundColor: isDark ? 'transparent' : '#f9fafb'
                      })
                    }}
                  />
                </div>
                <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" required className="w-full p-3 border border-gray-300 dark:border-white/30 border-l-0 rounded-r focus:outline-none focus:border-primary bg-transparent dark:text-white dark:placeholder:text-white/40" />
              </div>

              <input name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} placeholder="Street Address" required className="w-full p-3 border border-gray-300 dark:border-white/30 rounded focus:outline-none focus:border-primary md:col-span-2 bg-transparent dark:text-white dark:placeholder:text-white/40" />
              
              <div className="md:col-span-2">
                <Select
                  instanceId="countrySelect"
                  components={{ Input: CustomInput }}
                  options={countryOptions}
                  value={countryOptions.find(o => o.value === selectedCountryCode) || null}
                  onChange={handleCountryChange}
                  placeholder="Select Country..."
                  styles={commonSelectStyles}
                />
              </div>

              <div>
                <Select
                  instanceId="stateSelect"
                  components={{ Input: CustomInput }}
                  options={stateOptions}
                  value={stateOptions.find(o => o.value === selectedStateCode) || null}
                  onChange={handleStateChange}
                  isDisabled={!selectedCountryCode || stateOptions.length === 0}
                  placeholder="Select State..."
                  styles={commonSelectStyles}
                />
              </div>

              <div>
                {cities.length > 0 ? (
                  <Select
                    instanceId="citySelect"
                    components={{ Input: CustomInput }}
                    options={cityOptions}
                    value={cityOptions.find(o => o.value === formData.city) || null}
                    onChange={handleCityChange}
                    isDisabled={!selectedStateCode}
                    placeholder="Select City..."
                    styles={commonSelectStyles}
                  />
                ) : (
                  <input name="city" value={formData.city} onChange={handleInputChange} placeholder="City" required disabled={!selectedStateCode} className="w-full p-3 border border-gray-300 dark:border-white/30 rounded focus:outline-none focus:border-primary disabled:bg-gray-100 dark:disabled:bg-white/5 bg-transparent dark:text-white dark:placeholder:text-white/40" style={{ minHeight: '50px' }} />
                )}
              </div>
              <div>
                <input name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="Pincode (6 digits)" maxLength={6} required className="w-full p-3 border border-gray-300 dark:border-white/30 rounded focus:outline-none focus:border-primary bg-transparent dark:text-white dark:placeholder:text-white/40" />
                {checkingPincode && <p className="text-xs text-gray-500 dark:text-white/60 mt-1">Checking serviceability...</p>}
                {pincodeError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{pincodeError}</p>}
                {edd && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Delivery by: {new Date(edd).toLocaleDateString()}</p>}
              </div>
            </div>
            
            <button 
              onClick={() => {
                localStorage.setItem("blue_naz_saved_address", JSON.stringify(formData));
                setStep(2);
              }}
              disabled={!isAddressComplete}
              className="w-full bg-primary text-primary-foreground py-3 rounded font-bold hover:opacity-90 disabled:opacity-50 mt-4"
            >
              Continue to Review
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Order</h2>
            
            <div className="bg-gray-50 dark:bg-primary/5 p-4 rounded border dark:border-white/20 text-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Shipping To:</h3>
              <p className="text-gray-600 dark:text-white/70">
                {formData.firstName} {formData.lastName}<br/>
                {formData.addressLine1}<br/>
                {formData.city}, {formData.state} {formData.pincode}<br/>
                {formData.country}<br/>
                {formData.phoneCode} {formData.phone}
              </p>
              {edd && <p className="mt-2 text-green-700 dark:text-green-400 font-medium">Estimated Delivery: {new Date(edd).toLocaleDateString()}</p>}
              <button onClick={() => setStep(1)} className="text-primary dark:text-white hover:underline mt-2 inline-block">Edit Address</button>
            </div>

            <div className="border-t dark:border-white/20 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Items ({items.length})</h3>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900 dark:text-white">{item.quantity}x</span>
                      <span className="text-gray-600 dark:text-white/70">{item.variant.product.name} (Size: {item.variant.size})</span>
                    </div>
                    <span className="font-medium dark:text-white">${((item.variant.product.discount_price || item.variant.product.base_price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t dark:border-white/20 pt-6 space-y-2 text-sm text-gray-600 dark:text-white/70">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-4 border-t dark:border-white/20">
                <span>Total</span><span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {stockError && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{stockError}</div>}

            <button 
              onClick={validateStockAndProceed}
              disabled={validating}
              className="w-full bg-primary text-primary-foreground py-3 rounded font-bold hover:opacity-90 disabled:opacity-50"
            >
              {validating ? "Checking Stock..." : "Proceed to Payment"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment</h2>
            <p className="text-gray-600 dark:text-white/70 max-w-md mx-auto">
              Please pay <span className="font-bold text-primary dark:text-white">${grandTotal.toFixed(2)}</span> to complete your order securely via Razorpay.
            </p>
            
            <div className="max-w-sm mx-auto">
              <button 
                onClick={handlePayment}
                disabled={validating}
                className="w-full bg-[#1E3A8A] text-white py-4 rounded font-bold hover:bg-[#1E3A8A]/90 transition-colors shadow-lg disabled:opacity-50"
              >
                {validating ? "Processing..." : "Pay Now with Razorpay"}
              </button>
            </div>
            
            <button onClick={() => setStep(2)} className="text-gray-500 dark:text-white/60 hover:text-primary dark:hover:text-white text-sm font-medium mt-4">
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
