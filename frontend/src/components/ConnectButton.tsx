"use client";

import {useState} from "react";
import {useAccount, useConnect, useDisconnect} from "@/lib/midnight/hooks";
import {toast} from "@/lib/toast";
import {useSignOut} from "@/hooks/useSignOut";
import {LoaderIcon, WalletIcon} from "@/components/icons";
import {
  SwitchNetworkButton,
  useIsCorrectChain,
} from "@/components/NetworkGate";

export function ConnectButton({
  label = "Connect wallet",
  className = "btn-primary",
  compact = false,
}: {
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const {address, isConnected, status} = useAccount();
  const {connectAsync, available, isPending, error, reset} = useConnect();
  const {disconnectAsync, isPending: isDisconnecting} = useDisconnect();
  const {isCorrectChain} = useIsCorrectChain();
  const signOut = useSignOut();
  const [busyLocal, setBusyLocal] = useState(false);

  const busy =
    busyLocal ||
    isPending ||
    isDisconnecting ||
    status === "connecting";

  async function handleSignOut() {
    setBusyLocal(true);
    try {
      await signOut({silent: compact, redirect: "/"});
    } catch (err) {
      if (!compact) toast.error(err);
    } finally {
      setBusyLocal(false);
    }
  }

  async function connectWallet() {
    if (!available) {
      if (!compact) toast.error("No Midnight wallet found. Install 1AM or Lace and reload.");
      return;
    }
    setBusyLocal(true);
    reset();
    try {
      await connectAsync();
      if (!compact) toast.success("Wallet connected.");
    } catch (err) {
      if (!compact) toast.error(err);
    } finally {
      setBusyLocal(false);
    }
  }

  if (isConnected && address && !isCorrectChain) {
    return (
      <SwitchNetworkButton
        compact={compact}
        className={compact ? className : "btn-primary"}
      />
    );
  }

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={busy}
        className={className}
        title="Sign out and disconnect wallet"
      >
        {busy ? <LoaderIcon className="h-4 w-4 animate-spin" /> : null}
        {compact ? "Sign out" : "Disconnect wallet"}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => void connectWallet()}
        className={className}
      >
        {busy ? (
          <LoaderIcon className="h-5 w-5 animate-spin" />
        ) : (
          !compact && <WalletIcon className="h-5 w-5" />
        )}
        {busy ? "Connecting…" : label}
      </button>
      {error && !compact ? (
        <p className="mt-2 text-center text-xs text-amber">{error.message}</p>
      ) : null}
    </>
  );
}
