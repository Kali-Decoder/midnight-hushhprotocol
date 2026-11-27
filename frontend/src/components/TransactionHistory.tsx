"use client";

import {useCallback, useEffect, useState} from "react";
import {motion} from "motion/react";
import {listNoteHistory} from "@/lib/api";
import {explorerTx} from "@/lib/config";
import {useSession} from "@/hooks/useSession";
import {formatError} from "@/lib/errors";
import type {NoteHistoryItem} from "@/shared";
import {ExternalLinkIcon, LoaderIcon} from "@/components/icons";
import {FieldLabel} from "@/components/ui";

const PAGE_SIZE = 5;

/** Rows ease in one after another when a page of history loads. */
const rowMotion = (i: number) => ({
  initial: {opacity: 0, y: 8},
  animate: {opacity: 1, y: 0},
  transition: {delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const},
});

type Direction = "sent" | "received";

function shortTx(hash: string): string {
  if (hash.length < 14) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function atName(name?: string): string {
  if (!name) return "—";
  return name.startsWith("@") ? name : `@${name}`;
}

export function TransactionHistory() {
  const {isSignedIn, user} = useSession();
  const [direction, setDirection] = useState<Direction>("sent");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NoteHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isSignedIn) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await listNoteHistory({
        direction,
        page,
        limit: PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(formatError(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [direction, page, isSignedIn]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [direction]);

  if (!isSignedIn) return null;

  const me = user?.username;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <FieldLabel>Transaction history</FieldLabel>
        <p className="pb-0.5 font-mono text-[11px] text-graphite">
          {total} total
        </p>
      </div>

      <div
        role="tablist"
        aria-label="History direction"
        className="flex rounded-[1.4rem] border border-fog bg-paper/70 p-1"
      >
        {(
          [
            {id: "sent" as const, label: "Sent"},
            {id: "received" as const, label: "Received"},
          ] as const
        ).map((tab) => {
          const on = direction === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setDirection(tab.id)}
              className={`relative flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                on
                  ? "text-paper"
                  : "text-graphite hover:bg-white/80 hover:text-ink"
              }`}
            >
              {on ? (
                <motion.span
                  layoutId="history-tab-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-xl bg-ink shadow-[0_1px_2px_rgba(10,10,10,0.18)]"
                  transition={{type: "spring", stiffness: 420, damping: 34}}
                />
              ) : null}
              <span className="relative">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto card">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoaderIcon className="h-5 w-5 animate-spin text-graphite" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-center text-sm text-graphite">{error}</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-graphite">
            {direction === "sent"
              ? "No sends yet. Pay someone from Send."
              : "No received notes yet."}
          </p>
        ) : (
          <>
          {/* Phones: stacked rows instead of a sideways-scrolling table. */}
          <ul className="divide-y divide-fog sm:hidden">
            {items.map((item, i) => {
              const from =
                item.fromUsername ||
                (item.direction === "sent" ? me : undefined);
              const to =
                item.toUsername ||
                (item.direction === "received" ? me : undefined);
              const tx =
                item.direction === "sent"
                  ? item.depositTxHash
                  : item.claimTxHash || item.depositTxHash;
              return (
                <motion.li key={item.id} {...rowMotion(i)} className="space-y-2 px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold tabular-nums text-ink">
                      {item.amount != null
                        ? `${item.amount} ${item.tokenSymbol ?? "NIGHT"}`
                        : "—"}
                    </span>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        item.claimed
                          ? "bg-signal/10 text-signal"
                          : "bg-amber/15 text-ink"
                      }`}
                    >
                      {item.claimed ? "Claimed" : "Open"}
                    </span>
                  </div>
                  <p className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-ink">
                    <span className="min-w-0 truncate">{atName(from)}</span>
                    <span className="shrink-0 text-graphite">→</span>
                    <span className="min-w-0 truncate">{atName(to)}</span>
                  </p>
                  {tx ? (
                    <a
                      href={explorerTx(tx)}
                      target="_blank"
                      rel="noreferrer"
                      title={tx}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-graphite underline-offset-2 hover:underline"
                    >
                      {shortTx(tx)}
                      <ExternalLinkIcon className="h-3 w-3 shrink-0" />
                    </a>
                  ) : null}
                </motion.li>
              );
            })}
          </ul>
          <table className="hidden w-full min-w-[36rem] border-collapse text-left text-sm sm:table">
            <thead>
              <tr className="border-b border-fog bg-paper/60 text-[10px] font-semibold uppercase tracking-[0.14em] text-graphite">
                <th className="px-4 py-3 font-semibold">From</th>
                <th className="px-4 py-3 font-semibold">To</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Tx hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fog">
              {items.map((item, i) => {
                const from =
                  item.fromUsername ||
                  (item.direction === "sent" ? me : undefined);
                const to =
                  item.toUsername ||
                  (item.direction === "received" ? me : undefined);
                const tx =
                  item.direction === "sent"
                    ? item.depositTxHash
                    : item.claimTxHash || item.depositTxHash;

                return (
                  <motion.tr key={item.id} {...rowMotion(i)} className="align-middle hover:bg-paper/40">
                    <td className="px-4 py-3.5 font-semibold tracking-tight text-ink">
                      {atName(from)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold tracking-tight text-ink">
                      {atName(to)}
                    </td>
                    <td className="px-4 py-3.5 font-bold tabular-nums text-ink">
                      {item.amount != null
                        ? `${item.amount} ${item.tokenSymbol ?? "NIGHT"}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          item.claimed
                            ? "bg-signal/10 text-signal"
                            : "bg-amber/15 text-ink"
                        }`}
                      >
                        {item.claimed ? "Claimed" : "Open"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {tx ? (
                        <a
                          href={explorerTx(tx)}
                          target="_blank"
                          rel="noreferrer"
                          title={tx}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-ink underline-offset-2 hover:underline"
                        >
                          {shortTx(tx)}
                          <ExternalLinkIcon className="h-3 w-3 shrink-0 text-graphite" />
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-graphite">—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          </>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-fog bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-graphite disabled:cursor-not-allowed disabled:opacity-35"
          >
            Previous
          </button>
          <p className="font-mono text-[11px] text-graphite">
            Page {page} / {totalPages}
          </p>
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border border-fog bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-graphite disabled:cursor-not-allowed disabled:opacity-35"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Use TransactionHistory */
export function SendHistory() {
  return <TransactionHistory />;
}
