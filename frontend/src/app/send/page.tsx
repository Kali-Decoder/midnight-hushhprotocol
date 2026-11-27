import {SendForm} from "@/components/SendForm";
import {AppShell} from "@/components/AppShell";

export const metadata = {title: "Send", alternates: {canonical: "/send"}};

export default async function SendPage({
  searchParams,
}: {
  searchParams: Promise<{to?: string}>;
}) {
  const {to} = await searchParams;
  return (
    <AppShell
      title="Send"
      subtitle="Pay a .night name or X handle in NIGHT. The tip is sealed so only they can claim it."
    >
      <SendForm initialRecipient={to} />
    </AppShell>
  );
}
