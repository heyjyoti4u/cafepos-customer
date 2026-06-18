import { OrdersPageClient } from "@/components/orders-page-client";

interface OrdersPageProps {
  params: Promise<{ tableId: string }>;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { tableId } = await params;
  return <OrdersPageClient tableId={tableId} />;
}

export function generateMetadata() {
  return {
    title: "Your Orders - Top Boy Pizza",
    description: "Track your order status",
  };
}
