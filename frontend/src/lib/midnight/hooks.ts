"use client";

// React bindings for the Midnight store. useAccount / useConnect /
// useDisconnect keep the shapes the UI components already destructure.

import {useCallback, useEffect, useState, useSyncExternalStore} from "react";

import {NETWORK_ID, NETWORK_LABEL} from "./config";
import {
  boot,
  connect,
  disconnect,
  getServerState,
  getState,
  subscribe,
  type MidnightState,
} from "./store";
import {walletAvailable} from "./wallet";

export function useMidnight(): MidnightState {
  useEffect(() => boot(), []);
  return useSyncExternalStore(subscribe, getState, getServerState);
}

export function useAccount() {
  const s = useMidnight();
  return {
    address: s.wallet?.address,
    isConnected: s.walletStatus === "connected",
    status: s.walletStatus,
    wallet: s.wallet,
    networkId: s.wallet?.networkId,
  };
}

export function useConnect() {
  const s = useMidnight();
  const [error, setError] = useState<Error | null>(null);
  const connectAsync = useCallback(async () => {
    setError(null);
    try {
      return await connect();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    }
  }, []);
  return {
    connectAsync,
    isPending: s.walletStatus === "connecting",
    error: error ?? (s.walletError ? new Error(s.walletError) : null),
    reset: () => setError(null),
    available: typeof window !== "undefined" && walletAvailable(),
  };
}

export function useDisconnect() {
  const [isPending, setPending] = useState(false);
  const disconnectAsync = useCallback(async () => {
    setPending(true);
    try {
      await disconnect();
    } finally {
      setPending(false);
    }
  }, []);
  return {disconnectAsync, isPending};
}

/** Is the connected wallet on the network this build targets? */
export function useIsCorrectNetwork() {
  const {isConnected, networkId} = useAccount();
  return {
    isConnected,
    networkId,
    isCorrectChain: isConnected && networkId === NETWORK_ID,
    targetName: NETWORK_LABEL[NETWORK_ID],
    targetId: NETWORK_ID,
  };
}
