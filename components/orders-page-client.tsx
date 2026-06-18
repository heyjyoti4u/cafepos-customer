"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";
import { BottomNav } from "@/components/bottom-nav";
import {
  Clock, Check, ChefHat,
  Loader2, Bell, Hourglass, XCircle, Leaf, Flame, ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface OrdersPageClientProps {
  tableId: string;
}

const STATUS_CONFIG = {
  // ── NEW: waiting for admin to accept ──────────────────────────────
  new: {
    label: "Waiting for Confirmation...",
    icon: Hourglass,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    dot: "bg-sky-500",
    showProgress: false,
  },
  declined: {
    label: "Order Declined ✕",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    dot: "bg-red-500",
    showProgress: false,
  },
  // ── existing statuses ─────────────────────────────────────────────
  pending: {
    label: "Order Received",
    icon: Clock,
    color: "text-muted-foreground",
    bg: "bg-muted/60",
    dot: "bg-muted-foreground",
    showProgress: true,
  },
  confirmed: {
    label: "Confirmed ✓",
    icon: Check,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    dot: "bg-blue-500",
    showProgress: true,
  },
  preparing: {
    label: "Being Prepared",
    icon: ChefHat,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    dot: "bg-amber-500",
    showProgress: true,
  },
  ready: {
    label: "Ready to Serve!",
    icon: Bell,
    color: "text-green-500",
    bg: "bg-green-500/10",
    dot: "bg-green-500",
    showProgress: true,
  },
  delivered: {
    label: "Order Delivered",
    icon: Check,
    color: "text-green-600",
    bg: "bg-green-600/10",
    dot: "bg-green-600",
    showProgress: false,
  },
} as const;

export function OrdersPageClient({ tableId }: OrdersPageClientProps) {
  const { orders, refreshOrderStatus } = useCart();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter to this table's orders only
  const tableOrders = orders.filter(
    (o) => !o.tableId || o.tableId === tableId
  );

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tableOrders.length === 0) return;

    const watchIds = tableOrders
      .filter((o) =>
        ["new", "pending", "confirmed", "preparing", "ready"].includes(o.status)
      )
      .map((o) => o.id);

    if (watchIds.length === 0) return;

    const channel = supabase
      .channel(`orders-page-${tableId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        async (payload) => {
          const updated = payload.new as {
            id: string;
            status: string;
            payment_status: string;
          };
          if (updated.payment_status === "paid") {
            window.location.reload();
            return;
          }
          if (watchIds.includes(updated.id)) {
            await refreshOrderStatus(updated.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableOrders.map((o) => o.id).join(","), tableId]);

  // ── Visibility refresh ────────────────────────────────────────────────────
  useEffect(() => {
    const handle = async () => {
      if (document.visibilityState !== "visible") return;
      setIsRefreshing(true);
      const active = tableOrders.filter((o) =>
        ["new", "pending", "confirmed", "preparing"].includes(o.status)
      );
      await Promise.all(active.map((o) => refreshOrderStatus(o.id)));
      setIsRefreshing(false);
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [tableOrders, refreshOrderStatus]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(date);

  const formatTime = (date: Date) => {
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    return formatDate(date);
  };

  const currentOrders = tableOrders.filter((o) => o.paymentStatus !== "paid");

  // ── Status Badge ──────────────────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: keyof typeof STATUS_CONFIG }) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    const pulse = status === "new";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} ${
          pulse ? "animate-pulse" : ""
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        {cfg.label}
      </span>
    );
  };

  // ── Progress bar (only for accepted orders) ───────────────────────────────
  const StatusProgress = ({ status }: { status: string }) => {
    const steps = ["pending", "confirmed", "preparing", "ready", "served"];
    const current = steps.indexOf(status);
    return (
      <div className="flex items-center gap-1 mt-3">
        {steps.slice(0, 4).map((step, i) => (
          <div
            key={step}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= current ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground text-center w-full">Your Orders</h2>
          {isRefreshing && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Updating...
            </div>
          )}
        </div>

        {tableOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <ClipboardList className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No orders yet</h3>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Aapke placed orders yahan dikhenge
            </p>
            <Link href={`/table/${tableId}/menu`}>
              <Button className="gap-2">Browse Menu</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {currentOrders.map((order) => {
              const status = order.status as keyof typeof STATUS_CONFIG;
              const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
              return (
                <div
                  key={order.id}
                  className="bg-card rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <StatusBadge status={status} />
                    <span className="text-xs text-muted-foreground">
                      {formatTime(new Date(order.createdAt))}
                    </span>
                  </div>

                  {/* Show progress only for accepted orders */}
                  {cfg.showProgress &&
                    ["pending", "confirmed", "preparing"].includes(order.status) && (
                      <StatusProgress status={order.status} />
                    )}

                  {/* Declined message */}
                  {order.status === "declined" && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-xs text-red-700 text-center leading-relaxed">
                        Sorry, your order was not accepted this time.<br />
                        Please speak to a staff member or try placing again.
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mt-3 mb-2">
                    Customer:{" "}
                    <span className="text-foreground font-medium">{order.customerName}</span>
                  </p>

                  <div className="space-y-2 mb-3">
                    {order.items.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm items-center">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                              item.isVeg
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-600 border border-red-200"
                            }`}>
                              {item.isVeg ? <Leaf className="w-2.5 h-2.5" /> : <Flame className="w-2.5 h-2.5" />}
                              {item.isVeg ? "V" : "NV"}
                            </span>
                            <span className="text-muted-foreground font-medium">
                              {item.quantity}× {item.name}
                            </span>
                          </div>
                          <span className="text-foreground">₹{item.price * item.quantity}</span>
                        </div>
                        {item.addOns && item.addOns.length > 0 && (
                          <div className="ml-8 mt-0.5 flex flex-wrap gap-1">
                            {item.addOns.map((addon: any, ai: number) => (
                              <span key={ai} className="text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full">
                                + {addon.name}{addon.price > 0 ? ` (+₹${addon.price})` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.instructions && (
                          <p className="ml-8 mt-0.5 text-[10px] text-amber-600 italic">"{item.instructions}"</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-3 border-t border-border">
                    <span className="font-medium text-foreground text-sm">Total</span>
                    <span className="font-semibold text-foreground">₹{order.grandTotal}</span>
                  </div>

                  {order.status === "delivered" && order.paymentStatus !== "paid" && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-lg animate-pulse">
                      <p className="text-xs text-orange-800 font-medium text-center">
                        Hope you enjoyed your meal! ❤️ <br />
                        Please make the payment at the counter.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav tableId={tableId} />
    </div>
  );
}
