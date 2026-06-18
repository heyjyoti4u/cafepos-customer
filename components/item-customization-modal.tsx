"use client";

import { useState, useEffect } from "react";
import { X, Minus, Plus, Loader2 } from "lucide-react";
import Image from "next/image";
import { MenuItem, AddOn } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";

// ── Category-level preparation variants (free, just changes cooking method)
interface CatVariant { name: string; icon: string; desc: string; extraPrice: number; }

const CATEGORY_VARIANTS: Record<string, CatVariant[]> = {
  "Ice Tea":    [{ name: "Regular", icon: "🧊", desc: "300ml, chilled",       extraPrice: 0  }, { name: "Large",       icon: "🥤", desc: "500ml, extra",        extraPrice: 40 }],
  "Fresh Juice":[{ name: "Regular", icon: "🥛", desc: "250ml, fresh",         extraPrice: 0  }, { name: "Large",       icon: "🍹", desc: "400ml, fresh",        extraPrice: 50 }],
  "Milk Shake": [{ name: "Regular", icon: "🥛", desc: "300ml creamy",         extraPrice: 0  }, { name: "Large",       icon: "🍦", desc: "500ml extra",         extraPrice: 60 }],
  "Hot Coffee": [{ name: "Regular", icon: "☕", desc: "250ml brewed",         extraPrice: 0  }, { name: "Large",       icon: "🫖", desc: "350ml strong",        extraPrice: 40 }],
  "Coffee":     [{ name: "Regular", icon: "☕", desc: "250ml blended",        extraPrice: 0  }, { name: "Large",       icon: "🥤", desc: "350ml extra",         extraPrice: 40 }],
  "Open Bao":   [{ name: "Regular", icon: "🌶️", desc: "Mild spice",          extraPrice: 0  }, { name: "Spicy",       icon: "🔥", desc: "Extra spice",         extraPrice: 0  }, { name: "Jain", icon: "🌿", desc: "No onion, no garlic", extraPrice: 0 }],
  "Fritters":   [{ name: "Regular", icon: "🧆", desc: "Classic",             extraPrice: 0  }, { name: "Spicy",       icon: "🌶️", desc: "Extra chilli",        extraPrice: 0  }, { name: "Jain", icon: "🌿", desc: "No onion, no garlic", extraPrice: 0 }],
  "Breakfast":  [{ name: "Regular", icon: "🍳", desc: "Classic platter",      extraPrice: 0  }, { name: "Jain",        icon: "🌿", desc: "No onion, no garlic", extraPrice: 0  }],
  "Ice Cream":  [{ name: "Single Scoop", icon: "🍦", desc: "One scoop",       extraPrice: 0  }, { name: "Double Scoop", icon: "🍨", desc: "Two scoops",         extraPrice: 60 }],
  "Sundae":     [{ name: "Regular", icon: "🍨", desc: "Classic sundae",       extraPrice: 0  }, { name: "Large",       icon: "🍧", desc: "Extra toppings",      extraPrice: 60 }],
  "Salad":      [{ name: "Regular", icon: "🥗", desc: "Single serving",       extraPrice: 0  }, { name: "Large",       icon: "🍱", desc: "Sharing size",        extraPrice: 60 }],
  "Waffle":     [{ name: "Regular", icon: "🧇", desc: "Classic waffle",       extraPrice: 0  }, { name: "Large",       icon: "🍽️", desc: "Double waffle",       extraPrice: 80 }],
};

interface DbVariant { name: string; price: number; }

interface ItemCustomizationModalProps {
  item: MenuItem;
  onClose: () => void;
  // finalItem has price already overwritten to variant price — use it as-is
  onAddToCart: (item: MenuItem, quantity: number, addOns: AddOn[]) => void;
}

export function ItemCustomizationModal({ item, onClose, onAddToCart }: ItemCustomizationModalProps) {
  const category        = (item as any).category || "";
  const categoryVariants = CATEGORY_VARIANTS[category] || [{ name: "Regular", icon: "🍽️", desc: "Standard serving", extraPrice: 0 }];

  const [selectedCatVariant, setSelectedCatVariant] = useState<CatVariant>(categoryVariants[0]);
  const [dbVariants,         setDbVariants]          = useState<DbVariant[]>([]);
  // selectedDbVariant = null means "no variants in DB — use item.price as base"
  const [selectedDbVariant,  setSelectedDbVariant]   = useState<DbVariant | null>(null);
  const [addons,             setAddons]               = useState<{ name: string; price: number }[]>([]);
  const [selectedAddons,     setSelectedAddons]       = useState<Set<string>>(new Set());
  const [quantity,           setQuantity]             = useState(1);
  const [loadingAddons,      setLoadingAddons]        = useState(true);

  const imageUrl    = (item as any).image_url;
  const description = (item as any).description;
  const isVeg       = (item as any).is_veg !== false;

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Fetch addons + variants from Supabase
  useEffect(() => {
    const fetch = async () => {
      setLoadingAddons(true);
      const { data } = await supabase
        .from("menu_items")
        .select("addons, variants")
        .eq("name", item.name)
        .single();

      if (data) {
        if (Array.isArray(data.addons) && data.addons.length > 0) {
          setAddons(data.addons);
        }
        if (Array.isArray(data.variants) && data.variants.length > 0) {
          setDbVariants(data.variants);
          setSelectedDbVariant(data.variants[0]); // auto-select first variant
        }
      }
      setLoadingAddons(false);
    };
    fetch();
  }, [item.name]);

  const toggleAddon = (addon: { name: string; price: number }) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      next.has(addon.name) ? next.delete(addon.name) : next.add(addon.name);
      return next;
    });
  };

  // ── PRICING LOGIC ────────────────────────────────────────────────────────
  // If DB variants exist (e.g. Half Plate ₹150 / Full Plate ₹250):
  //   → base = variant.price  (REPLACES item.price, not added to it)
  //   → category extraPrice (e.g. Large +₹40) adds on top
  // If no DB variants: base = item.price + category extraPrice
  const basePrice =
    dbVariants.length > 0 && selectedDbVariant
      ? selectedDbVariant.price + selectedCatVariant.extraPrice
      : item.price + selectedCatVariant.extraPrice;

  const addonsTotal = addons
    .filter((a) => selectedAddons.has(a.name))
    .reduce((s, a) => s + a.price, 0);

  const totalPrice = (basePrice + addonsTotal) * quantity;

  // ── ADD TO CART ───────────────────────────────────────────────────────────
  const handleAdd = () => {
    // Build the finalItem — price is overwritten to the variant price
    const finalItem: MenuItem & { instructions?: string } = {
      ...item,
      // If variant selected → its price IS the item price (not an addon)
      price: dbVariants.length > 0 && selectedDbVariant
        ? selectedDbVariant.price
        : item.price,
      // Variant name embedded in item name for cart + kitchen display
      name: dbVariants.length > 0 && selectedDbVariant
        ? `${item.name} (${selectedDbVariant.name})`
        : item.name,
    };

    const addOnsList: AddOn[] = [];

    // Category variant: if paid (Large +₹40) → addon; if free (Jain/Spicy) → instructions
    if (selectedCatVariant.extraPrice > 0) {
      addOnsList.push({ name: selectedCatVariant.name, price: selectedCatVariant.extraPrice });
    } else if (selectedCatVariant.name !== "Regular") {
      finalItem.instructions = `Prep: ${selectedCatVariant.name}`;
    }

    // Selected addons
    addons
      .filter((a) => selectedAddons.has(a.name))
      .forEach((a) => addOnsList.push({ name: a.name, price: a.price }));

    onAddToCart(finalItem, quantity, addOnsList);
    onClose();
  };

  const showCatVariants = categoryVariants.length > 1;
  const hasVariants     = dbVariants.length > 0;

  const variantLabel = hasVariants && selectedDbVariant
    ? selectedDbVariant.name
    : selectedCatVariant.name;

  return (
    <div
      className="fixed inset-0 z-[9999] flex justify-center items-end bg-black/50 animate-backdrop-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl flex flex-col max-h-[92vh] shadow-2xl animate-sheet-slide-up">

        {/* Drag handle + close */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-4 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* Item hero */}
          <div className="flex items-start gap-4 px-5 pt-3 pb-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm border mb-1 inline-block ${
                isVeg ? "border-green-600 text-green-700" : "border-red-500 text-red-600"
              }`}>
                {isVeg ? "VEG" : "NON VEG"}
              </span>
              <h2 className="text-base font-bold text-gray-900 leading-snug mb-1">{item.name}</h2>
              {description && (
                <p className="text-xs text-gray-400 leading-relaxed mb-1">{description}</p>
              )}
              {/* Live price updates as user selects variant */}
              <p className="text-base font-bold text-orange-500">₹{basePrice}</p>
            </div>
            {imageUrl && (
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                <Image src={imageUrl} alt={item.name} width={96} height={96} className="object-cover w-full h-full" />
              </div>
            )}
          </div>

          {/* ── DB Variants: Size / Portion / Grams (REPLACES item.price) ── */}
          {hasVariants && (
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-gray-900">Choose Size / Portion</h3>
                <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">Required</span>
              </div>
              <div className="flex flex-col gap-2">
                {dbVariants.map((variant) => {
                  const sel = selectedDbVariant?.name === variant.name;
                  return (
                    <button
                      key={variant.name}
                      onClick={() => setSelectedDbVariant(variant)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                        sel ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          sel ? "border-orange-500" : "border-gray-300"
                        }`}>
                          {sel && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{variant.name}</p>
                      </div>
                      {/* Show FULL price (not "+price") — this IS the price */}
                      <span className="text-sm font-bold text-gray-900">₹{variant.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Category Variants: Preparation / Size modifier ── */}
          {showCatVariants && (
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-gray-900">Preparation</h3>
                <span className="text-[10px] font-semibold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">Required</span>
              </div>
              <div className="flex flex-col gap-2">
                {categoryVariants.map((variant) => {
                  const sel = selectedCatVariant.name === variant.name;
                  return (
                    <button
                      key={variant.name}
                      onClick={() => setSelectedCatVariant(variant)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                        sel ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        sel ? "border-orange-500" : "border-gray-300"
                      }`}>
                        {sel && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                      </div>
                      <span className="text-xl shrink-0">{variant.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{variant.name}</p>
                        <p className="text-xs text-gray-400">{variant.desc}</p>
                      </div>
                      {variant.extraPrice > 0 && (
                        <span className="text-sm font-semibold text-gray-600 shrink-0">+ ₹{variant.extraPrice}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Add-ons ── */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-gray-900">Add Extras</h3>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">Optional</span>
            </div>

            {loadingAddons ? (
              <div className="flex items-center gap-2 py-4 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading extras...</span>
              </div>
            ) : addons.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No extras available for this item.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {addons.map((addon) => {
                  const sel = selectedAddons.has(addon.name);
                  return (
                    <button
                      key={addon.name}
                      onClick={() => toggleAddon(addon)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                        sel ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      {/* Checkbox style for multi-select addons */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        sel ? "border-orange-500 bg-orange-500" : "border-gray-300"
                      }`}>
                        {sel && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 flex-1">{addon.name}</p>
                      <span className="text-sm font-semibold text-gray-600 shrink-0">
                        {addon.price === 0 ? "Free" : `+ ₹${addon.price}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>

        {/* ── Sticky footer ── */}
        <div className="px-5 pt-3 pb-5 border-t border-gray-100 shrink-0 bg-white shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-800">Quantity</span>
            <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-3 py-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 flex items-center justify-center bg-white rounded-xl shadow-sm text-orange-500"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-gray-900 w-5 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 flex items-center justify-center bg-white rounded-xl shadow-sm text-orange-500"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-2xl font-bold flex items-center justify-between px-5 py-4 transition-colors shadow-lg shadow-orange-200"
          >
            <span className="text-sm">Add to Cart • {variantLabel}</span>
            <span className="text-base font-black">₹{totalPrice}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
