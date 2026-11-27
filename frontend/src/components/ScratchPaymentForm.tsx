"use client";

import {useMemo, useState, type ReactNode} from "react";
import {useAccount} from "@/lib/midnight/hooks";
import {resolveUser, sendLinkTip, sendTip} from "@/lib/api";
import {
  AMOUNT_PRESETS,
  DEFAULT_POOL_TOKEN,
  NETWORK_NAME,
  toTokenUnits,
  type PoolToken,
} from "@/lib/config";
import {formatError} from "@/lib/errors";
import {
  createScratchClaimPayload,
  encodeScratchClaimPayload,
  scratchClaimPath,
  type ScratchTheme,
} from "@/lib/scratchGift";
import {toast} from "@/lib/toast";
import {
  filterRecentRecipients,
  rememberRecentRecipient,
} from "@/lib/recentRecipients";
import {useSession} from "@/hooks/useSession";
import {useTokenBalance} from "@/hooks/useNightBalance";
import {ConnectButton} from "@/components/ConnectButton";
import {NetworkGate} from "@/components/NetworkGate";
import {ScratchRevealCard} from "@/components/ScratchRevealCard";
import {ScratchSendProgressModal} from "@/components/ScratchSendProgressModal";
import {ScratchSendSuccessModal} from "@/components/ScratchSendSuccessModal";
import {TokenBalanceSelect} from "@/components/TokenSelect";
import {CheckIcon, CopyIcon, LoaderIcon} from "@/components/icons";
import {AmountPills, ErrorBanner, FieldLabel} from "@/components/ui";

const TITLE_MAX = 32;
const MESSAGE_MAX = 80;

const THEMES: Array<{
  id: ScratchTheme;
  label: string;
  swatch: string;
  ring: string;
  stage: string;
  glow: string;
}> = [
  {
    id: "crimson",
    label: "Orange",
    swatch: "bg-[#f07a1a]",
    ring: "ring-[#f07a1a]/40",
    stage: "bg-[#0a0a0a]",
    glow: "rgba(240,122,26,0.18)",
  },
  {
    id: "azure",
    label: "Azure",
    swatch: "bg-[#2f6fed]",
    ring: "ring-[#2f6fed]/40",
    stage: "bg-[#061018]",
    glow: "rgba(47,111,237,0.2)",
  },
  {
    id: "emerald",
    label: "Emerald",
    swatch: "bg-[#0f9f6e]",
    ring: "ring-[#0f9f6e]/40",
    stage: "bg-[#04140f]",
    glow: "rgba(15,159,110,0.2)",
  },
];

type Step =
  | "idle"
  | "resolving"
  | "creating"
  | "approving"
  | "depositing"
  | "posting";

type ProgressStep = Exclude<Step, "idle">;

function FormSection({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-fog/80 pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-paper">
          {step}
        </span>
        <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function ScratchPaymentForm() {
  const {address, isConnected} = useAccount();
  const {isSignedIn, user: me} = useSession();
  const [selectedToken, setSelectedToken] =
    useState<PoolToken>(DEFAULT_POOL_TOKEN);
  const {hasEnough, formatted: tokenBalance} = useTokenBalance(selectedToken);
  const [recipient, setRecipient] = useState("");
  const [cardName, setCardName] = useState("Scratch & Win");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState<ScratchTheme>("crimson");
  const [amount, setAmount] = useState<number | null>(AMOUNT_PRESETS[1] ?? 10);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [statusHint, setStatusHint] = useState("");
  const [includeApprove, setIncludeApprove] = useState(true);
  const [claimUrl, setClaimUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [recipientFocused, setRecipientFocused] = useState(false);
  const [recentTick, setRecentTick] = useState(0);
  const [previewRevealed, setPreviewRevealed] = useState(false);
  const [success, setSuccess] = useState<{
    title: string;
    theme: ScratchTheme;
    amountLabel: string;
    tokenSymbol: string;
    recipientUsername: string;
    claimUrl: string;
    depositHash: string;
  } | null>(null);

  const busy = step !== "idle";
  const previewTitle = cardName.trim() || "Scratch & Win";
  const previewMessage = message.trim();
  const previewAmount = String(amount ?? AMOUNT_PRESETS[1] ?? 10);
  const previewRecipient = recipient.trim().replace(/^@/, "");
  const themeMeta = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const recentRecipients = useMemo(
    () =>
      filterRecentRecipients("twitter", recipient, {
        exclude: me?.username,
        limit: 5,
      }),
    [recipient, me?.username, recentTick]
  );

  const canSend =
    Boolean(recipient.trim()) &&
    Boolean(amount) &&
    isSignedIn &&
    !busy &&
    (amount ? hasEnough(amount) : false);

  const sendBlockReason = !isSignedIn
    ? "Unlock your passport to send"
    : !recipient.trim()
      ? "Add a recipient username"
      : !amount
        ? "Pick an amount"
        : amount && !hasEnough(amount)
          ? `Need more ${selectedToken.symbol}`
          : null;

  function rememberRecipient(username: string) {
    rememberRecentRecipient("twitter", username);
    setRecentTick((n) => n + 1);
  }

  async function copyClaimLink() {
    if (!claimUrl) return;
    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1600);
    } catch {
      toast.error("Couldn’t copy link");
    }
  }

  async function handleSend() {
    if (!address || !amount) return;
    if (!isSignedIn) {
      setError("Unlock your passport at /register first.");
      return;
    }
    if (!recipient.trim()) {
      setError("Recipient username is required.");
      return;
    }
    if (!hasEnough(amount)) {
      setError(
        `Insufficient ${selectedToken.symbol}. Balance is ${tokenBalance} ${selectedToken.symbol}.`
      );
      return;
    }

    setError("");
    setClaimUrl("");
    setStatusHint("Looking up recipient…");
    setIncludeApprove(false);

    try {
      setStep("resolving");
      const handle = recipient.trim().replace(/^@/, "").toLowerCase();
      const resolved = await resolveUser(handle);
      const recipientUsername = resolved?.username ?? handle;
      const units = toTokenUnits(amount, selectedToken.decimals);
      const amountLabel = String(amount);
      const title = cardName.trim() || "Scratch & Win";
      const noteMessage = message.trim() || undefined;
      const giftMeta = {
        title,
        theme,
        ...(noteMessage ? {message: noteMessage} : {}),
      };
      const urlFor = (p: ReturnType<typeof createScratchClaimPayload>) =>
        `${window.location.origin}${scratchClaimPath(encodeScratchClaimPayload(p))}`;

      setStatusHint(
        resolved
          ? `Sealing the gift to ${resolved.username}.night…`
          : `@${handle} has no passport yet: sealing an open gift link…`
      );
      setStep("creating");
      await new Promise((r) => setTimeout(r, 50));

      setStatusHint(`Proving and submitting on ${NETWORK_NAME}… keep this tab open.`);
      setStep("depositing");
      let finalClaimUrl: string;
      let hash: string;
      if (resolved) {
        // Bound to their passport: the link carries no secret.
        const sent = await sendTip(resolved, units);
        hash = sent.txId;
        finalClaimUrl = urlFor(
          createScratchClaimPayload({
            amountLabel,
            tokenSymbol: selectedToken.symbol,
            recipientUsername,
            meta: giftMeta,
            commitment: sent.commitment,
          })
        );
      } else {
        const sent = await sendLinkTip(units, `@${handle}`, (link) =>
          urlFor(
            createScratchClaimPayload({
              amountLabel,
              tokenSymbol: selectedToken.symbol,
              recipientUsername,
              meta: giftMeta,
              link,
            })
          )
        );
        hash = sent.txId;
        finalClaimUrl = sent.claimUrl;
      }

      setClaimUrl(finalClaimUrl);
      rememberRecipient(recipientUsername);
      setStatusHint("");
      setSuccess({
        title,
        theme,
        amountLabel,
        tokenSymbol: selectedToken.symbol,
        recipientUsername,
        claimUrl: finalClaimUrl,
        depositHash: hash,
      });
      setStep("idle");
      toast.success("Gift card sent.");
    } catch (e) {
      const msg = formatError(e);
      setError(msg);
      toast.error(msg);
      setStatusHint("");
      setStep("idle");
    }
  }

  const previewCard = (
    <ScratchRevealCard
      key={`${theme}-${previewAmount}-${previewTitle}-${previewRevealed}`}
      meta={{
        title: previewTitle,
        theme,
        ...(previewMessage ? {message: previewMessage} : {}),
      }}
      amountLabel={previewAmount}
      tokenSymbol={selectedToken.symbol}
      recipientLabel={
        previewRecipient ? `@${previewRecipient}` : undefined
      }
      disabled={!previewRevealed}
      revealed={previewRevealed}
      tilt
    />
  );

  // Visitors see the live preview; the form asks for a wallet / passport
  // only when they're ready to design and fund a card.
  const formFields = !isConnected ? (
    <div className="card-dashed space-y-4 px-4 py-6 text-center">
      <p className="text-sm leading-relaxed text-graphite">
        Try the preview on the right. Connect a Midnight wallet when you&apos;re
        ready to design, fund and send a card.
      </p>
      <ConnectButton label="Connect wallet" />
    </div>
  ) : !isSignedIn ? (
    <div className="card-dashed space-y-4 px-4 py-6 text-center">
      <p className="text-sm leading-relaxed text-graphite">
        Sign in so the encrypted gift card can land in their inbox.
      </p>
      <a href="/register" className="btn-primary">
        Sign in
      </a>
    </div>
  ) : (
    <>
      {error ? <ErrorBanner message={error} /> : null}

      <FormSection step="1" title="Who gets it">
        <div className="space-y-2">
          <FieldLabel>Send to username</FieldLabel>
          <div className={`field !py-0 ${busy ? "opacity-60" : ""}`}>
            <div className="flex items-center gap-2">
              <span className="pl-1 text-lg font-semibold text-graphite">@</span>
              <input
                value={recipient.replace(/^@/, "")}
                onChange={(e) =>
                  setRecipient(e.target.value.replace(/^@+/, ""))
                }
                onFocus={() => setRecipientFocused(true)}
                onBlur={() =>
                  window.setTimeout(() => setRecipientFocused(false), 120)
                }
                placeholder="username"
                disabled={busy}
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 bg-transparent py-3.5 text-lg text-ink outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>
          {recipientFocused && recentRecipients.length > 0 ? (
            <div className="overflow-hidden card shadow-[0_12px_28px_-20px_rgba(10,10,10,0.35)]">
              <p className="border-b border-fog/80 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
                Recent
              </p>
              {recentRecipients.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setRecipient(r.value);
                    setRecipientFocused(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-ink transition-colors hover:bg-paper"
                >
                  @{r.value}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-graphite">
              They must already be registered on Hushh.
            </p>
          )}
        </div>
      </FormSection>

      <FormSection step="2" title="Look & feel">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <FieldLabel>Gift card name</FieldLabel>
            <span className="text-[10px] tabular-nums text-graphite">
              {cardName.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            value={cardName}
            onChange={(e) => setCardName(e.target.value.slice(0, TITLE_MAX))}
            placeholder="Scratch & Win"
            maxLength={TITLE_MAX}
            disabled={busy}
            className="field disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <FieldLabel>Personal note</FieldLabel>
            <span className="text-[10px] tabular-nums text-graphite">
              {message.length}/{MESSAGE_MAX}
            </span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
            placeholder="Happy birthday — scratch to open"
            maxLength={MESSAGE_MAX}
            rows={2}
            disabled={busy}
            className="field min-h-[4.5rem] resize-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="text-[11px] text-graphite">
            Shows under the prize after they scratch. Optional.
          </p>
        </div>

        <div className="space-y-2">
          <FieldLabel>Card color</FieldLabel>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Card color">
            {THEMES.map((opt) => {
              const on = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={busy}
                  onClick={() => {
                    setTheme(opt.id);
                    setPreviewRevealed(false);
                  }}
                  className={`flex min-w-0 flex-col items-center gap-2 rounded-[1.4rem] border px-2 py-3 transition-all disabled:opacity-50 ${
                    on
                      ? `border-ink bg-white shadow-[0_8px_20px_-14px_rgba(10,10,10,0.45)] ring-2 ${opt.ring}`
                      : "border-fog bg-white text-graphite hover:border-graphite"
                  }`}
                >
                  <span
                    className={`h-8 w-8 rounded-full shadow-inner ring-2 ring-white/80 ${opt.swatch}`}
                    aria-hidden
                  />
                  <span
                    className={`truncate text-xs font-semibold sm:text-sm ${
                      on ? "text-ink" : "text-graphite"
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </FormSection>

      <FormSection step="3" title="Value">
        <div className="space-y-2">
          <FieldLabel>Token</FieldLabel>
          <TokenBalanceSelect
            value={selectedToken}
            onChange={setSelectedToken}
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Amount</FieldLabel>
          <AmountPills
            amounts={AMOUNT_PRESETS}
            value={amount}
            onChange={(n) => {
              setAmount(n);
              setPreviewRevealed(false);
            }}
            disabled={busy}
            canAfford={hasEnough}
            symbol={selectedToken.symbol}
          />
          <p className="text-[11px] text-graphite">
            Balance {tokenBalance} {selectedToken.symbol} · on Midnight
            keep the pool private.
          </p>
        </div>
      </FormSection>

      <div className="rounded-[1.4rem] border border-fog bg-paper/70 px-3.5 py-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
          Ready to send
        </p>
        <p className="mt-1.5 text-sm font-semibold tracking-tight text-ink">
          <span className="animate-amount-pop inline-block tabular-nums motion-reduce:animate-none">
            {previewAmount} {selectedToken.symbol}
          </span>
          {previewRecipient ? (
            <span className="font-medium text-graphite">
              {" "}
              → @{previewRecipient}
            </span>
          ) : (
            <span className="font-medium text-graphite"> · no recipient</span>
          )}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-graphite">
          “{previewTitle}”
          {previewMessage ? ` · ${previewMessage}` : ""}
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleSend()}
        disabled={!canSend}
        className="btn-primary"
        title={sendBlockReason ?? undefined}
      >
        {busy ? <LoaderIcon className="h-5 w-5 animate-spin" /> : null}
        {busy
          ? "Creating gift card…"
          : sendBlockReason && !busy
            ? sendBlockReason
            : "Create gift card"}
      </button>

      {claimUrl && !busy ? (
        <div className="rounded-[1.4rem] border border-fog bg-paper/80 px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-graphite">
              Claim link
            </p>
            <button
              type="button"
              onClick={() => void copyClaimLink()}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink hover:opacity-70"
            >
              {copiedLink ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
              {copiedLink ? "Copied" : "Copy"}
            </button>
          </div>
          <p
            className="mt-1.5 truncate font-mono text-[11px] text-ink"
            title={claimUrl}
          >
            {claimUrl}
          </p>
        </div>
      ) : null}
    </>
  );

  return (
    <NetworkGate>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-7 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <aside className="order-2 lg:order-1 lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-[1.75rem] border border-fog bg-white/95 p-5 shadow-[0_18px_40px_-28px_rgba(10,10,10,0.35)] backdrop-blur-sm sm:p-6">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-graphite">
                Customize
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-ink">
                Build your gift card
              </h2>
            </div>
            <div className="space-y-5">{formFields}</div>
          </div>
        </aside>

        <section className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <div
            className={`relative overflow-hidden rounded-[1.75rem] transition-[background-color] duration-500 ${themeMeta.stage} px-5 py-8 sm:px-8 sm:py-10 lg:min-h-[30rem] lg:px-10 lg:py-12`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 top-8 h-48 w-48 rounded-full blur-3xl transition-opacity duration-500"
              style={{background: themeMeta.glow}}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[46%] opacity-[0.22] contrast-125 grayscale"
              style={{
                backgroundImage: `
                  radial-gradient(circle at 18% 36%, rgba(255,255,255,0.22) 0 1px, transparent 1.5px),
                  radial-gradient(circle at 62% 28%, rgba(255,255,255,0.16) 0 1px, transparent 1.5px),
                  radial-gradient(circle at 84% 52%, rgba(255,255,255,0.14) 0 1px, transparent 1.5px),
                  repeating-linear-gradient(90deg, transparent 0 6px, rgba(255,255,255,0.04) 6px 7px),
                  repeating-linear-gradient(0deg, transparent 0 5px, rgba(255,255,255,0.035) 5px 6px)
                `,
                backgroundSize: "18px 18px, 22px 22px, 16px 16px, auto, auto",
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black to-transparent" />

            <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
                  Live preview
                </p>
                <p className="mt-1 text-sm font-semibold text-white/90">
                  <span
                    key={previewAmount + selectedToken.symbol}
                    className="animate-amount-pop inline-block tabular-nums motion-reduce:animate-none"
                  >
                    {previewAmount} {selectedToken.symbol}
                  </span>
                  {previewRecipient ? (
                    <span className="text-white/50">
                      {" "}
                      → @{previewRecipient}
                    </span>
                  ) : (
                    <span className="text-white/40"> · pick a recipient</span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewRevealed((v) => !v)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {previewRevealed ? "Show foil" : "Preview reveal"}
                </button>
                <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
                  Lottery ticket
                </p>
              </div>
            </div>

            <div className="relative mx-auto max-w-lg px-2 sm:px-4">
              {previewCard}
            </div>

            <p className="relative mx-auto mt-7 max-w-sm text-center text-[12px] leading-relaxed text-white/45">
              They scratch the silver panel, then claim privately from Inbox →
              Gift cards.
            </p>
          </div>
        </section>
      </div>

      {busy ? (
        <ScratchSendProgressModal
          step={step as ProgressStep}
          includeApprove={includeApprove}
          statusHint={statusHint}
          title={previewTitle}
          theme={theme}
          amountLabel={previewAmount}
          tokenSymbol={selectedToken.symbol}
          recipientUsername={previewRecipient}
        />
      ) : null}

      {success ? (
        <ScratchSendSuccessModal
          title={success.title}
          theme={success.theme}
          amountLabel={success.amountLabel}
          tokenSymbol={success.tokenSymbol}
          recipientUsername={success.recipientUsername}
          claimUrl={success.claimUrl}
          depositHash={success.depositHash}
          onClose={() => setSuccess(null)}
        />
      ) : null}
    </NetworkGate>
  );
}
