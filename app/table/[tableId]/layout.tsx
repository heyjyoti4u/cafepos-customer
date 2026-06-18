import { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { CartProviderWrapper } from "@/components/cart-provider-wrapper"; // Use the wrapper
import { GeofenceGuard } from "@/components/geofence-guard"; 

interface TableLayoutProps {
  children: ReactNode;
  params: Promise<{ tableId: string }>;
}

export default async function TableLayout({
  children,
  params,
}: TableLayoutProps) {
  
  const { tableId } = await params;

  return (
    // Wrap the content with the client-side provider wrapper
    <CartProviderWrapper>
      <GeofenceGuard>
        <div className="min-h-screen bg-background text-foreground">
<main className="max-w-md mx-auto pb-20">{children}</main>
          <BottomNav tableId={tableId} />
        </div>
      </GeofenceGuard>
    </CartProviderWrapper>
  );
}
