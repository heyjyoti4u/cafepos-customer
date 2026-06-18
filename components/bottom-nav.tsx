"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UtensilsCrossed, ClipboardList, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  tableId: string;
}

export function BottomNav({ tableId }: BottomNavProps) {
  const pathname = usePathname();

  if (pathname === `/table/${tableId}`) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-40 pb-safe">
      <Link href={`/table/${tableId}/menu`} className="flex flex-col items-center gap-1">
        <UtensilsCrossed className={cn("h-5 w-5", pathname.includes("/menu") ? "text-orange-500" : "text-gray-400")} />
        <span className={cn("text-[10px] font-semibold", pathname.includes("/menu") ? "text-orange-500" : "text-gray-400")}>Menu</span>
      </Link>

      <Link href={`/table/${tableId}/orders`} className="flex flex-col items-center gap-1">
        <ClipboardList className={cn("h-5 w-5", pathname.includes("/orders") ? "text-orange-500" : "text-gray-400")} />
        <span className={cn("text-[10px] font-semibold", pathname.includes("/orders") ? "text-orange-500" : "text-gray-400")}>Orders</span>
      </Link>

      <Link href={`/table/${tableId}/pay`} className="flex flex-col items-center gap-1">
        <Receipt className={cn("h-5 w-5", pathname.includes("/pay") ? "text-orange-500" : "text-gray-400")} />
        <span className={cn("text-[10px] font-semibold", pathname.includes("/pay") ? "text-orange-500" : "text-gray-400")}>Bill</span>
      </Link>
    </div>
  );
}
