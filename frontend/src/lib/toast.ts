import {formatError} from "@/lib/errors";

export type ToastKind = "success" | "error" | "info" | "loading";

export interface ToastPayload {
  id: string;
  kind: ToastKind;
  message: string;
  durationMs?: number;
  /** Optional explorer (or other) URL shown as an icon link. */
  href?: string;
  hrefLabel?: string;
  /** Secondary line (e.g. the current transaction step). */
  sub?: string;
  /** Step progress, shown as segments under a loading toast. */
  step?: number;
  steps?: number;
  /** When a loading toast started (drives its elapsed timer). */
  startedAt?: number;
}

export const TOAST_EVENT = "hush:toast";
export const TOAST_UPDATE_EVENT = "hush:toast:update";
export const TOAST_DISMISS_EVENT = "hush:toast:dismiss";

export type ToastPatch = Partial<Omit<ToastPayload, "id">> & {id: string};

export type ToastOptions = {
  durationMs?: number;
  href?: string;
  hrefLabel?: string;
};

function emit(
  kind: ToastKind,
  message: string,
  opts?: number | ToastOptions
) {
  if (typeof window === "undefined") return;
  const options = typeof opts === "number" ? {durationMs: opts} : opts ?? {};
  const payload: ToastPayload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    message,
    durationMs: options.durationMs,
    href: options.href,
    hrefLabel: options.hrefLabel,
  };
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, {detail: payload}));
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const toast = {
  /** Sticky toast with a spinner; returns its id for update() / dismiss(). */
  loading: (message: string, opts?: {sub?: string; step?: number; steps?: number}): string => {
    const id = newId();
    if (typeof window !== "undefined") {
      const payload: ToastPayload = {id, kind: "loading", message, startedAt: Date.now(), ...opts};
      window.dispatchEvent(new CustomEvent(TOAST_EVENT, {detail: payload}));
    }
    return id;
  },
  update: (id: string, patch: Omit<ToastPatch, "id">) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(TOAST_UPDATE_EVENT, {detail: {...patch, id}}));
  },
  dismiss: (id: string) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(TOAST_DISMISS_EVENT, {detail: id}));
  },
  success: (message: string, opts?: number | ToastOptions) =>
    emit("success", message, opts),
  error: (err: unknown, opts?: number | ToastOptions) =>
    emit(
      "error",
      formatError(err),
      typeof opts === "number" ? opts : {...opts, durationMs: opts?.durationMs ?? 5200}
    ),
  info: (message: string, opts?: number | ToastOptions) =>
    emit("info", message, opts),
};
