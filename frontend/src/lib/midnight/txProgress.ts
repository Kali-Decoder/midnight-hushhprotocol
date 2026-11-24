// Live progress for Midnight transactions. The wallet session's providers are
// wrapped so every contract call reports its steps (prove -> wallet -> submit)
// without each caller having to. A sticky toast follows the steps; callers
// keep showing their own success / error message when the call returns.

import type {MidnightProviders} from "@midnightntwrk/midnight-js-types";
import {toast} from "@/lib/toast";

type Step = "proving" | "wallet" | "submitting";

const STEP_TEXT: Record<Step, string> = {
  proving: "Generating zero-knowledge proof",
  wallet: "Approve in your wallet",
  submitting: "Submitting to Midnight",
};
const STEP_INDEX: Record<Step, number> = {proving: 1, wallet: 2, submitting: 3};

let label: string | null = null;
let current: {id: string; label: string} | null = null;

/** Name the next transaction in the progress toast ("Sending 5 NIGHT to @maria"). */
export function labelNextTx(text: string) {
  label = text;
}

function step(s: Step) {
  if (!current) {
    current = {id: "", label: label ?? "Midnight transaction"};
    label = null;
    current.id = toast.loading(current.label, {sub: STEP_TEXT[s], step: STEP_INDEX[s], steps: 3});
    return;
  }
  toast.update(current.id, {sub: STEP_TEXT[s], step: STEP_INDEX[s], steps: 3});
}

/** Replace the step line while the current transaction waits (e.g. on 1AM's sponsor). */
export function noteTxWaiting(text: string) {
  if (current) toast.update(current.id, {sub: text});
}

function finish() {
  if (current) toast.dismiss(current.id);
  current = null;
}

async function track<T>(s: Step, fn: () => Promise<T>, last = false): Promise<T> {
  step(s);
  try {
    const r = await fn();
    if (last) finish();
    return r;
  } catch (e) {
    finish();
    throw e;
  }
}

function wrapMethod<O extends object>(obj: O, method: string, s: Step, last = false): O {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const v = Reflect.get(target, prop, receiver);
      if (prop === method && typeof v === "function") {
        return (...args: unknown[]) => track(s, () => v.apply(target, args), last);
      }
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

/** Wrap providers so prove / balance / submit report progress. */
export function withTxProgress(p: MidnightProviders): MidnightProviders {
  const any = p as any;
  return {
    ...any,
    proofProvider: wrapMethod(any.proofProvider, "proveTx", "proving"),
    walletProvider: wrapMethod(any.walletProvider, "balanceTx", "wallet"),
    midnightProvider: wrapMethod(any.midnightProvider, "submitTx", "submitting", true),
  } as MidnightProviders;
}
