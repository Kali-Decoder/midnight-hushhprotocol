"use client";

import {useEffect, useState} from "react";
import {useAccount} from "@/lib/midnight/hooks";
import {deployContracts, type DeployResult} from "@/lib/midnight/store";
import {NETWORK_ID, NETWORK_LABEL, REGISTRY_ADDRESS, VAULT_ADDRESS} from "@/lib/midnight/config";
import {ConnectButton} from "@/components/ConnectButton";
import {NetworkGate} from "@/components/NetworkGate";
import {CheckIcon, CopyIcon, LoaderIcon} from "@/components/icons";
import {ErrorBanner, Panel} from "@/components/ui";
import {formatError} from "@/lib/errors";
import {shortAddr} from "@/lib/address";
import {toast} from "@/lib/toast";

type Step = "idle" | "registry" | "vault" | "done";

/** Full message chain (error -> cause -> cause…), so wallet rejections are readable. */
function errorChain(e: unknown): string {
  const parts: string[] = [];
  let cur: unknown = e;
  for (let i = 0; cur && i < 6; i++) {
    const err = cur as {name?: string; message?: string; code?: unknown; reason?: unknown; cause?: unknown};
    const code = err.code !== undefined ? ` [code ${String(err.code)}]` : "";
    const reason = typeof err.reason === "string" ? ` (${err.reason})` : "";
    parts.push(`${err.name ?? "Error"}${code}: ${err.message ?? String(cur)}${reason}`);
    cur = err.cause;
  }
  return parts.join("\n  caused by ");
}

export function DeployPanel() {
  const {address, isConnected} = useAccount();
  const [attester, setAttester] = useState<{x: string; y: string} | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<DeployResult | null>(null);

  useEffect(() => {
    fetch("/api/social/attester")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "attester key unavailable");
        setAttester(body);
      })
      .catch((e) => setError(formatError(e)));
  }, []);

  async function deploy() {
    if (!attester) return;
    setError("");
    try {
      const r = await deployContracts(attester, setStep);
      setResult(r);
      setStep("done");
      toast.success("Contracts deployed.");
    } catch (e) {
      console.error("[hushh] deploy failed", e);
      setStep("idle");
      setError(errorChain(e));
      toast.error(e);
    }
  }

  const envBlock = result
    ? [
        `NEXT_PUBLIC_MIDNIGHT_NETWORK=${result.networkId}`,
        `NEXT_PUBLIC_REGISTRY_ADDRESS=${result.registry}`,
        `NEXT_PUBLIC_VAULT_ADDRESS=${result.vault}`,
      ].join("\n")
    : "";
  const deploymentJson = result
    ? JSON.stringify(
        {network: result.networkId, networkId: result.networkId, vault: result.vault, registry: result.registry,
         attesterPk: result.attesterPk, deployer: result.deployer, deployedAt: new Date().toISOString()},
        null,
        2
      )
    : "";

  const busy = step === "registry" || step === "vault";
  const already = REGISTRY_ADDRESS && VAULT_ADDRESS;

  return (
    <Panel className="space-y-5 text-left">
      <div className="rounded-xl bg-paper/80 px-4 py-3">
        <p className="text-xs text-graphite">Target network</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{NETWORK_LABEL[NETWORK_ID]}</p>
        {already ? (
          <p className="mt-1 text-xs text-amber">
            This build already points at deployed contracts ({shortAddr(REGISTRY_ADDRESS)}, {shortAddr(VAULT_ADDRESS)}).
            Deploying again creates a separate, empty Hushh instance.
          </p>
        ) : null}
      </div>

      <div className="rounded-xl bg-paper/80 px-4 py-3">
        <p className="text-xs text-graphite">Social attester public key</p>
        <p className="mt-0.5 break-all font-mono text-xs text-ink">
          {attester ? `${attester.x.slice(0, 18)}… / ${attester.y.slice(0, 18)}…` : "loading…"}
        </p>
        <p className="mt-1 text-xs text-graphite">
          Sealed into the registry. Only signatures from the matching ATTESTER_SECRET can link X handles.
        </p>
      </div>

      {!isConnected ? (
        <div className="space-y-3 text-center">
          <p className="text-sm text-graphite">Connect the wallet that will pay for the deployment (NIGHT + DUST).</p>
          <ConnectButton label="Connect wallet" />
        </div>
      ) : (
        <NetworkGate>
          <div className="rounded-xl bg-paper/80 px-4 py-3">
            <p className="text-xs text-graphite">Deployer</p>
            <p className="mt-0.5 truncate font-mono text-xs text-ink" title={address}>{address}</p>
          </div>

          {step !== "done" ? (
            <button type="button" disabled={busy || !attester} onClick={() => void deploy()} className="btn-primary">
              {busy ? <LoaderIcon className="h-5 w-5 animate-spin" /> : null}
              {step === "registry"
                ? "Deploying night_registry… approve in your wallet"
                : step === "vault"
                  ? "Deploying hushh_vault… approve in your wallet"
                  : "Deploy Hushh contracts"}
            </button>
          ) : null}
          {busy ? (
            <p className="text-xs text-graphite">
              Each deploy is proven, submitted, then waits for the indexer. This can take a few minutes. Keep this tab open.
            </p>
          ) : null}
        </NetworkGate>
      )}

      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-signal">
            <CheckIcon className="h-5 w-5" />
            <p className="text-sm font-medium text-ink">Deployed on {result.networkId}</p>
          </div>
          <CopyBlock label="Frontend env (.env.local / Vercel)" value={envBlock} />
          <CopyBlock label={`midnight/deployments/${result.networkId}.json`} value={deploymentJson} />
        </div>
      ) : null}

      {error ? (
        <div className="space-y-2">
          <ErrorBanner message={formatError(error)} />
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-fog bg-paper/60 p-3 font-mono text-[11px] text-ink">
            {error}
          </pre>
        </div>
      ) : null}
    </Panel>
  );
}

function CopyBlock({label, value}: {label: string; value: string}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-fog bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">{label}</p>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-full border border-fog bg-white p-2 text-ink hover:border-graphite"
          aria-label={`Copy ${label}`}
        >
          {copied ? <CheckIcon className="h-3.5 w-3.5 text-signal" /> : <CopyIcon className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="mt-2 overflow-x-auto whitespace-pre font-mono text-[11px] leading-relaxed text-ink">{value}</pre>
    </div>
  );
}
