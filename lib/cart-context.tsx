"use client";

import {
  createContext, useContext, useState,
  ReactNode, useEffect, useCallback, useRef,
} from "react";
import { supabase } from "@/lib/supabase";

export interface AddOn {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  image_url?: string;
  isVeg?: boolean;
}

export interface CartItem extends MenuItem {
  cartItemId: string;
  quantity: number;
  addOns?: AddOn[];
  instructions?: string;
}

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  tax: number;
  grandTotal: number;
  status:
    | "new"        // customer placed, waiting for admin to accept
    | "declined"   // admin rejected
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "served"
    | "delivered";
  paymentStatus: "pending" | "paid";
  paymentMethod?: "cash" | "online";
  createdAt: Date;
  tableId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem & { addOns?: AddOn[]; instructions?: string }) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  orders: Order[];
  placeOrder: (
    tableId: string,
    customerName: string,
    orderNotes?: string
  ) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  refreshOrderStatus: (orderId: string) => Promise<void>;
  getActiveOrderForTable: (tableId: string) => Order | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Statuses that mean the table is "occupied" — block new orders
const BLOCKING_STATUSES = ["new", "pending", "confirmed", "preparing", "ready"];

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const declineTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Session ID — table-scoped so two phones on different tables don't share ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathParts = window.location.pathname.split("/");
    const tableIndex = pathParts.indexOf("table");
    const tableId = tableIndex !== -1 ? pathParts[tableIndex + 1] : "unknown";

    const sessionKey = `cafe_session_id_table_${tableId}`;
    let sid = localStorage.getItem(sessionKey);
    if (!sid) {
      sid = `sess_t${tableId}_` + Math.random().toString(36).substring(2, 15) + Date.now();
      localStorage.setItem(sessionKey, sid);
    }
    setSessionId(sid);
  }, []);

  // ── Load existing orders for this session ────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const fetchSessionOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("session_id", sessionId)
        .neq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (data && !error) {
        const formatted: Order[] = data.map((dbOrder: any) => ({
          id: dbOrder.id,
          customerName: dbOrder.customer_name,
          total: dbOrder.total_amount,
          tax: 0,
          grandTotal: dbOrder.total_amount,
          status: dbOrder.status,
          paymentStatus: dbOrder.payment_status || "pending",
          paymentMethod: dbOrder.payment_method,
          tableId: dbOrder.table_number,
          createdAt: new Date(dbOrder.created_at),
          items: (dbOrder.order_items || []).map((item: any) => ({
            id: item.item_id,
            cartItemId: item.id,
            name: item.item_name,
            price: item.item_price,
            quantity: item.quantity,
            addOns: item.add_ons || [],
            instructions: item.instructions || "",
            isVeg: item.is_veg ?? true,
          })),
        }));
        setOrders(formatted);

        // Auto-remove any already-declined orders after 15s
        formatted.filter(o => o.status === "declined").forEach(o => {
          declineTimers.current[o.id] = setTimeout(() => {
            setOrders((prev) => prev.filter((x) => x.id !== o.id));
            delete declineTimers.current[o.id];
          }, 15000);
        });
      }
    };
    fetchSessionOrders();
  }, [sessionId]);

  // ── Helper: re-fetch a single order's items from DB ─────────────────────
  const refetchOrderItems = useCallback(async (orderId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    if (!error && data) {
      const mapped = (data.order_items || []).map((item: any) => ({
        id: item.item_id,
        cartItemId: item.id,
        name: item.item_name,
        price: item.item_price,
        quantity: item.quantity,
        addOns: Array.isArray(item.add_ons) ? item.add_ons : [],
        instructions: item.instructions || "",
        isVeg: item.is_veg ?? true,
      }));
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, items: mapped, total: data.total_amount, grandTotal: data.total_amount }
            : o
        )
      );
    }
  }, []);

  // ── Helper: re-fetch ALL active orders (used when DELETE event comes in) ─
  const refetchAllActiveOrders = useCallback(async (activeIds: string[]) => {
    if (activeIds.length === 0) return;
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .in("id", activeIds);
    if (!error && data) {
      setOrders((prev) =>
        prev.map((o) => {
          const fresh = data.find((d: any) => d.id === o.id);
          if (!fresh) return o;
          const mapped = (fresh.order_items || []).map((item: any) => ({
            id: item.item_id,
            cartItemId: item.id,
            name: item.item_name,
            price: item.item_price,
            quantity: item.quantity,
            addOns: Array.isArray(item.add_ons) ? item.add_ons : [],
            instructions: item.instructions || "",
            isVeg: item.is_veg ?? true,
          }));
          return { ...o, items: mapped, total: fresh.total_amount, grandTotal: fresh.total_amount };
        })
      );
    }
  }, []);

  // ── Realtime: listen for status + item changes on active orders ──────────
  useEffect(() => {
    if (orders.length === 0) return;
    const activeIds = orders
      .filter((o) => BLOCKING_STATUSES.includes(o.status))
      .map((o) => o.id);
    if (activeIds.length === 0) return;

    const channel = supabase
      .channel("order-updates-" + activeIds[0])
      // Order status/total changes
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as {
            id: string;
            status: Order["status"];
            payment_status: string;
            total_amount: number;
          };
          if (updated.payment_status === "paid") {
            window.location.reload();
            return;
          }
          if (activeIds.includes(updated.id)) {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === updated.id
                  ? { ...o, status: updated.status, total: updated.total_amount, grandTotal: updated.total_amount }
                  : o
              )
            );
            if (updated.status === "declined") {
              declineTimers.current[updated.id] = setTimeout(() => {
                setOrders((prev) => prev.filter((o) => o.id !== updated.id));
                delete declineTimers.current[updated.id];
              }, 15000);
            }
          }
        }
      )
      // Admin ne item add kiya kitchen se
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_items" },
        (payload) => {
          const newItem = payload.new as any;
          if (activeIds.includes(newItem.order_id)) {
            refetchOrderItems(newItem.order_id);
          }
        }
      )
      // Admin ne item hataya kitchen se — DELETE mein order_id nahi aata, sab refetch karo
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "order_items" },
        () => {
          refetchAllActiveOrders(activeIds);
        }
      )
      // Admin ne item quantity/price update kiya
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "order_items" },
        (payload) => {
          const updated = payload.new as any;
          if (activeIds.includes(updated.order_id)) {
            refetchOrderItems(updated.order_id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orders.map((o) => o.id).join(","), refetchOrderItems, refetchAllActiveOrders]);

  // ── Cart operations ───────────────────────────────────────────────────────
  const addItem = (item: MenuItem & { addOns?: AddOn[]; instructions?: string }) => {
    const isVegNormalized = (item as any).isVeg ?? (item as any).is_veg ?? true;
    const normalizedItem  = { ...item, isVeg: isVegNormalized };

    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.id === normalizedItem.id &&
          i.name === normalizedItem.name &&       // "Biryani (Half Plate)" ≠ "Biryani (Full Plate)"
          i.price === normalizedItem.price &&     // extra safety: same price = same variant
          JSON.stringify(i.addOns || []) === JSON.stringify(normalizedItem.addOns || []) &&
          i.instructions === normalizedItem.instructions
      );
      if (existing) {
        return prev.map((i) =>
          i.cartItemId === existing.cartItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      const cartItemId = `${normalizedItem.id}_${normalizedItem.name}_${Date.now()}`.replace(/\s+/g, '_');
      return [...prev, { ...normalizedItem, cartItemId, quantity: 1 }];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.cartItemId === cartItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.cartItemId === cartItemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.cartItemId !== cartItemId);
    });
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity } : i))
      );
    }
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalAmount = items.reduce((sum, item) => {
    const addOnsTotal = item.addOns?.reduce((a, b) => a + b.price, 0) || 0;
    return sum + (item.price + addOnsTotal) * item.quantity;
  }, 0);

  const refreshOrderStatus = useCallback(async (orderId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();
    if (!error && data) {
      setOrders((prev) =>
        prev.map((o) => (o.id === data.id ? { ...o, status: data.status } : o))
      );
    }
  }, []);

  // ── Check if this table already has an active order (DB-level check) ─────
  const getActiveOrderForTable = useCallback(
    (tableId: string): Order | undefined => {
      return orders.find(
        (o) =>
          o.tableId === tableId &&
          o.paymentStatus !== "paid" &&
          BLOCKING_STATUSES.includes(o.status)
      );
    },
    [orders]
  );

  // ── Place Order ───────────────────────────────────────────────────────────
  const placeOrder = async (
    tableId: string,
    customerName: string,
    orderNotes?: string
  ) => {
    if (items.length === 0) return { success: false, error: "Cart is empty" };

    // ── LOCK CHECK: Query DB directly for any active order on this table ──
    // This catches the race condition when 2 phones try to order simultaneously.
    // localStorage-based check is not enough since 2 devices don't share it.
    const { data: existingOrders, error: lockError } = await supabase
      .from("orders")
      .select("id, status, customer_name")
      .eq("table_number", tableId)
      .in("status", BLOCKING_STATUSES)
      .limit(1);

    if (lockError) {
      return { success: false, error: "Network error. Please try again." };
    }

    if (existingOrders && existingOrders.length > 0) {
      const blocker = existingOrders[0];
      return {
        success: false,
        error: `TABLE_LOCKED:${blocker.customer_name}:${blocker.id.slice(-6)}`,
      };
    }

    const tax = Math.round(totalAmount * 0.05);
    const grandTotal = totalAmount + tax;

    const orderSummaryText = items.map(item => `${item.quantity}x ${item.name}`).join(', ');

    try {
      // ── Insert with status 'new' — NOT 'pending' ──
      // Admin must accept before kitchen sees it.
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          table_number: tableId,
          customer_name: customerName || "Guest",
          total_amount: grandTotal,
          status: "new",          // ← key change: not 'pending'
          payment_status: "pending",
          session_id: sessionId,
          customer_notes: orderNotes || "",
          items_summary: items,
          order_summary: orderSummaryText
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsInsert = items.map((cartItem) => {
        const addOnsTotal = cartItem.addOns?.reduce((a, b) => a + b.price, 0) || 0;
        return {
          order_id: orderData.id,
          item_id: cartItem.id,
          item_name: cartItem.name,
          item_price: cartItem.price + addOnsTotal,
          quantity: cartItem.quantity,
          add_ons: cartItem.addOns || [],
          instructions: cartItem.instructions || "",
          is_veg: cartItem.isVeg ?? true,
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsInsert);
      if (itemsError) throw itemsError;

      const newOrder: Order = {
        id: orderData.id,
        customerName: customerName || "Guest",
        items: [...items],
        total: totalAmount,
        tax,
        grandTotal,
        status: "new",
        paymentStatus: "pending",
        tableId,
        createdAt: new Date(),
      };
      setOrders((prev) => [newOrder, ...prev]);
      clearCart();
      return { success: true, orderId: orderData.id };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "Order place nahi ho saka. Dobara try karo.",
      };
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        orders,
        placeOrder,
        refreshOrderStatus,
        getActiveOrderForTable,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
