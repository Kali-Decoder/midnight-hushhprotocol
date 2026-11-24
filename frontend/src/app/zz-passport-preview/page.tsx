"use client";
import {useEffect, useState} from "react";
import {MidnightPassportCard} from "@/components/MidnightPassportCard";
import {renderPassportPng, passportTweetText} from "@/lib/sharePassport";
const u = {id: "a", username: "hushhprotocol", wallet: "mn_addr_preprod1ht9cv0szklt59l0kj9r9jfx8n9ty6fuq7lw7ps0s62sx6qwhtqws4qwey6", bulletPublicKey: "", tipPk: "51904456469385646959126479635092937085658665168591195040339906279892974555340", twitterUsername: "hushhprotocol", emailLinked: true, index: 0};
export default function P() {
  const [src, setSrc] = useState("");
  useEffect(() => { void renderPassportPng(u, {network: "Midnight Preprod"}).then((b) => setSrc(URL.createObjectURL(b))).catch((e) => { console.error("RENDERFAIL", e?.message, e?.stack); }); }, []);
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <MidnightPassportCard user={u} method="passkey" unlocked shareable />
      {src ? <img id="png" src={src} alt="" className="w-full rounded-xl ring-1 ring-fog" /> : null}
      <pre id="tweet" className="whitespace-pre-wrap text-left text-xs">{passportTweetText(u)}</pre>
    </div>
  );
}
