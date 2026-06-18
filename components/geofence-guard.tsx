'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, MapPinOff, Loader2, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react'

const RESTAURANT_LAT = 21.1702;
const RESTAURANT_LON = 72.8311;
const MAX_ALLOWED_DISTANCE = 10000000;

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type Step = 'checking' | 'ask' | 'loading' | 'stuck' | 'denied' | 'allowed'

export function GeofenceGuard({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<Step>('checking')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!navigator?.geolocation) { setStep('ask'); return }
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') fetchLocation()
        else setStep('ask')
      }).catch(() => setStep('ask'))
    } else {
      setStep('ask')
    }
  }, [])

  const fetchLocation = () => {
    setStep('loading')

    // If no response in 8s, show "stuck" screen
    timerRef.current = setTimeout(() => setStep('stuck'), 8000)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        const d = getDistance(pos.coords.latitude, pos.coords.longitude, RESTAURANT_LAT, RESTAURANT_LON)
        setStep(d <= MAX_ALLOWED_DISTANCE ? 'allowed' : 'ask')
      },
      (err) => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setStep(err.code === 1 ? 'denied' : 'ask')
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
    )
  }

  if (step === 'allowed') return <>{children}</>

  if (step === 'checking' || step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-5" />
        <p className="text-gray-800 font-bold text-base mb-2">Checking your location...</p>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          Your phone may show a <span className="font-semibold text-gray-600">location dialog</span> — tap <span className="font-semibold text-gray-600">"Allow"</span> to continue.
        </p>
      </div>
    )
  }

  if (step === 'stuck') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-5">
          <MapPin className="w-9 h-9 text-orange-400" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Location Not Responding</h2>
        <p className="text-sm text-gray-500 mb-5 max-w-xs leading-relaxed">
          Location is taking too long. Make sure location is enabled on your phone:
        </p>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-left w-full max-w-xs mb-6 space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="font-bold text-gray-800 shrink-0">Android:</span>
            <span>Settings → Location → Turn On</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-start gap-2">
            <span className="font-bold text-gray-800 shrink-0">iPhone:</span>
            <span>Settings → Privacy → Location Services → Turn On</span>
          </div>
        </div>
        <button
          onClick={fetchLocation}
          className="h-12 px-8 bg-orange-500 active:bg-orange-600 text-white font-bold rounded-2xl text-sm flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    )
  }

  if (step === 'denied') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-5">
          <MapPinOff className="w-9 h-9 text-red-400" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Location Blocked</h2>
        <p className="text-sm text-gray-500 mb-5 max-w-xs leading-relaxed">
          You blocked location for this app. Here's how to enable it:
        </p>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-left w-full max-w-xs mb-6 space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="font-bold text-gray-800 shrink-0">Android:</span>
            <span>Tap the lock icon in Chrome address bar → Permissions → Location → Allow</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex items-start gap-2">
            <span className="font-bold text-gray-800 shrink-0">iPhone:</span>
            <span>Settings → Safari → Location → Allow</span>
          </div>
        </div>
        <button
          onClick={fetchLocation}
          className="h-12 px-8 bg-orange-500 active:bg-orange-600 text-white font-bold rounded-2xl text-sm flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          I've Enabled It — Try Again
        </button>
      </div>
    )
  }

  // step === 'ask'
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mb-5">
        <MapPin className="w-9 h-9 text-orange-500" />
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-2">Allow Location</h2>
      <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">
        We need to confirm you're at the restaurant before you can order.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-4 text-left w-full max-w-xs mb-6 space-y-3">
        <div className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
          <p className="text-sm text-gray-600">Tap <span className="font-semibold text-gray-800">"Allow Location"</span> below</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
          <p className="text-sm text-gray-600">Your phone will ask for permission — tap <span className="font-semibold text-gray-800">"Allow"</span></p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">You'll be taken to the menu automatically</p>
        </div>
      </div>

      <button
        onClick={fetchLocation}
        className="h-12 px-8 bg-orange-500 active:bg-orange-600 text-white font-bold rounded-2xl text-sm flex items-center gap-2"
      >
        <ShieldCheck className="h-4 w-4" />
        Allow Location
      </button>
      <p className="text-xs text-gray-300 mt-4">Only used to verify you're at the cafe.</p>
    </div>
  )
}
