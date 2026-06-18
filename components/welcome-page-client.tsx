"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Utensils } from "lucide-react";
import { routes } from "@/lib/routes";

interface WelcomePageClientProps {
  tableId: string;
}

export function WelcomePageClient({ tableId }: WelcomePageClientProps) {
  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center px-5">
      {/* Logo */}
      <div className="mb-5">
        <img src="/logo.jpeg" alt="Top Boy Pizza" className="w-28 h-28 rounded-full object-cover" />
      </div>

      {/* Cafe name */}
      <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
        Top Boy Pizza
      </h1>
      <p className="text-sm text-gray-400 mb-8">Best Pizza in Town</p>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-md overflow-hidden">
        {/* Card top bar */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
              Your Table
            </p>
            <p className="text-xl font-black text-gray-900">Table {tableId}</p>
          </div>
          <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center">
            <Utensils className="w-5 h-5 text-orange-500" />
          </div>
        </div>

        {/* Card body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Welcome! Browse our full menu and place your order directly from
            this page — no app needed.
          </p>

          <Link href={routes.menu(tableId)}>
            <Button className="w-full h-12 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl gap-2 shadow-none">
              View Menu
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Card footer */}
        <div className="px-6 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-300 text-center">
            Powered by Jyoti and Bishal
          </p>
        </div>
      </div>
    </div>
  );
}
