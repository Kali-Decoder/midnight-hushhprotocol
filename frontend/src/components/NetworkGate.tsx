"use client";

import {formatError} from "@/lib/errors";
import {useIsCorrectNetwork} from "@/lib/midnight/hooks";
import {useDisconnect} from "@/lib/midnight/hooks";
import {toast} from "@/lib/toast";
import {GlobeIcon, LoaderIcon} from "@/components/icons";

export function useIsCorrectChain() {
  return useIsCorrectNetwork();
}

export function SwitchNetworkButton({
  className = "btn-primary",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const {isCorrectChain, isConnected, targetName} = useIsCorrectChain();
  // Midnight wallets pick the network themselves: disconnect so the user can
  // switch networks in the wallet and reconnect.
  const {disconnectAsync, isPending} = useDisconnect();
  const error = null as Error | null;

  if (!isConnected || isCorrectChain) return null;

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          void disconnectAsync().then(
            () => toast.info(`Switch your wallet to ${targetName}, then connect again.`),
            (err) => toast.error(err)
          )
        }
        className={className}
      >
        {isPending ? (
          <LoaderIcon className="h-4 w-4 animate-spin" />
        ) : (
          !compact && <GlobeIcon className="h-4 w-4" />
        )}
        {isPending
          ? "Switching…"
          : compact
            ? "Switch network"
            : `Switch to ${targetName}`}
      </button>
      {error && !compact ? (
        <p className="mt-2 text-center text-xs text-amber">{formatError(error)}</p>
      ) : null}
    </>
  );
}

/** Banner + switch CTA when wallet is on the wrong chain. */
export function NetworkGate({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const {isConnected, isCorrectChain, targetName} = useIsCorrectChain();

  if (!isConnected || isCorrectChain) {
    return <>{children}</>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-xl border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-ink">
        <p className="font-medium">Wrong network</p>
        <p className="mt-1 text-graphite">
          Hushh Protocol runs on {targetName}. Switch your wallet to that
          network to continue.
        </p>
      </div>
      <SwitchNetworkButton />
    </div>
  );
}
