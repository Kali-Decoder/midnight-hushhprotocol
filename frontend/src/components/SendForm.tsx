"use client";

import {useEffect, useMemo, useState} from "react";
import {useAccount} from "@/lib/midnight/hooks";
import {resolveUser, sendLinkTip, sendTip} from "@/lib/api";
import {
  AMOUNT_PRESETS,
  DEFAULT_POOL_TOKEN,
  explorerTx,
  getPoolToken,
  NETWORK_NAME,
  toTokenUnits,
  type PoolToken,
} from "@/lib/config";
import {
  createScratchClaimPayload,
  encodeScratchClaimPayload,
  scratchClaimPath,
} from "@/lib/scratchGift";
import {
  filterRecentRecipients,
  rememberRecentRecipient,
} from "@/lib/recentRecipients";
import {
  copyPaymentShareImage,
  sharePaymentOnTwitter,
  type PaymentShareDetails,
} from "@/lib/sharePayment";
import {PaymentSharePreview} from "@/components/PaymentSharePreview";
import {toast} from "@/lib/toast";
import {formatError, formatErrorTitle} from "@/lib/errors";
import type {PublicUser} from "@/shared";
import {ConnectButton} from "@/components/ConnectButton";
import {NetworkGate} from "@/components/NetworkGate";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  LoaderIcon,
  MinusIcon,
  PlusIcon,
  XBrandIcon,
} from "@/components/icons";
import {
  formatRecipientLabel,
  normalizeRecipient,
  RecipientKindIcon,
  type RecipientKind,
} from "@/components/RecipientKind";
import {useSession} from "@/hooks/useSession";
import {useTokenBalance} from "@/hooks/useNightBalance";
import {shortAddr} from "@/lib/address";
import {TokenBalanceSelect} from "@/components/TokenSelect";
import {UserAvatar} from "@/components/UserAvatar";
import {
  AmountPills,
  ErrorBanner,
  FieldLabel,
  Panel,
} from "@/components/ui";

type Step =
  | "idle"
  | "resolving"
  | "creating"
  | "approving"
  | "depositing"
  | "posting"
  | "done"
  | "undelivered"
  | "error";

const AMOUNT_STEP = 1;

type FlowStepId = "note" | "approve" | "deposit" | "deliver";

function flowSteps(includeApprove: boolean): {id: FlowStepId; label: string}[] {
  if (includeApprove) {
    return [
      {id: "note", label: "Note"},
      {id: "approve", label: "Approve"},
      {id: "deposit", label: "Deposit"},
      {id: "deliver", label: "Deliver"},
    ];
  }
  return [
    {id: "note", label: "Note"},
    {id: "deposit", label: "Deposit"},
    {id: "deliver", label: "Deliver"},
  ];
}

function activeFlowId(step: Step): FlowStepId | "done" | null {
  switch (step) {
    case "creating":
      return "note";
    case "approving":
      return "approve";
    case "depositing":
      return "deposit";
    case "posting":
    case "undelivered":
      return "deliver";
    case "done":
      return "done";
    default:
      return null;
  }
}

function isValidAmountInput(raw: string, maxDecimals: number): boolean {
  if (raw === "") return true;
  const re = new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`);
  return re.test(raw);
}

function parseAmountInput(raw: string): number | null {
  if (!raw || raw === ".") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function formatAmountDisplay(n: number, decimals: number): string {
  return n
    .toFixed(decimals)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
}

function roundAmount(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function SendForm({initialRecipient}: {initialRecipient?: string}) {
  const {address, isConnected} = useAccount();
  const {isSignedIn, user: me} = useSession();
  const [selectedToken, setSelectedToken] =
    useState<PoolToken>(DEFAULT_POOL_TOKEN);
  const {
    hasEnough,
    formatted: tokenBalance,
    refetch: refetchBalance,
  } = useTokenBalance(selectedToken);

  const [recipient, setRecipient] = useState(initialRecipient ?? "");
  const [recipientKind, setRecipientKind] = useState<
    Exclude<RecipientKind, "unknown">
  >("twitter");
  const [resolved, setResolved] = useState<PublicUser | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [amountText, setAmountText] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [commitment, setCommitment] = useState("");
  const [sentTokenSymbol, setSentTokenSymbol] = useState(
    DEFAULT_POOL_TOKEN.symbol
  );
  const [sentUsername, setSentUsername] = useState("");
  const [sentAmount, setSentAmount] = useState<number | null>(null);
  /** False once we know allowance already covers this send (skip approve tx). */
  const [includeApprove, setIncludeApprove] = useState(true);
  const [approveHash, setApproveHash] = useState("");
  const [statusHint, setStatusHint] = useState("");

  const sendInFlight =
    step === "creating" ||
    step === "approving" ||
    step === "depositing" ||
    step === "posting";

  const busy =
    step === "resolving" ||
    sendInFlight;

  const [claimUrl, setClaimUrl] = useState("");
  const [recipientFocused, setRecipientFocused] = useState(false);
  const [recentTick, setRecentTick] = useState(0);

  const amountDecimals = selectedToken.decimals;

  const recentSuggestions = useMemo(() => {
    void recentTick;
    return filterRecentRecipients(recipientKind, recipient, {
      exclude: me?.username,
      limit: 6,
    });
  }, [recipientKind, recipient, me?.username, recentTick]);

  function refreshRecent() {
    setRecentTick((n) => n + 1);
  }

  function rememberRecipient(
    kind: Exclude<RecipientKind, "unknown">,
    value: string
  ) {
    rememberRecentRecipient(kind, value);
    refreshRecent();
  }

  function applyAmount(n: number | null) {
    if (n == null || !Number.isFinite(n) || n <= 0) {
      setAmount(null);
      setAmountText("");
      return;
    }
    const rounded = roundAmount(n, amountDecimals);
    setAmount(rounded);
    setAmountText(formatAmountDisplay(rounded, amountDecimals));
  }

  function onAmountTextChange(raw: string) {
    if (!isValidAmountInput(raw, amountDecimals)) return;
    setAmountText(raw);
    const parsed = parseAmountInput(raw);
    setAmount(
      parsed != null && parsed > 0
        ? roundAmount(parsed, amountDecimals)
        : null
    );
  }

  function bumpAmount(delta: number) {
    const next = roundAmount((amount ?? 0) + delta, amountDecimals);
    if (next <= 0) {
      applyAmount(null);
      return;
    }
    applyAmount(next);
  }

  function onTokenChange(token: PoolToken) {
    setSelectedToken(token);
    if (amount != null) {
      const rounded = roundAmount(amount, token.decimals);
      setAmount(rounded);
      setAmountText(formatAmountDisplay(rounded, token.decimals));
    }
  }

  function resetAfterSuccess() {
    setStep("idle");
    setResolved(null);
    setAmount(null);
    setAmountText("");
    setRecipient("");
    setTxHash("");
    setCommitment("");
    setError("");
    setSentUsername("");
    setSentAmount(null);
    setIncludeApprove(true);
    setApproveHash("");
    setStatusHint("");
    setClaimUrl("");
  }

  async function handleResolve() {
    setError("");
    setResolved(null);
    setStep("resolving");
    try {
      const target = normalizeRecipient(recipient, recipientKind);
      // Emails resolve through their on-chain hash; unlinked ones get a claim link.
      const found = await resolveUser(target);
      const user: PublicUser = found ?? {
        id: target,
        wallet: target,
        username: recipientKind === "email" ? target : target.replace(/^@/, ""),
        bulletPublicKey: "",
        twitterUsername: null,
      };
      if (found && recipientKind === "email") {
        toast.success(`${target} is linked to ${found.username}.night. The tip goes to their passport.`);
      }
      if (!found) {
        toast.info(
          recipientKind === "email"
            ? "This email is not linked to a .night passport. They will get a claim link."
            : `@${user.username} has no .night passport yet. They will get a claim link.`
        );
      }
      setResolved(user);
      setStep("idle");
      rememberRecipient(
        recipientKind,
        recipientKind === "email" ? recipient : user.username
      );
    } catch (e) {
      setError(formatError(e));
    }
  }

  async function handleSend() {
    setError("");
    if (!address || !resolved || amount == null) return;
    if (!isSignedIn) {
      setError("Unlock your passport at /register first.");
      setStep("error");
      return;
    }
    if (!hasEnough(amount)) {
      setError(
        `Insufficient ${selectedToken.symbol}. Balance is ${tokenBalance} ${selectedToken.symbol}.`
      );
      setStep("error");
      toast.error(
        `Insufficient ${selectedToken.symbol}. Balance is ${tokenBalance} ${selectedToken.symbol}.`
      );
      return;
    }

    const units = toTokenUnits(amount, selectedToken.decimals);
    const viaLink = !resolved.tipPk;
    const label = formatRecipientLabel(
      recipientKind === "email" ? recipient : resolved.username,
      recipientKind
    );

    try {
      setIncludeApprove(false);
      setApproveHash("");
      setStatusHint(
        viaLink
          ? "Sealing a claim link tip…"
          : `Sealing a tip to ${resolved.username}.night…`
      );
      setStep("creating");
      await new Promise((r) => setTimeout(r, 50));

      setStatusHint(`Proving and submitting on ${NETWORK_NAME}… keep this tab open.`);
      setStep("depositing");
      let res: {txId: string; commitment: string};
      if (viaLink) {
        const sent = await sendLinkTip(units, label, (link) => {
          const payload = createScratchClaimPayload({
            amountLabel: String(amount),
            tokenSymbol: selectedToken.symbol,
            recipientUsername: recipientKind === "email" ? undefined : resolved.username,
            meta: {title: "Hushh tip", theme: "crimson", message: `From @${me?.username ?? "a friend"}`},
            link,
          });
          return `${window.location.origin}${scratchClaimPath(encodeScratchClaimPayload(payload))}`;
        });
        setClaimUrl(sent.claimUrl);
        await navigator.clipboard?.writeText(sent.claimUrl).catch(() => undefined);
        toast.success(`Claim link copied. Send it to ${label}.`);
        res = sent;
      } else {
        res = await sendTip(resolved, units);
      }
      setTxHash(res.txId);
      setCommitment(res.commitment);

      setSentTokenSymbol(selectedToken.symbol);
      setSentUsername(resolved.username);
      setSentAmount(amount);
      setStatusHint("Payment complete.");
      setStep("done");
      rememberRecipient(
        recipientKind,
        recipientKind === "email" ? recipient : resolved.username
      );
      void refetchBalance();
    } catch (e) {
      const msg = formatError(e);
      setError(msg);
      toast.error(msg);
      setStep("error");
      setStatusHint("");
    }
  }

  const showRecipientLookup = !resolved || step === "done";

  const showStatusModal =
    sendInFlight || step === "done" || step === "undelivered";


  return (
    <>
      <div
        className={
          showStatusModal
            ? "pointer-events-none select-none opacity-40 transition-opacity duration-300"
            : undefined
        }
        aria-hidden={showStatusModal || undefined}
      >

      <Panel className="space-y-6 text-left">
        {!isConnected ? (
          <div className="space-y-4 py-2 text-center">
            <p className="text-sm text-graphite">
              Pay anyone by their .night name, X handle or email. Connect a
              Midnight wallet when you&apos;re ready to send.
            </p>
            <ConnectButton label="Connect wallet" />
            <p className="text-xs text-graphite">
              Just looking?{" "}
              <a href="/lookout" className="font-semibold text-ink underline-offset-2 hover:underline">
                Check if someone has a passport
              </a>
            </p>
          </div>
        ) : (
          <NetworkGate>
            {!isSignedIn ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-graphite">
                  {me
                    ? `Passport ${me.username}.night found. Unlock it with your passkey to send.`
                    : "Claim your .night passport to send."}
                </p>
                <a href="/register" className="btn-primary">
                  {me ? "Sign in" : "Sign in or register"}
                </a>
              </div>
            ) : showRecipientLookup ? (
              <>
                <TokenBalanceSelect
                  value={selectedToken}
                  onChange={onTokenChange}
                  disabled={busy}
                />
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-3">
                    <FieldLabel>To</FieldLabel>
                    <p className="pb-0.5 font-mono text-[11px] text-graphite">
                      {recipientKind === "email" ? "Email" : "Username"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-fog bg-white px-5 py-5">
                    <p className="flex min-w-0 items-center gap-2.5 text-4xl font-bold tracking-tight sm:text-5xl">
                      {recipientKind !== "email" ? (
                        <span
                          className={`text-3xl font-semibold ${
                            recipient.trim() ? "text-graphite" : "text-fog"
                          }`}
                        >
                          @
                        </span>
                      ) : null}
                      {recipient.trim() ? (
                        <span
                          key={recipient.trim()}
                          className="animate-amount-pop min-w-0 truncate motion-reduce:animate-none"
                        >
                          {recipientKind === "email"
                            ? recipient.trim()
                            : recipient.trim().replace(/^@/, "")}
                        </span>
                      ) : (
                        <span className="text-fog">
                          {recipientKind === "email" ? "—" : "username"}
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-sm text-graphite">
                      Their .night name or linked X handle. We read their
                      passport keys from the Midnight registry.
                    </p>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="Recipient type"
                    className="flex rounded-2xl border border-fog bg-paper/70 p-1"
                  >
                    {(
                      [
                        {id: "twitter" as const, label: "Username"},
                        {id: "email" as const, label: "Email"},
                      ] as const
                    ).map((opt) => {
                      const selected = recipientKind === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={busy || step === "done"}
                          onClick={() => {
                            setRecipientKind(opt.id);
                            setRecipient("");
                            setError("");
                          }}
                          className={`relative flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/20 disabled:opacity-50 ${
                            selected
                              ? "bg-ink text-paper shadow-[0_1px_2px_rgba(10,10,10,0.18)]"
                              : "bg-transparent text-graphite hover:bg-white/80 hover:text-ink"
                          }`}
                        >
                          <RecipientKindIcon
                            kind={opt.id}
                            className="h-3.5 w-3.5"
                          />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={`field flex items-center gap-1.5 !py-0 ${
                      busy || step === "done" ? "opacity-50" : ""
                    }`}
                  >
                    {recipientKind !== "email" ? (
                      <span
                        className="shrink-0 select-none pl-1 text-lg font-semibold text-graphite"
                        aria-hidden
                      >
                        @
                      </span>
                    ) : null}
                    <input
                      type="text"
                      inputMode={
                        recipientKind === "email" ? "email" : "text"
                      }
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder={
                        recipientKind === "email"
                          ? "name@email.com"
                          : "username"
                      }
                      value={
                        recipientKind === "email"
                          ? recipient
                          : recipient.replace(/^@/, "")
                      }
                      onChange={(e) => {
                        const raw = e.target.value.trimStart();
                        setRecipient(
                          recipientKind === "email"
                            ? raw
                            : raw.replace(/^@+/g, "")
                        );
                      }}
                      onFocus={() => setRecipientFocused(true)}
                      onBlur={() => {
                        // Allow suggestion click before closing.
                        window.setTimeout(() => setRecipientFocused(false), 120);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && recipient.trim())
                          void handleResolve();
                      }}
                      disabled={busy || step === "done"}
                      autoComplete="off"
                      spellCheck={false}
                      className="min-w-0 flex-1 bg-transparent py-3.5 text-lg text-ink outline-none placeholder:text-fog disabled:cursor-not-allowed"
                    />
                  </div>

                  {(recipientFocused || !recipient.trim()) &&
                  recentSuggestions.length > 0 ? (
                    <div
                      role="listbox"
                      aria-label="Recent recipients"
                      className="overflow-hidden rounded-2xl border border-fog bg-white"
                    >
                      <p className="border-b border-fog/80 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
                        {recipient.trim() ? "Matches" : "Recent"}
                      </p>
                      <ul>
                        {recentSuggestions.map((r) => (
                          <li key={`${r.kind}:${r.value}`}>
                            <button
                              type="button"
                              role="option"
                              disabled={busy || step === "done"}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setRecipient(r.value);
                                setError("");
                                setRecipientFocused(false);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-ink transition-colors hover:bg-paper disabled:opacity-50"
                            >
                              <RecipientKindIcon
                                kind={r.kind}
                                className="h-3.5 w-3.5 shrink-0 text-graphite"
                              />
                              <span className="min-w-0 truncate">
                                {r.kind === "email" ? r.value : `@${r.value}`}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={busy || step === "done" || !recipient.trim()}
                  onClick={handleResolve}
                  className="btn-primary"
                >
                  {step === "resolving" ? (
                    <LoaderIcon className="h-5 w-5 animate-spin" />
                  ) : null}
                  {step === "resolving" ? "Looking up…" : "Continue"}
                </button>
              </>
            ) : (
              <>
                <TokenBalanceSelect
                  value={selectedToken}
                  onChange={onTokenChange}
                  disabled={busy}
                />
                <div className="animate-soft-rise space-y-5 motion-reduce:animate-none">
                <div className="rounded-2xl border border-fog bg-white px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-3 sm:gap-3.5">
                    <UserAvatar
                      address={resolved.wallet}
                      size="md"
                      className="animate-avatar-in shrink-0 motion-reduce:animate-none"
                    />
                    <div
                      className="min-w-0 flex-1 animate-soft-rise motion-reduce:animate-none"
                      style={{animationDelay: "80ms"}}
                    >
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
                        Paying
                      </p>
                      <p className="mt-0.5 flex min-w-0 items-center gap-1.5">
                        <span
                          key={resolved.username}
                          className="animate-amount-pop truncate text-xl font-bold tracking-tight sm:text-2xl motion-reduce:animate-none"
                        >
                          {formatRecipientLabel(
                            recipientKind === "email"
                              ? recipient
                              : resolved.username,
                            recipientKind
                          )}
                        </span>
                        <RecipientKindIcon
                          kind={recipientKind}
                          className="h-4 w-4 shrink-0 text-graphite"
                        />
                      </p>
                      <p
                        className="mt-0.5 truncate font-mono text-[11px] leading-snug text-graphite"
                        title={resolved.wallet}
                      >
                        {shortAddr(resolved.wallet)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setResolved(null);
                        setAmount(null);
                        setAmountText("");
                        setError("");
                      }}
                      className="shrink-0 self-center rounded-full border border-fog bg-paper px-3 py-1.5 text-xs font-semibold text-graphite transition-all duration-200 hover:border-graphite hover:text-ink active:scale-95 disabled:opacity-50"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div
                  className="animate-soft-rise space-y-4 motion-reduce:animate-none"
                  style={{animationDelay: "120ms"}}
                >
                  <div className="flex items-end justify-between gap-3">
                    <FieldLabel>Amount</FieldLabel>
                    <p className="pb-0.5 font-mono text-[11px] text-graphite">
                      Up to {amountDecimals} decimals
                    </p>
                  </div>
                  <div className="rounded-2xl border border-fog bg-white px-4 py-5 transition-shadow duration-300 sm:px-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        disabled={busy || (amount ?? 0) <= 0}
                        onClick={() => bumpAmount(-AMOUNT_STEP)}
                        aria-label="Decrease amount"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-fog bg-paper text-ink transition-all duration-200 hover:border-graphite hover:bg-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                      <div className="min-w-0 flex-1 text-center">
                        <div className="flex items-baseline justify-center gap-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            value={amountText}
                            disabled={busy}
                            onChange={(e) => onAmountTextChange(e.target.value)}
                            className="w-full min-w-0 bg-transparent text-center text-4xl font-bold sm:text-5xl tracking-tight tabular-nums text-ink outline-none transition-colors duration-200 placeholder:text-fog focus:text-ink disabled:opacity-50"
                            aria-label={`Amount in ${selectedToken.symbol}`}
                          />
                          <span
                            className={`shrink-0 text-lg font-semibold transition-colors duration-200 ${
                              amount != null ? "text-graphite" : "text-fog"
                            }`}
                          >
                            {selectedToken.symbol}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => bumpAmount(AMOUNT_STEP)}
                        aria-label="Increase amount"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-fog bg-paper text-ink transition-all duration-200 hover:border-graphite hover:bg-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <AmountPills
                    amounts={AMOUNT_PRESETS}
                    value={amount}
                    onChange={applyAmount}
                    disabled={busy}
                    canAfford={hasEnough}
                    symbol={selectedToken.symbol}
                  />
                </div>

                {amount != null && !hasEnough(amount) ? (
                  <p className="animate-fade text-sm text-amber motion-reduce:animate-none">
                    Not enough {selectedToken.symbol}. Balance {tokenBalance}.
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={
                    busy ||
                    amount == null ||
                    (amount != null && !hasEnough(amount))
                  }
                  onClick={handleSend}
                  className="btn-primary transition-transform duration-200 active:scale-[0.98]"
                >
                  {busy && !sendInFlight ? (
                    <LoaderIcon className="h-5 w-5 animate-spin" />
                  ) : null}
                  {stepLabel(step, amount, selectedToken.symbol)}
                </button>
                </div>
              </>
            )}
          </NetworkGate>
        )}

        {error && step !== "undelivered" && !sendInFlight ? (
          <ErrorBanner title={formatErrorTitle(error)} message={error} />
        ) : null}
      </Panel>
      </div>

      {showStatusModal ? (
        <PaymentStatusModal
          step={step}
          includeApprove={includeApprove}
          statusHint={statusHint}
          amount={sentAmount ?? amount}
          tokenSymbol={sentTokenSymbol || selectedToken.symbol}
          fromUsername={me?.username || ""}
          username={sentUsername || resolved?.username || ""}
          recipientKind={recipientKind}
          recipientInput={recipient}
          commitment={commitment}
          approveHash={approveHash}
          depositHash={txHash}
          error={error}
          retrying={false}
          onRetry={() => undefined}
          onClose={
            step === "done" || step === "undelivered"
              ? resetAfterSuccess
              : undefined
          }
        />
      ) : null}
    </>
  );
}

function PaymentStatusModal({
  step,
  includeApprove,
  statusHint,
  amount,
  tokenSymbol,
  fromUsername,
  username,
  recipientKind,
  recipientInput,
  commitment,
  approveHash,
  depositHash,
  error,
  retrying,
  onRetry,
  onClose,
}: {
  step: Step;
  includeApprove: boolean;
  statusHint: string;
  amount: number | null;
  tokenSymbol: string;
  fromUsername: string;
  username: string;
  recipientKind: Exclude<RecipientKind, "unknown">;
  recipientInput: string;
  commitment: string;
  approveHash: string;
  depositHash: string;
  error: string;
  retrying: boolean;
  onRetry: () => void;
  onClose?: () => void;
}) {
  const steps = flowSteps(includeApprove);
  const active = activeFlowId(step);
  const success = step === "done";
  const failed = step === "undelivered";
  const inFlight = !success && !failed;
  const activeIndex = steps.findIndex((s) => s.id === active);
  const progress =
    success || failed
      ? 1
      : activeIndex < 0
        ? 0
        : (activeIndex + 0.45) / steps.length;
  const tokenMeta = getPoolToken(tokenSymbol);
  const recipientLabel = formatRecipientLabel(
    recipientKind === "email" ? recipientInput : `@${username}`,
    recipientKind
  );
  const shareDetails: PaymentShareDetails = {
    fromUsername,
    toLabel: recipientLabel,
    amount: amount ?? "—",
    tokenSymbol,
    tokenLogo: tokenMeta?.logo,
  };
  const [shareBusy, setShareBusy] = useState<"copy" | "tweet" | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  async function onCopyImage() {
    setShareBusy("copy");
    try {
      await copyPaymentShareImage(shareDetails);
      toast.success("Share image copied. Paste it into X, Telegram, or Discord.");
    } catch {
      toast.error("Could not copy image. Try Share on X to download instead.");
    } finally {
      setShareBusy(null);
    }
  }

  async function onShareTwitter() {
    setShareBusy("tweet");
    try {
      const mode = await sharePaymentOnTwitter(shareDetails);
      toast.success(
        mode === "copied"
          ? "Image copied — paste it into your post on X."
          : "Image downloaded — attach it to your post on X."
      );
    } catch (e) {
      toast.error(formatError(e));
    } finally {
      setShareBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-status-title"
    >
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-md animate-fade motion-reduce:animate-none"
        aria-hidden
      />

      <div className="relative z-[1] flex max-h-[92dvh] w-full max-w-md animate-sheet-in flex-col overflow-y-auto rounded-t-3xl border border-fog bg-white shadow-[0_-12px_48px_-20px_rgba(10,10,10,0.35)] motion-reduce:animate-none sm:animate-rise sm:rounded-3xl sm:shadow-[0_28px_64px_-28px_rgba(10,10,10,0.4)]">
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-fog sm:hidden" />

        <div className="px-6 pb-2 pt-5 text-center sm:px-8 sm:pt-8">
          {success ? (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-signal/10 text-signal animate-amount-pop motion-reduce:animate-none">
              <CheckIcon className="h-7 w-7" />
            </div>
          ) : null}

          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-graphite">
            {success ? "Sent" : failed ? "Action needed" : "Sending"}
          </p>

          <h2
            id="payment-status-title"
            className={`mt-2 font-bold tracking-tight text-ink ${
              success
                ? "animate-amount-pop text-4xl motion-reduce:animate-none sm:text-5xl"
                : "text-3xl sm:text-4xl"
            }`}
          >
            {amount != null ? amount : "—"}{" "}
            <span className="text-[0.55em] font-semibold text-graphite">
              {tokenSymbol}
            </span>
          </h2>

          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-graphite">
            {tokenMeta?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tokenMeta.logo}
                alt=""
                className="h-4 w-4 rounded-full"
              />
            ) : null}
            <span>to {recipientLabel}</span>
            <RecipientKindIcon kind={recipientKind} className="h-3.5 w-3.5" />
          </p>
        </div>

        {!success ? (
          <div className="px-6 pt-5 sm:px-8">
            <div className="h-1.5 overflow-hidden rounded-full bg-fog">
              <div
                className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out"
                style={{width: `${Math.round(progress * 100)}%`}}
              />
            </div>
            <ol className="mt-3 flex justify-between gap-1">
              {steps.map((s, i) => {
                const done =
                  success ||
                  (failed && i < activeIndex) ||
                  (activeIndex >= 0 && i < activeIndex);
                const isActive = !success && !failed && s.id === active;
                return (
                  <li
                    key={s.id}
                    className={`min-w-0 flex-1 text-center font-mono text-[10px] tracking-wide ${
                      isActive
                        ? "font-semibold text-ink"
                        : done
                          ? "text-graphite"
                          : "text-graphite/45"
                    }`}
                  >
                    {s.label}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}

        <div className="px-6 py-5 sm:px-8 sm:pb-6">
          {inFlight ? (
            <div className="flex items-start gap-3 rounded-2xl bg-paper px-4 py-3.5">
              <LoaderIcon className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-ink" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {statusHint || "Working…"}
                </p>
                {!includeApprove ? (
                  <p className="mt-1 text-xs text-graphite">
                    One transaction: the tip and its sealed note land together.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {failed ? (
            <div className="space-y-3 rounded-2xl border border-amber/35 bg-amber/10 px-4 py-3.5">
              <p className="text-sm font-medium text-ink">
                Payment needs attention.
              </p>
              <p className="text-xs leading-relaxed text-graphite">
                Check your history before sending again.
              </p>
              {error ? (
                <p className="font-mono text-[11px] text-graphite">{error}</p>
              ) : null}
            </div>
          ) : null}

          {success ? (
            <div className="space-y-4">
              <PaymentSharePreview details={shareDetails} />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={shareBusy !== null}
                  onClick={() => void onCopyImage()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-fog bg-paper px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-graphite disabled:opacity-50"
                >
                  {shareBusy === "copy" ? (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                  Copy image
                </button>
                <button
                  type="button"
                  disabled={shareBusy !== null}
                  onClick={() => void onShareTwitter()}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-3 py-2.5 text-sm font-semibold text-paper transition-transform duration-200 hover:bg-ink/90 active:scale-[0.98] disabled:opacity-50"
                >
                  {shareBusy === "tweet" ? (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <XBrandIcon className="h-4 w-4" />
                  )}
                  Share on X
                </button>
              </div>

              <p className="text-center text-[11px] text-graphite">
                Tags{" "}
                <a
                  href="https://x.com/hushhprotocol"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-ink underline-offset-2 hover:underline"
                >
                  @hushhprotocol
                </a>{" "}
                · paste the image into your post
              </p>

              {(approveHash || depositHash) && (
                <div className="flex flex-wrap justify-center gap-2">
                  {approveHash ? (
                    <TxChip label="Approve" hash={approveHash} />
                  ) : null}
                  {depositHash ? (
                    <TxChip label="Deposit" hash={depositHash} />
                  ) : null}
                </div>
              )}

              {commitment ? (
                <p className="truncate text-center font-mono text-[10px] text-graphite/80">
                  {commitment}
                </p>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="btn-primary w-full"
              >
                Done
              </button>
            </div>
          ) : null}

          {!success && (approveHash || depositHash) ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {approveHash ? (
                <TxChip label="Approve" hash={approveHash} />
              ) : null}
              {depositHash ? (
                <TxChip label="Deposit" hash={depositHash} />
              ) : null}
            </div>
          ) : null}

          {commitment && failed ? (
            <p className="mt-3 truncate text-center font-mono text-[10px] text-graphite/80">
              {commitment}
            </p>
          ) : null}

          {failed ? (
            <div className="mt-5 space-y-2">
              <button
                type="button"
                className="btn-primary w-full"
                disabled={retrying}
                onClick={onRetry}
              >
                {retrying ? (
                  <LoaderIcon className="h-5 w-5 animate-spin" />
                ) : null}
                Retry deliver
              </button>
              {onClose ? (
                <button
                  type="button"
                  className="btn-ghost w-full"
                  onClick={onClose}
                >
                  Close
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TxChip({label, hash}: {label: string; hash: string}) {
  return (
    <a
      href={explorerTx(hash)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-fog bg-paper px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-graphite"
    >
      <span className="text-graphite">{label}</span>
      <span className="font-mono">{shortAddr(hash)}</span>
      <ExternalLinkIcon className="h-3 w-3 text-graphite" />
    </a>
  );
}

function stepLabel(
  step: Step,
  amount: number | null,
  symbol: string
): string {
  switch (step) {
    case "creating":
    case "approving":
    case "depositing":
    case "posting":
      return "Sending…";
    case "undelivered":
      return "Retry deliver";
    default:
      return amount != null ? `Pay ${amount} ${symbol}` : "Select an amount";
  }
}

