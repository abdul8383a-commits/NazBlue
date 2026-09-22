"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Country, State, City } from "country-state-city";
import Select, { components } from "react-select";
import Script from "next/script";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Lock, CreditCard, ShieldCheck } from "lucide-react";

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
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db',
      backgroundColor: 'transparent',
      boxShadow: state.isFocused ? (isDark ? '0 0 0 1px rgba(255,255,255,0.3)' : '0 0 0 1px #163A7A') : 'none',
      '&:hover': {
        borderColor: isDark ? 'rgba(255, 255, 255, 0.4)' : '#163A7A'
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
    
    const initCheckout = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?redirect=/checkout");
        return;
      }
      
      let initialData = null;

      // 1. Try DB Default Address
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
        // 2. Fallback to localStorage
        const savedAddress = localStorage.getItem("blue_naz_saved_address");
        if (savedAddress) {
          try {
            initialData = JSON.parse(savedAddress);
          } catch (e) {}
        } else if (profile) {
          // 3. Fallback to basic profile
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

    if (!isLoading && items.length === 0) {
      router.push("/cart");
    }
  }, [items, isLoading, router, supabase]);

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
    if (key === 'state' && stateOptions.length === 0) return true;
    if (key === 'city' && cityOptions.length === 0 && val.trim().length === 0) return false;
    return val.trim().length > 0;
  }) && !pincodeError;
  
  const fullAddressString = JSON.stringify(formData); 

  const handlePayment = async () => {
    try {
      setValidating(true);
      setStockError(null);
      
      // 1. Stock Validation (Previously Step 2 -> Step 3 transition)
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

      if (!allInStock) {
        setStockError("One or more items in your cart are out of stock. Please return to your bag to update quantities.");
        setValidating(false);
        return;
      }
      
      // Save address backup
      localStorage.setItem("blue_naz_saved_address", fullAddressString);

      // 2. Order Creation
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

      // 3. Razorpay Initiation
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
            setValidating(false);
          }
        },
        modal: {
          ondismiss: function() {
            setValidating(false);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: `${formData.phoneCode}${formData.phone}`
        },
        theme: {
          color: "#163A7A"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment Failed: ${response.error.description}`);
        setValidating(false);
      });
      rzp.open();
      
    } catch (error: any) {
      alert(error.message);
      setValidating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary dark:border-white/20 dark:border-t-white rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 dark:text-white/60">Loading checkout...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-12 min-h-[70vh] pb-40 md:pb-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="mb-8 md:mb-12 border-b border-gray-200 dark:border-white/10 pb-4">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-white tracking-tight">Checkout</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        
        {/* Left Column: Form & Items */}
        <div className="flex-1 space-y-10">
          
          {/* Section: Contact & Delivery */}
          <section className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="bg-primary text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">1</span> 
              Delivery Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" required className="w-full p-3.5 border border-gray-300 dark:border-white/20 rounded-md focus:outline-none focus:border-primary bg-white dark:bg-transparent dark:text-white placeholder:text-gray-400 text-sm" />
              <input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" required className="w-full p-3.5 border border-gray-300 dark:border-white/20 rounded-md focus:outline-none focus:border-primary bg-white dark:bg-transparent dark:text-white placeholder:text-gray-400 text-sm" />
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email Address" required className="w-full p-3.5 border border-gray-300 dark:border-white/20 rounded-md focus:outline-none focus:border-primary md:col-span-2 bg-white dark:bg-transparent dark:text-white placeholder:text-gray-400 text-sm" />
              
              <div className="flex md:col-span-2">
                <div className="w-32 md:w-36 flex-shrink-0">
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
                        backgroundColor: isDark ? 'transparent' : '#f9fafb',
                        minHeight: '52px'
                      })
                    }}
                  />
                </div>
                <input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="Phone Number" required className="w-full p-3.5 border border-gray-300 dark:border-white/20 border-l-0 rounded-r-md focus:outline-none focus:border-primary bg-white dark:bg-transparent dark:text-white placeholder:text-gray-400 text-sm" />
              </div>

              <input name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} placeholder="Street Address" required className="w-full p-3.5 border border-gray-300 dark:border-white/20 rounded-md focus:outline-none focus:border-primary md:col-span-2 bg-white dark:bg-transparent dark:text-white placeholder:text-gray-400 text-sm" />
              
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
                  <input name="city" value={formData.city} onChange={handleInputChange} placeholder="City" required disabled={!selectedStateCode} className="w-full p-3.5 border border-gray-300 dark:border-white/20 rounded-md focus:outline-none focus:border-primary disabled:bg-gray-100 dark:disabled:bg-white/5 bg-white dark:bg-transparent dark:text-white placeholder:text-gray-400 text-sm" style={{ minHeight: '50px' }} />
                )}
              </div>
              <div className="md:col-span-2">
                <input name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="Pincode (6 digits)" maxLength={6} required className="w-full p-3.5 border border-gray-300 dark:border-white/20 rounded-md focus:outline-none focus:border-primary bg-white dark:bg-transparent dark:text-white placeholder:text-gray-400 text-sm" />
                {checkingPincode && <p className="text-xs text-gray-500 dark:text-white/60 mt-2">Checking serviceability...</p>}
                {pincodeError && <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">{pincodeError}</p>}
                {edd && <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">Estimated Delivery: {new Date(edd).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>}
              </div>
            </div>
          </section>

          {/* Section: Order Items */}
          <section className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <span className="bg-primary text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-xs">2</span> 
              Review Items
            </h2>
            <div className="space-y-6">
              {items.map(item => {
                const product = item.variant.product;
                const price = product.discount_price || product.base_price;
                return (
                  <div key={item.id} className="flex gap-4 border-b border-gray-100 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                    <div className="relative w-20 h-24 flex-shrink-0 bg-gray-100 dark:bg-white/5 rounded overflow-hidden">
                      <Image 
                        src={product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/150'} 
                        alt={product.name}
                        fill
                        sizes="80px" 
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-white/60 mt-1">
                        {item.variant.color !== 'Default' && `${item.variant.color} | `}Size: {item.variant.size}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-white/60 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">₹{(price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          
        </div>

        {/* Right Column: Summary & Payment CTA */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="bg-gray-50 dark:bg-white/5 p-6 md:p-8 rounded-xl border border-gray-200 dark:border-white/10 lg:sticky lg:top-24 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Order Summary</h2>
            
            <div className="space-y-4 text-sm text-gray-600 dark:text-white/70 border-b border-gray-200 dark:border-white/10 pb-6 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="font-medium text-gray-900 dark:text-white">{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-base font-bold text-gray-900 dark:text-white uppercase tracking-wider">Total</span>
              <span className="text-2xl font-bold text-primary dark:text-white">₹{Math.max(0, grandTotal).toFixed(2)}</span>
            </div>

            {stockError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg text-sm text-red-700 dark:text-red-400 font-medium leading-relaxed">
                {stockError}
              </div>
            )}

            {!isAddressComplete && (
              <div className="mb-6 text-sm text-yellow-600 dark:text-yellow-500 font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                Please complete all required address fields.
              </div>
            )}

            {/* Desktop normal button, Mobile sticky button */}
            <div className="fixed bottom-[4.5rem] md:bottom-0 left-0 right-0 p-4 md:p-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md md:bg-transparent md:backdrop-blur-none border-t border-gray-200 dark:border-white/10 md:border-none z-40 md:z-auto md:relative shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:shadow-none safe-area-bottom">
              <button 
                onClick={handlePayment}
                disabled={!isAddressComplete || validating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white dark:text-primary-foreground py-4 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-base"
              >
                {validating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Place Order & Pay
                  </>
                )}
              </button>
              
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-white/50 hidden md:flex">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Secure Payment</span>
                <span className="flex items-center gap-1"><CreditCard className="w-4 h-4" /> Powered by Razorpay</span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
