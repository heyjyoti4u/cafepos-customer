import type { Metadata, Viewport } from "next"; 
import { Inter } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/cookie-consent";
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Top Boy Pizza",
  description: "Scan, Order, and Enjoy your meal!",
};

export const viewport: Viewport = {
  themeColor: "#ed1c23",
};

// 👇 YE WALA HISSA GAYAB HO GAYA THA TUMHARI FILE SE 👇
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <CookieConsent />
        <SpeedInsights />
      </body>
    </html>
  );
}