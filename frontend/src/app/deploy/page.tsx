import {AppShell} from "@/components/AppShell";
import {DeployPanel} from "@/components/DeployPanel";

export const metadata = {title: "Deploy", robots: {index: false}};

export default function DeployPage() {
  return (
    <AppShell
      title="Deploy"
      subtitle="Deploy the Hushh contracts to Midnight from your own wallet. Your key never leaves it."
    >
      <DeployPanel />
    </AppShell>
  );
}
