import { Camera, MapPin, UtensilsCrossed } from "lucide-react";
const steps = [
  {
    icon: MapPin,
    title: "Find the QR Code",
    desc: "Look for the QR code placed on your table.",
  },
  {
    icon: Camera,
    title: "Scan with Your Camera",
    desc: "Open your phone camera and point it at the QR code.",
  },
  {
    icon: UtensilsCrossed,
    title: "Browse & Order",
    desc: "Explore our menu and place your order instantly.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5 py-14">

      {/* Logo + Brand */}
      <div className="flex flex-col items-center mb-10">
        <div className="mb-4">
          <img src="/logo.jpeg" alt="Top Boy Pizza" className="w-24 h-24 rounded-full object-cover" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Top Boy Pizza</h1>
        <p className="text-xs text-gray-400 mt-0.5">Best Pizza in Town</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Card Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <p className="text-[11px] font-semibold tracking-widest text-orange-500 uppercase mb-1">
            Get Started
          </p>
          <h2 className="text-lg font-bold text-gray-900">How to Order</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Follow these simple steps to place your order.
          </p>
        </div>

        {/* Steps */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="flex items-start gap-4">
              {/* Step number + icon */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-orange-500" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px h-5 bg-gray-100" />
                )}
              </div>
              {/* Text */}
              <div className="pt-1">
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Card Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            No app download needed &mdash; works directly in your browser.
          </p>
        </div>
      </div>

      <p className="text-[11px] text-gray-300 mt-8">© 2025 Top Boy Pizza</p>
    </div>
  );
}
