import {LookoutForm} from "@/components/LookoutForm";
import {AppShell} from "@/components/AppShell";

export const metadata = {title: "Lookout · Hushh Protocol"};

export default function LookoutPage() {
  return (
    <AppShell
      title="Lookout"
      subtitle="Search a .night name or X handle. See if it has a Midnight passport."
    >
      <div className="animate-rise">
        <LookoutForm />
      </div>
    </AppShell>
  );
}
