"use client";

import {useEffect, useState} from "react";
import {
  AlertCircleIcon,
  CheckIcon,
  ExternalLinkIcon,
  LoaderIcon,
} from "@/components/icons";
import {
  TOAST_DISMISS_EVENT,
  TOAST_EVENT,
  TOAST_UPDATE_EVENT,
  type ToastPatch,
  type ToastPayload,
} from "@/lib/toast";

/** Seconds since `since`, ticking once a second. */
function Elapsed({since}: {since: number}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((now - since) / 1000));
  return <>{s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`}</>;
}

function ToastIcon({kind}: {kind: ToastPayload["kind"]}) {
  if (kind === "loading") {
    return (
      <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-signal/25" aria-hidden />
        <LoaderIcon className="relative h-4 w-4 animate-spin text-ink" />
      </span>
    );
  }
  if (kind === "success") {
    return <CheckIcon className="h-4 w-4 shrink-0 text-signal" />;
  }
  if (kind === "error") {
    return <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />;
  }
  return (
    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden />
  );
}

export function ToastHost() {
  const [items, setItems] = useState<ToastPayload[]>([]);

  useEffect(() => {
    const schedule = (id: string, ms: number) =>
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, ms);
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;
      setItems((prev) => [...prev.slice(-4), detail]);
      // Loading toasts stay until dismissed or turned into a result.
      if (detail.kind !== "loading") {
        schedule(detail.id, detail.durationMs ?? (detail.href ? 6500 : 3800));
      }
    };
    const onUpdate = (e: Event) => {
      const patch = (e as CustomEvent<ToastPatch>).detail;
      setItems((prev) => prev.map((t) => (t.id === patch.id ? {...t, ...patch} : t)));
      if (patch.kind && patch.kind !== "loading") {
        schedule(patch.id, patch.durationMs ?? 3800);
      }
    };
    const onDismiss = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setItems((prev) => prev.filter((t) => t.id !== id));
    };
    window.addEventListener(TOAST_EVENT, onToast);
    window.addEventListener(TOAST_UPDATE_EVENT, onUpdate);
    window.addEventListener(TOAST_DISMISS_EVENT, onDismiss);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      window.removeEventListener(TOAST_UPDATE_EVENT, onUpdate);
      window.removeEventListener(TOAST_DISMISS_EVENT, onDismiss);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {items.map((t) => (
        <div
          key={t.id}
          className={`toast-enter pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-2xl border bg-white/95 px-4 py-3 text-sm shadow-lg shadow-ink/10 backdrop-blur-md ${
            t.kind === "error" ? "border-red-200" : "border-fog"
          }`}
        >
          <ToastIcon kind={t.kind} />
          <div className="min-w-0 flex-1">
            <p className="leading-snug text-ink">
              {t.message}
              {t.kind === "loading" && t.startedAt ? (
                <span className="ml-2 font-mono text-xs text-graphite">
                  <Elapsed since={t.startedAt} />
                </span>
              ) : null}
            </p>
            {t.sub ? (
              <p key={t.sub} className="toast-sub mt-0.5 text-xs text-graphite">
                {t.sub}
                {t.kind === "loading" ? <span className="toast-dots" aria-hidden /> : null}
              </p>
            ) : null}
            {t.kind === "loading" && t.steps ? (
              <div className="mt-2 flex gap-1" aria-hidden>
                {Array.from({length: t.steps}, (_, i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                      i + 1 < (t.step ?? 0)
                        ? "bg-ink"
                        : i + 1 === t.step
                          ? "toast-step-active bg-signal"
                          : "bg-fog"
                    }`}
                  />
                ))}
              </div>
            ) : null}
            {t.href ? (
              <a
                href={t.href}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-ink underline-offset-2 hover:underline"
              >
                {t.hrefLabel ?? "View on explorer"}
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          <button
            type="button"
            className={`shrink-0 text-xs text-graphite hover:text-ink ${t.kind === "loading" ? "hidden" : ""}`}
            onClick={() =>
              setItems((prev) => prev.filter((x) => x.id !== t.id))
            }
          >
            Close
          </button>
        </div>
      ))}
    </div>
  );
}
