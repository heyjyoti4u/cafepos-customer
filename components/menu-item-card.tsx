"use client";

import Image from "next/image";
import { useState } from "react";
import { Leaf, Flame, Minus, Plus } from "lucide-react";
import { MenuItem, AddOn, useCart } from "@/lib/cart-context";
import { ItemCustomizationModal } from "./item-customization-modal";

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { items, addItem, removeItem } = useCart();
  const [showModal, setShowModal] = useState(false);

  const isVeg       = (item as any).is_veg !== false;
  const imageUrl    = (item as any).image_url;
  const isAvailable = (item as any).is_available !== false;

  // Total qty across ALL variants of this base item
  const quantity = items
    .filter((i) => i.id === item.id)
    .reduce((s, i) => s + i.quantity, 0);

  const handleModalAdd = (finalItem: MenuItem, qty: number, addOns: AddOn[]) => {
    const isVegValue = (finalItem as any).is_veg ?? (finalItem as any).isVeg ?? true;
    for (let i = 0; i < qty; i++) {
      addItem({ ...finalItem, addOns, isVeg: isVegValue });
    }
  };

  const handleRemoveOne = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Remove one unit from the most-recently-added variant of this item
    const last = [...items].reverse().find((i) => i.id === item.id);
    if (last) removeItem(last.cartItemId);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  };

  // entire card is clickable when available
  const handleCardClick = () => {
    if (isAvailable) setShowModal(true);
  };

  return (
    <>
      <div
        className={`px-4 py-4 ${isAvailable ? "cursor-pointer active:bg-gray-50 transition-colors" : "opacity-60"}`}
        onClick={handleCardClick}
      >
        {/* Top row: info + image */}
        <div className="flex items-start gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold leading-snug mb-1 ${isAvailable ? "text-gray-900" : "text-gray-400"}`}>
              {item.name}
            </h3>
            {(item as any).description && (
              <p className="text-xs text-gray-400 leading-relaxed mb-1 line-clamp-2">
                {(item as any).description}
              </p>
            )}
            <p className={`text-sm font-bold ${isAvailable ? "text-gray-900" : "text-gray-400"}`}>
              ₹{item.price}
            </p>
          </div>

          {/* Image */}
          <div className="relative shrink-0">
            {imageUrl ? (
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100">
                <Image
                  src={imageUrl}
                  alt={item.name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                <span className="text-2xl">🍽️</span>
              </div>
            )}
            {!isAvailable && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-2xl py-1 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white tracking-wide">NOT AVAILABLE</span>
              </div>
            )}

            {/* ADD / stepper — overlaps bottom of image like Zomato */}
            {isAvailable && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                {quantity === 0 ? (
                  <button
                    onClick={handleAddClick}
                    className="px-5 py-1.5 rounded-xl border-2 border-orange-500 text-orange-500 text-sm font-bold bg-white shadow-sm hover:bg-orange-50 transition-colors whitespace-nowrap"
                  >
                    ADD
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-2 bg-orange-500 rounded-xl px-2 py-1.5 shadow-md shadow-orange-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleRemoveOne}
                      className="w-6 h-6 flex items-center justify-center text-white"
                    >
                      <Minus className="w-3.5 h-3.5" strokeWidth={3} />
                    </button>
                    <span className="text-white font-bold text-sm w-4 text-center">{quantity}</span>
                    <button
                      onClick={handleAddClick}
                      className="w-6 h-6 flex items-center justify-center text-white"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: veg badge (extra padding to make room for overlapping stepper) */}
        <div className="flex items-center mt-4">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isVeg
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}>
            {isVeg ? <Leaf className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
            {isVeg ? "VEG" : "NON VEG"}
          </span>

          {!isAvailable && (
            <span className="ml-auto text-[11px] font-semibold text-gray-400 border border-gray-200 px-3 py-1 rounded-xl">
              Unavailable
            </span>
          )}
        </div>
      </div>

      {showModal && (
        <ItemCustomizationModal
          item={item}
          onClose={() => setShowModal(false)}
          onAddToCart={handleModalAdd}
        />
      )}
    </>
  );
}
