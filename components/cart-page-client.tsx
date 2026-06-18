"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { BottomNav } from "@/components/bottom-nav";
import { Input } from "@/components/ui/input";
import {
  Minus, Plus, ArrowLeft, Check, User,
  Loader2, AlertCircle, ShoppingBag, Leaf, Flame,
  Clock, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
interface CartPageClientProps {
  tableId: string;
}

export function CartPageClient({ tableId }: CartPageClientProps) {
  const { items, updateQuantity, totalAmount, clearCart, placeOrder, getActiveOrderForTable } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [tableLocked, setTableLocked] = useState<{ by: string; orderId: string } | null>(null);

  const router = useRouter();
  const activeOrder = getActiveOrderForTable(tableId);

  // Empty cart
  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex flex-col items-center justify-center px-6">
        <div className="w-24 h-24 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-5">
          <ShoppingBag className="w-10 h-10 text-orange-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Your cart is empty</h2>
        <p className="text-sm text-gray-400 text-center mb-6">Add some delicious items from our menu</p>
        <Link href={`/table/${tableId}/menu`}>
          <button className="flex items-center gap-2 bg-orange-500 text-white text-sm font-semibold px-6 py-3 rounded-2xl">
            <ArrowLeft className="h-4 w-4" /> Browse Menu
          </button>
        </Link>
        <BottomNav tableId={tableId} />
      </div>
    );
  }

  const tax = Math.round(totalAmount * 0.05);
  const grandTotal = totalAmount + tax;

  const handlePlaceOrder = async () => {
    if (activeOrder) {
      setOrderError(`An order is already active (#...${activeOrder.id.slice(-6)}). Wait for it to complete.`);
      return;
    }
    if (!showNameInput) { setShowNameInput(true); return; }
    if (customerName.trim().length < 2) return;
    setIsOrdering(true);
    setOrderError(null);
    setTableLocked(null);
    try {
      const result = await placeOrder(tableId, customerName.trim(), orderNotes.trim());
      if (result.success) {
        setOrderSuccess(true);
        setTimeout(() => router.push(`/table/${tableId}/orders`), 800);
      } else if (result.error?.startsWith("TABLE_LOCKED:")) {
        const parts = result.error.split(":");
        setTableLocked({ by: parts[1] ?? "Someone", orderId: parts[2] ?? "" });
        setIsOrdering(false);
      } else {
        setOrderError(result.error || "Could not place order. Please try again.");
        setIsOrdering(false);
      }
    } catch {
      setOrderError("Network error. Check your connection and try again.");
      setIsOrdering(false);
    }
  };

  // Table locked
  if (tableLocked) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-5">
          <ShoppingBag className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Already Placed!</h2>
        <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-800">{tableLocked.by}</span> has already placed an order for this table.</p>
        <p className="text-xs text-gray-400 mb-6">Order ID: <span className="font-mono">#{tableLocked.orderId}</span></p>
        <div className="w-full max-w-xs flex flex-col gap-3">
          <Link href={`/table/${tableId}/orders`}>
            <button className="w-full bg-orange-500 text-white font-semibold py-3 rounded-2xl text-sm">Track Table Orders</button>
          </Link>
          <Link href={`/table/${tableId}/menu`}>
            <button className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-2xl text-sm">Back to Menu</button>
          </Link>
        </div>
        <BottomNav tableId={tableId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-52">

      <div className="px-4 pt-4 space-y-3">

        {/* Active order warning */}
        {activeOrder && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800 mb-0.5">Order already active</p>
              <p className="text-xs text-amber-700">Order #{activeOrder.id.slice(-6)} is in kitchen.</p>
              <Link href={`/table/${tableId}/orders`}>
                <button className="mt-1.5 text-xs font-semibold text-amber-600 flex items-center gap-1">Track Order <ChevronRight className="w-3 h-3" /></button>
              </Link>
            </div>
          </div>
        )}

        {/* Error */}
        {orderError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-2xl p-3 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{orderError}</span>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const addOnsTotal = item.addOns?.reduce((a, b) => a + b.price, 0) || 0;
            const unitPrice = item.price + addOnsTotal;
            const isVeg = item.isVeg !== false;
            const imageUrl = item.image_url || null;
            return (
              <div key={item.cartItemId} className="bg-white rounded-2xl border border-gray-100 p-4">
                {/* Top row: image + info + quantity */}
                <div className="flex items-start gap-3 mb-3">
                  {imageUrl ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                      <Image src={imageUrl} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-orange-50 border border-orange-100 shrink-0 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-orange-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate mb-0.5">{item.name}</h3>
                    {item.addOns && item.addOns.length > 0 && (
                      <p className="text-xs text-gray-400 mb-0.5 truncate">+ {item.addOns.map(a => a.name).join(", ")}</p>
                    )}
                    <p className="text-sm font-bold text-gray-900">₹{unitPrice * item.quantity}</p>
                  </div>

                  <div className="flex items-center gap-2 bg-orange-500 rounded-xl px-2 py-1.5 shrink-0">
                    <button disabled={isOrdering} onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-white">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center font-bold text-sm text-white">{item.quantity}</span>
                    <button disabled={isOrdering} onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-white">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Bottom row: veg badge */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isVeg
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  {isVeg ? <Leaf className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
                  {isVeg ? "VEG" : "NON VEG"}
                </span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100 space-y-2.5">

        {/* Name + notes input — shown after first Place Order click */}
        {!activeOrder && showNameInput && (
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setOrderError(null); }}
                className="pl-10 rounded-2xl border-gray-200 focus-visible:ring-orange-400"
                autoFocus
                disabled={isOrdering}
                onKeyDown={(e) => { if (e.key === "Enter") handlePlaceOrder(); }}
              />
            </div>
            <textarea
              placeholder="Any instructions? (e.g., less spicy, extra ice)"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              disabled={isOrdering}
              className="w-full text-sm p-3 rounded-2xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              rows={2}
            />
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={isOrdering || orderSuccess || !!activeOrder || (showNameInput && customerName.trim().length < 2)}
          className={`w-full h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            isOrdering || orderSuccess || !!activeOrder || (showNameInput && customerName.trim().length < 2)
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600 text-white"
          }`}
        >
          {orderSuccess ? (
            <><Check className="h-5 w-5" /> Order Placed! Redirecting...</>
          ) : isOrdering ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Placing Order...</>
          ) : activeOrder ? (
            <><Clock className="h-4 w-4" /> Wait for current order to complete</>
          ) : showNameInput ? (
            `Confirm Order — ₹${grandTotal}`
          ) : (
            `Place Order — ₹${grandTotal}`
          )}
        </button>
      </div>

      <BottomNav tableId={tableId} />
    </div>
  );
}
