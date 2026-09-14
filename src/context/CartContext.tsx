"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CartItemType = {
  id: string; // db id or local random string
  product_variant_id: string;
  quantity: number;
  variant: {
    size: string;
    color: string;
    stock_quantity: number;
    product: {
      id: string;
      name: string;
      images: string[];
      base_price: number;
      discount_price: number | null;
    };
  };
};

type CartContextType = {
  items: CartItemType[];
  isLoading: boolean;
  addToCart: (item: Omit<CartItemType, "id">) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const initCart = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      
      if (mounted) setUserId(currentUserId);

      if (currentUserId) {
        // Logged in: Sync local storage to DB, then fetch DB cart
        const localItems = JSON.parse(localStorage.getItem("blue_naz_guest_cart") || "[]") as CartItemType[];
        if (localItems.length > 0) {
          for (const item of localItems) {
            // Upsert logic (simplistic merge)
            await supabase.from("cart_items").insert({
              user_id: currentUserId,
              product_variant_id: item.product_variant_id,
              quantity: item.quantity,
            }).select().single();
          }
          localStorage.removeItem("blue_naz_guest_cart");
        }

        // Fetch DB cart
        await fetchDbCart(currentUserId, mounted);
      } else {
        // Guest: load from local storage
        const localItems = JSON.parse(localStorage.getItem("blue_naz_guest_cart") || "[]") as CartItemType[];
        if (mounted) {
          setItems(localItems);
          setIsLoading(false);
        }
      }
    };

    initCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setIsLoading(true);
        initCart();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchDbCart = async (uid: string, mounted = true) => {
    // We need to fetch the joined data. 
    // In Supabase we do: select('id, quantity, product_variant_id, product_variants(size, color, stock_quantity, products(id, name, images, base_price, discount_price))')
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id, 
        quantity, 
        product_variant_id,
        variant:product_variants (
          size, color, stock_quantity,
          product:products (id, name, images, base_price, discount_price)
        )
      `)
      .eq("user_id", uid);

    if (!error && data && mounted) {
      // Transform data to match CartItemType
      const formatted = data.map((d: any) => ({
        id: d.id,
        product_variant_id: d.product_variant_id,
        quantity: d.quantity,
        variant: d.variant
      })) as CartItemType[];
      setItems(formatted);
    }
    if (mounted) setIsLoading(false);
  };

  const saveToLocalStorage = (newItems: CartItemType[]) => {
    localStorage.setItem("blue_naz_guest_cart", JSON.stringify(newItems));
    setItems(newItems);
  };

  const addToCart = async (newItem: Omit<CartItemType, "id">) => {
    if (userId) {
      // Add to DB
      // Check if already in cart
      const existing = items.find(i => i.product_variant_id === newItem.product_variant_id);
      if (existing) {
        await updateQuantity(existing.id, existing.quantity + newItem.quantity);
      } else {
        const { data, error } = await supabase
          .from("cart_items")
          .insert({
            user_id: userId,
            product_variant_id: newItem.product_variant_id,
            quantity: newItem.quantity,
          })
          .select(`
            id, quantity, product_variant_id,
            variant:product_variants (
              size, color, stock_quantity,
              product:products (id, name, images, base_price, discount_price)
            )
          `).single();
          
        if (!error && data) {
          setItems(prev => [...prev, data as any]);
        }
      }
    } else {
      // Add to Local Storage
      const existing = items.find(i => i.product_variant_id === newItem.product_variant_id);
      if (existing) {
        const updated = items.map(i => 
          i.product_variant_id === newItem.product_variant_id 
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
        saveToLocalStorage(updated);
      } else {
        const itemWithId = { ...newItem, id: Math.random().toString(36).substr(2, 9) };
        saveToLocalStorage([...items, itemWithId]);
      }
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (userId) {
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (!error) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
      }
    } else {
      const updated = items.map(i => i.id === id ? { ...i, quantity } : i);
      saveToLocalStorage(updated);
    }
  };

  const removeFromCart = async (id: string) => {
    if (userId) {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (!error) {
        setItems(prev => prev.filter(i => i.id !== id));
      }
    } else {
      saveToLocalStorage(items.filter(i => i.id !== id));
    }
  };

  const clearCart = async () => {
    if (userId) {
      await supabase.from("cart_items").delete().eq("user_id", userId);
      setItems([]);
    } else {
      saveToLocalStorage([]);
    }
  };

  return (
    <CartContext.Provider value={{ items, isLoading, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
