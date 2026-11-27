import {Inbox} from "@/components/Inbox";
import {AppShell} from "@/components/AppShell";

export const metadata = {title: "Inbox", robots: {index: false}};

export default function InboxPage() {
  return (
    <AppShell
      title="Inbox"
      subtitle="Tips sealed to your passport. Claim them with a zero-knowledge proof on Midnight."
    >
      <Inbox />
    </AppShell>
  );
}
