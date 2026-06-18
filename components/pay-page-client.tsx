"use client";

import { useRef } from "react";
import { useCart } from "@/lib/cart-context";
import { BottomNav } from "@/components/bottom-nav";
import {
  Receipt, Info, Leaf, Flame,
  Clock, ChefHat, Download, CheckCircle,
} from "lucide-react";

interface PayPageClientProps {
  tableId: string;
}

export function PayPageClient({ tableId }: PayPageClientProps) {
  const { orders } = useCart();
  const billRef = useRef<HTMLDivElement>(null);

  // Only delivered orders show on bill
  const deliveredOrders = orders.filter(
    (o) => o.status === "delivered" && o.status !== "declined"
  );

  // Orders still in progress
  const activeOrders = orders.filter((o) =>
    ["new", "pending", "confirmed", "preparing", "ready"].includes(o.status)
  );

  const hasAnyOrder    = orders.filter((o) => o.status !== "declined").length > 0;
  const hasBillReady   = deliveredOrders.length > 0;

  const subtotal   = deliveredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const tax        = deliveredOrders.reduce((s, o) => s + (o.tax  || 0), 0);
  const grandTotal = deliveredOrders.reduce((s, o) => s + o.grandTotal, 0);

  const now = new Date();
  const billDate = now.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const billTime = now.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  // ── Print / Download as PDF ───────────────────────────────────────────────
  const handleDownload = () => {
    window.print();
  };

  return (
    <>
      {/* Print-only styles — hide everything except bill, show bill on print */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #bill-print-area,
          #bill-print-area * { visibility: visible !important; }
          #bill-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 pb-28">

        {/* ── No orders yet ── */}
        {!hasAnyOrder && (
          <div className="flex flex-col items-center justify-center min-h-[75vh] gap-3 px-6 text-center">
            <div className="w-24 h-24 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-2">
              <Receipt className="h-10 w-10 text-orange-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No orders yet</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Place an order from the menu and your bill will appear here once it's delivered.
            </p>
          </div>
        )}

        {/* ── Orders in kitchen — bill not ready ── */}
        {hasAnyOrder && !hasBillReady && (
          <div className="flex flex-col items-center justify-center min-h-[75vh] gap-4 px-6 text-center">
            <div className="w-24 h-24 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-2 animate-pulse">
              <ChefHat className="h-10 w-10 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Order in Progress</h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Your bill will be available here once your order has been delivered to your table.
            </p>
            {/* Show active order statuses */}
            <div className="w-full max-w-xs space-y-2 mt-2">
              {activeOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="font-medium">{o.customerName}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    o.status === "preparing" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                    o.status === "ready"     ? "bg-green-50 text-green-600 border border-green-200" :
                    "bg-sky-50 text-sky-600 border border-sky-200"
                  }`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Bill ready (at least one delivered order) ── */}
        {hasBillReady && (
          <div className="px-4 pt-5 pb-4 space-y-3 animate-slide-up-fade">

            {/* Bill header */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-orange-500 px-5 py-4 text-white text-center">
                <p className="text-xs font-semibold opacity-80 uppercase tracking-widest mb-1">TopBoy Pizza</p>
                <h2 className="text-xl font-black">Table {tableId} — Bill</h2>
                <p className="text-xs opacity-70 mt-1">{billDate} &nbsp;·&nbsp; {billTime}</p>
              </div>
            </div>

            {/* Per-order items */}
            {deliveredOrders.map((order, oi) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold text-gray-800">{order.customerName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">#{order.id.slice(-6)}</span>
                </div>

                <div className="px-4 py-3 space-y-2.5">
                  {order.items.map((item, idx) => {
                    const addOnsTotal = item.addOns?.reduce((s, a) => s + a.price, 0) || 0;
                    const unitPrice   = item.price + addOnsTotal;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between items-start text-sm">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-sm shrink-0 mt-0.5 ${
                              item.isVeg
                                ? "bg-green-50 text-green-700 border border-green-300"
                                : "bg-red-50 text-red-600 border border-red-300"
                            }`}>
                              {item.isVeg ? <Leaf className="w-2 h-2" /> : <Flame className="w-2 h-2" />}
                            </span>
                            <span className="text-gray-700 leading-snug">
                              {item.quantity}× {item.name}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900 shrink-0 ml-2">
                            ₹{unitPrice * item.quantity}
                          </span>
                        </div>
                        {/* Add-ons under item */}
                        {item.addOns && item.addOns.length > 0 && (
                          <div className="ml-6 mt-0.5 space-y-0.5">
                            {item.addOns.map((a, ai) => (
                              <p key={ai} className="text-[11px] text-gray-400">+ {a.name} (₹{a.price})</p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Bill summary */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <Receipt className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-gray-900 text-sm">Bill Summary</h3>
              </div>
              <div className="px-4 py-3 space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-800 font-semibold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">GST</span>
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full">5%</span>
                  </div>
                  <span className="text-gray-800 font-semibold">₹{tax}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="font-black text-gray-900">Total Amount</span>
                  <span className="font-black text-orange-500 text-xl">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Pay at counter notice */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800 mb-0.5">Pay at the Counter</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Show this screen or download the PDF to present at the billing counter.
                </p>
              </div>
            </div>

            {/* Download PDF button */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 active:bg-black text-white font-bold rounded-2xl py-4 text-sm transition-colors shadow-lg shadow-gray-900/20"
            >
              <Download className="w-4 h-4" />
              Download Bill as PDF
            </button>

          </div>
        )}

      </div>

      {/* Print area — positioned off-screen so React fully renders it,
          but user can't see it. Only visible during window.print() */}
      <div
        id="bill-print-area"
        ref={billRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "380px",
        }}
      >
        <div style={{ fontFamily: "monospace", padding: "24px", maxWidth: "380px", margin: "0 auto", fontSize: "13px", color: "#111" }}>
          <div style={{ textAlign: "center", marginBottom: "16px", borderBottom: "2px dashed #ccc", paddingBottom: "12px" }}>
            <p style={{ fontSize: "18px", fontWeight: "900", margin: "0 0 4px" }}>🍕 TopBoy Pizza</p>
            <p style={{ margin: "0", fontSize: "11px", color: "#555" }}>Table {tableId}</p>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#555" }}>{billDate} · {billTime}</p>
          </div>

          {deliveredOrders.map((order) => (
            <div key={order.id} style={{ marginBottom: "12px" }}>
              <p style={{ fontWeight: "700", margin: "0 0 6px", fontSize: "12px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                {order.customerName} &nbsp;<span style={{ fontWeight: "400", color: "#888" }}>#{order.id.slice(-6)}</span>
              </p>
              {order.items.map((item, i) => {
                const addOnsTotal = item.addOns?.reduce((s, a) => s + a.price, 0) || 0;
                const unitPrice   = item.price + addOnsTotal;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{unitPrice * item.quantity}</span>
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ borderTop: "2px dashed #ccc", paddingTop: "10px", marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span>Subtotal</span><span>₹{subtotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>GST (5%)</span><span>₹{tax}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "900", fontSize: "16px", borderTop: "1px solid #ccc", paddingTop: "8px" }}>
              <span>TOTAL</span><span>₹{grandTotal}</span>
            </div>
          </div>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "#888" }}>
            Thank you for visiting TopBoy Pizza! 🍕
          </p>
        </div>
      </div>

      <BottomNav tableId={tableId} />
    </>
  );
}
