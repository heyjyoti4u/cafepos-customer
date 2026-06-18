"use client";

import { useCart } from "@/lib/cart-context";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";

interface CartFloatingButtonProps {
  tableId: string;
}

export function CartFloatingButton({ tableId }: CartFloatingButtonProps) {
  const { totalItems, totalAmount } = useCart();

  if (totalItems === 0) return null;

  return (
    <Link
      href={routes.cart(tableId)}
      className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-20"
    >
      <div className="bg-orange-500 rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-lg shadow-orange-200">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag className="h-5 w-5 text-white" />
            <span className="absolute -top-2 -right-2 bg-white text-orange-500 text-xs font-black rounded-full h-4 w-4 flex items-center justify-center">
              {totalItems}
            </span>
          </div>
          <span className="text-white font-semibold text-sm">
            {totalItems} item{totalItems !== 1 && "s"} in cart
          </span>
        </div>
        <span className="text-white font-bold">₹{totalAmount} →</span>
      </div>
    </Link>
  );
}
