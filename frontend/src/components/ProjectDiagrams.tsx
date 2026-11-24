"use client";

import {MermaidDiagram} from "@/components/MermaidDiagram";
import Reveal from "@/components/Reveal";

const FLOW_CHART = `
flowchart LR
  A["You"] -->|pay alice.night or @alice| B["Hushh vault on Midnight"]
  B -->|ZK claim| C["Alice"]
  style A fill:#0A0A0A,stroke:#0A0A0A,color:#F5F3EE
  style B fill:#FFFFFF,stroke:#0A0A0A,color:#0A0A0A
  style C fill:#0A0A0A,stroke:#0A0A0A,color:#F5F3EE
`;

const SEQUENCE_CHART = `
sequenceDiagram
  participant You
  participant App as Hushh app
  participant Reg as night_registry
  participant Vault as hushh_vault
  participant Them as Recipient

  You->>App: Pick @handle and amount
  App->>Reg: Resolve handle to passport keys
  App->>Vault: Deposit NIGHT + note sealed to them
  Note over Vault: Chain sees amount, commitment, sealed note
  Them->>Vault: Scan inbox with passport key
  Them->>Vault: Claim with ZK proof
  Vault-->>Them: NIGHT to their wallet
`;

const PRIVACY_CHART = `
flowchart TB
  subgraph public ["Visible on Midnight"]
    D["Sender wallet and amount"]
    C["Commitment + sealed note"]
    W["Claim and receiving wallet"]
  end
  subgraph hidden ["Never on-chain"]
    K["Passport secret"]
    N["Recipient name / X handle in the payment"]
  end
  D --- C
  C --- W
  K:::mute
  N:::mute
  classDef mute fill:#F5F3EE,stroke:#E5E0DE,color:#6B6B6B
`;

const DIAGRAMS = [
  {
    title: "The simple path",
    body: "You pay a .night name or X handle. NIGHT waits in the Hushh vault, sealed to them. They claim with a proof.",
    chart: FLOW_CHART,
  },
  {
    title: "What happens step by step",
    body: "The registry turns a name into passport keys. One deposit carries the NIGHT and the sealed note. The claim is proven in zero knowledge.",
    chart: SEQUENCE_CHART,
  },
  {
    title: "What privacy means here",
    body: "Secrets stay on the device and names stay out of payments. Amounts and wallets are public, and a claim can be matched to its deposit.",
    chart: PRIVACY_CHART,
  },
] as const;

export default function ProjectDiagrams() {
  return (
    <Reveal className="w-full max-w-4xl text-left">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          How Hushh Protocol works
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-graphite sm:text-base">
          Three pictures. No jargon required.
        </p>
      </div>

      <div className="mt-12 space-y-10">
        {DIAGRAMS.map((d, i) => (
          <Reveal key={d.title} delay={i * 80} className="panel p-5 sm:p-8">
            <p className="font-mono text-xs text-graphite">
              0{i + 1}
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {d.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-graphite sm:text-base">
              {d.body}
            </p>
            <div className="mt-6 rounded-xl border border-fog bg-paper/50 p-3 sm:p-5">
              <MermaidDiagram chart={d.chart} title={d.title} />
            </div>
          </Reveal>
        ))}
      </div>
    </Reveal>
  );
}
