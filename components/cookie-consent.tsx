'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Cookie } from 'lucide-react'

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const hasConsented = localStorage.getItem('ff-cookie-consent')
    
    if (!hasConsented) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('ff-cookie-consent', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] md:p-4 animate-in slide-in-from-bottom-10">
      <div className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md text-slate-200 p-4 md:p-6 rounded-t-2xl md:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 border-t md:border border-slate-800">
        
        {/* Top Section */}
        <div className="flex items-start md:items-center gap-3 w-full">
          <div className="mt-0.5 md:mt-0 bg-slate-800 p-2 rounded-full shrink-0">
            <Cookie className="w-4 h-4 md:w-6 md:h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm md:text-base font-semibold text-white leading-tight mb-0.5 md:mb-1">
              We Use Cookies 🍪
            </h3>
            <p className="text-[11px] md:text-sm text-slate-400 leading-snug line-clamp-3 md:line-clamp-none">
              We use essential cookies to temporarily save your cart. If your phone locks or you accidentally close the browser, your selected food items stay safe. These cookies are automatically deleted once you pay at the counter.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-2 md:flex items-center gap-2 md:gap-3 w-full md:w-auto shrink-0 mt-1 md:mt-0">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-9 md:h-10 text-xs md:text-sm"
            onClick={() => setIsVisible(false)}
          >
            Decline
          </Button>
          <Button 
            size="sm"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold h-9 md:h-10 text-xs md:text-sm"
            onClick={handleAccept}
          >
            Accept Cookies
          </Button>
        </div>
        
      </div>
    </div>
  )
}
