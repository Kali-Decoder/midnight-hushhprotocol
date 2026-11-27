import {RegisterFlow} from "@/components/RegisterFlow";
import {AppShell} from "@/components/AppShell";

export const metadata = {title: "Sign in", alternates: {canonical: "/register"}};

export default function RegisterPage() {
  return (
    <AppShell
      title="Sign in"
      subtitle="Connect a wallet, pick a .night name, secure it with a passkey. Link X or email later if you like."
    >
      <RegisterFlow />
    </AppShell>
  );
}
