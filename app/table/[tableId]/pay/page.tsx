import { PayPageClient } from "@/components/pay-page-client";

interface PayPageProps {
  params: Promise<{ tableId: string }>;
}

export default async function PayPage({ params }: PayPageProps) {
  const { tableId } = await params;
  return <PayPageClient tableId={tableId} />;
}

export function generateMetadata() {
  return {
    title: "Pay Bill - Top Boy Pizza",
    description: "Complete your payment",
  };
}
