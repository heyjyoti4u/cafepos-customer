"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightShadow, setShowRightShadow] = useState(true);
  const [showLeftShadow, setShowLeftShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftShadow(scrollLeft > 0);
        setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 10);
      }
    };
    const ref = scrollRef.current;
    ref?.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => ref?.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative">
      {showLeftShadow && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
      )}
      {showRightShadow && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />
      )}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto py-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category) => (
          <button
            key={category}
            id={`tab-${category}`}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
              activeCategory === category
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
