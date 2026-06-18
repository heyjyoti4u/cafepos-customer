import { WelcomePageClient } from "@/components/welcome-page-client";

interface TablePageProps {
  params: Promise<{ tableId: string }>;
}

export default async function TablePage({ params }: TablePageProps) {
  const { tableId } = await params;
  return <WelcomePageClient tableId={tableId} />;
}

export function generateMetadata() {
  return {
    title: "Top Boy Pizza - Welcome",
    description: "Welcome to Top Boy Pizza",
  };
}
