'use client'

import { useState, useEffect, useRef } from "react"
import { SearchBar } from "@/components/search-bar"
import { CategoryTabs } from "@/components/category-tabs"
import { MenuSection } from "@/components/menu-section"
import { CartFloatingButton } from "@/components/cart-floating-button"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export function MenuPageClient({ tableId }: { tableId: string }) {
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch menu + Realtime subscription
  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .order("category")

      if (!error && data) setMenuItems(data)
      setLoading(false)
    }
    fetchMenu()

    // Realtime — jab admin koi item toggle kare toh auto update
    const channel = supabase
      .channel("menu_items_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "menu_items" },
        (payload) => {
          const updated = payload.new as any
          setMenuItems((prev) =>
            prev.map((item) =>
              item.id === updated.id ? { ...item, ...updated } : item
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const categories = ["All", ...Array.from(new Set(menuItems.map(item => item.category)))]

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "All" || item.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const groupedItems: Record<string, any[]> = filteredItems.reduce((acc: Record<string, any[]>, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  // Scroll-based category highlight
  useEffect(() => {
    if (searchQuery || activeCategory === "All") return

    const observers: IntersectionObserver[] = []

    categories.filter(c => c !== "All").forEach((category) => {
      const el = document.getElementById(`section-${category}`)
      if (!el) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isUserScrolling) {
            setActiveCategory(category)
            const tab = document.getElementById(`tab-${category}`)
            tab?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
          }
        },
        { threshold: 0.3, rootMargin: "-100px 0px -50% 0px" }
      )

      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [groupedItems, searchQuery, activeCategory, isUserScrolling])

  const handleCategoryChange = (category: string) => {
    setIsUserScrolling(true)
    setActiveCategory(category)

    if (category === "All") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      const el = document.getElementById(`section-${category}`)
      if (el) {
        // Offset sticky header height so section title isn't hidden under it
        const headerEl = document.querySelector(".sticky.top-0") as HTMLElement
        const headerHeight = headerEl ? headerEl.offsetHeight : 120
        const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8
        window.scrollTo({ top, behavior: "smooth" })
      }
    }

    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => setIsUserScrolling(false), 1000)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm text-gray-400">Loading menu...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-32">

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-gray-900">Our Menu</h1>
          <span className="text-xs font-semibold text-orange-500 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
            Table {tableId}
          </span>
        </div>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      {/* Sections */}
      <div className="pt-4">
        {Object.entries(groupedItems).map(([category, items]) => (
          <MenuSection key={category} id={`section-${category}`} title={category} items={items} />
        ))}

        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">No items found</p>
          </div>
        )}
      </div>

      <CartFloatingButton tableId={tableId} />
    </div>
  )
}
