import {RegisterFlow} from "@/components/RegisterFlow";
import {AppShell} from "@/components/AppShell";

export const metadata = {title: "Sign in · Hushh Protocol"};

export default function RegisterPage() {
  return (
    <AppShell
      title="Sign in"
      subtitle="Connect wallet → connect Twitter → passkey. Your X handle becomes your .night passport."
    >
      <RegisterFlow />
    </AppShell>
  );
}
