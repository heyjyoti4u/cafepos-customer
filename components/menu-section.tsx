"use client";

import { useState } from "react";
import { MenuItemCard } from "./menu-item-card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MenuSectionProps {
  id?: string;
  title: string;
  items: any[];
  defaultExpanded?: boolean;
}

export function MenuSection({ id, title, items, defaultExpanded = true }: MenuSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div id={id} className="mb-3">
      {/* Section header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900 text-base">{title}</h2>
          <span className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        {isExpanded
          ? <ChevronUp className="h-4 w-4 text-gray-400" />
          : <ChevronDown className="h-4 w-4 text-gray-400" />
        }
      </button>

      {isExpanded && (
        <div className="px-4 flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <MenuItemCard item={item} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
