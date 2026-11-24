// Midnight Passport share card: a 1200x675 PNG (X's large-image ratio) in the
// app's paper theme, plus copy / download / "post on X" helpers. Same pattern
// as sharePayment.ts.

import type {PublicUser} from "@/shared";
import {getAvatarByAddress} from "@/utils/getAvatarByAddress";
import {twitterIntentUrl} from "@/lib/sharePayment";

const INK = "#0a0a0a";
const GRAPHITE = "#6b6b6b";
const FOG = "#e3dedb";
const SIGNAL = "#00a676";
const SANS = "Plus Jakarta Sans, ui-sans-serif, system-ui, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

export function passportNumber(tipPk?: string): string {
  if (!tipPk) return "HP-········";
  const hex = BigInt(tipPk).toString(16).padStart(64, "0").toUpperCase();
  return `HP-${hex.slice(-8, -4)}-${hex.slice(-4)}`;
}

export function passportProfileUrl(username: string): string {
  return `${window.location.origin}/${username}`;
}

export function passportTweetText(u: PublicUser): string {
  const links = [u.twitterUsername ? "X" : null, u.emailLinked ? "email" : null].filter(Boolean);
  return [
    `I just claimed ${u.username}.night on Midnight Passport 🌙`,
    "",
    links.length
      ? `Passkey-owned, linked to my ${links.join(" + ")}. Pay me privately in NIGHT with @hushhprotocol:`
      : "Passkey-owned, no seed phrase. Pay me privately in NIGHT with @hushhprotocol:",
    passportProfileUrl(u.username),
    "",
    "#Midnight #MidnightPassport",
  ].join("\n");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed_image:${src}`));
    img.src = src;
  });
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return `${t}…`;
}

export async function renderPassportPng(u: PublicUser, opts: {network: string}): Promise<Blob> {
  const W = 1200;
  const H = 675;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  await document.fonts?.ready;

  const avatar = getAvatarByAddress(u.wallet);
  const [mid, hushh, face] = await Promise.all([
    loadImage("/midnight-logo.png").catch(() => null),
    loadImage("/logomark.png").catch(() => null),
    loadImage(avatar.avatarImage).catch(() => null),
  ]);

  // Page background (paper)
  ctx.fillStyle = "#f4f2ed";
  ctx.fillRect(0, 0, W, H);

  // Card
  const cx = 56, cy = 48, cw = W - 112, ch = H - 96;
  ctx.save();
  ctx.shadowColor = "rgba(10,10,10,0.12)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  rr(ctx, cx, cy, cw, ch, 40);
  const bg = ctx.createLinearGradient(0, cy, 0, cy + ch);
  bg.addColorStop(0, "#f6f4ef");
  bg.addColorStop(0.7, "#ffffff");
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.restore();
  ctx.save();
  rr(ctx, cx, cy, cw, ch, 40);
  ctx.clip();
  const glow = ctx.createRadialGradient(cx + cw, cy, 20, cx + cw, cy, 520);
  glow.addColorStop(0, "rgba(0,166,118,0.13)");
  glow.addColorStop(1, "rgba(0,166,118,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx, cy, cw, ch);
  // guilloche rings
  ctx.strokeStyle = "rgba(10,10,10,0.045)";
  ctx.lineWidth = 1.2;
  for (let r = 20; r < 380; r += 14) {
    ctx.beginPath();
    ctx.arc(cx + cw - 110, cy + 90, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(10,10,10,0.10)";
  ctx.lineWidth = 2;
  rr(ctx, cx, cy, cw, ch, 40);
  ctx.stroke();

  const L = cx + 52;
  const R = cx + cw - 52;

  // Header
  if (mid) {
    ctx.save();
    rr(ctx, L, cy + 44, 52, 52, 14);
    ctx.clip();
    ctx.drawImage(mid, L, cy + 44, 52, 52);
    ctx.restore();
  }
  ctx.fillStyle = INK;
  ctx.font = `700 20px ${SANS}`;
  ctx.letterSpacing = "6px";
  ctx.fillText("MIDNIGHT PASSPORT", L + 70, cy + 68);
  ctx.fillStyle = GRAPHITE;
  ctx.font = `500 15px ${SANS}`;
  ctx.letterSpacing = "4px";
  ctx.fillText(`NIGHT ID · ${opts.network.toUpperCase()}`, L + 70, cy + 92);
  ctx.letterSpacing = "0px";

  // Hushh badge (top right)
  if (hushh) {
    ctx.save();
    rr(ctx, R - 52, cy + 44, 52, 52, 14);
    ctx.clip();
    ctx.drawImage(hushh, R - 52, cy + 44, 52, 52);
    ctx.restore();
  }

  // Photo
  const py = cy + 140;
  ctx.save();
  ctx.shadowColor = "rgba(10,10,10,0.12)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  rr(ctx, L, py, 180, 180, 30);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = FOG;
  rr(ctx, L, py, 180, 180, 30);
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.arc(L + 90, py + 90, 76, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = avatar.bgColor;
  ctx.fillRect(L + 14, py + 14, 152, 152);
  if (face) ctx.drawImage(face, L + 14, py + 14, 152, 152);
  ctx.restore();

  // Holder
  const tx = L + 220;
  ctx.fillStyle = GRAPHITE;
  ctx.font = `600 15px ${SANS}`;
  ctx.letterSpacing = "4px";
  ctx.fillText("HOLDER", tx, py + 26);
  ctx.letterSpacing = "0px";
  ctx.font = `800 64px ${SANS}`;
  const name = fitText(ctx, u.username, R - tx - 170);
  ctx.fillStyle = INK;
  ctx.fillText(name, tx, py + 96);
  const nw = ctx.measureText(name).width;
  ctx.fillStyle = GRAPHITE;
  ctx.fillText(".night", tx + nw, py + 96);

  const fields: [string, string][] = [
    ["NO.", passportNumber(u.tipPk)],
    ["ISSUED", u.index != null ? `#${String(u.index + 1).padStart(4, "0")}` : "—"],
    ["NETWORK", "Midnight"],
  ];
  fields.forEach(([k, v], i) => {
    const fx = tx + i * 220;
    ctx.fillStyle = GRAPHITE;
    ctx.font = `600 13px ${SANS}`;
    ctx.letterSpacing = "3px";
    ctx.fillText(k, fx, py + 140);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = INK;
    ctx.font = `500 22px ${MONO}`;
    ctx.fillText(v, fx, py + 172);
  });

  // Credentials
  const creds: [string, string, boolean][] = [
    ["PASSKEY", "Secured", true],
    ["X", u.twitterUsername ? `@${u.twitterUsername}` : "Not linked", !!u.twitterUsername],
    ["EMAIL", u.emailLinked ? "Verified" : "Not linked", !!u.emailLinked],
  ];
  const gy = py + 220;
  const gap = 18;
  const tw = (R - L - gap * 2) / 3;
  creds.forEach(([k, v, on], i) => {
    const x = L + i * (tw + gap);
    rr(ctx, x, gy, tw, 96, 22);
    ctx.fillStyle = on ? "#ffffff" : "rgba(244,242,237,0.6)";
    ctx.fill();
    ctx.setLineDash(on ? [] : [6, 6]);
    ctx.strokeStyle = FOG;
    ctx.lineWidth = 2;
    rr(ctx, x, gy, tw, 96, 22);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x + tw - 26, gy + 26, 6, 0, Math.PI * 2);
    ctx.fillStyle = on ? SIGNAL : FOG;
    ctx.fill();
    ctx.fillStyle = GRAPHITE;
    ctx.font = `600 13px ${SANS}`;
    ctx.letterSpacing = "3px";
    ctx.fillText(k, x + 24, gy + 36);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = on ? INK : "rgba(107,107,107,0.7)";
    ctx.font = `700 26px ${SANS}`;
    ctx.fillText(fitText(ctx, v, tw - 48), x + 24, gy + 74);
  });

  // MRZ
  ctx.fillStyle = "rgba(107,107,107,0.55)";
  ctx.font = `500 17px ${MONO}`;
  ctx.letterSpacing = "5px";
  const mrz = (`P<NIGHT<${u.username}`.toUpperCase().replace(/[^A-Z0-9<]/g, "<") + "<".repeat(44)).slice(0, 44);
  ctx.fillText(mrz, L, cy + ch - 34);
  ctx.letterSpacing = "0px";

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png_encode_failed"))), "image/png", 1),
  );
}

export async function copyPassportImage(u: PublicUser, opts: {network: string}): Promise<void> {
  // Pass a promise so Safari keeps the user-gesture while the PNG renders.
  const item = new ClipboardItem({"image/png": renderPassportPng(u, opts)});
  await navigator.clipboard.write([item]);
}

export async function downloadPassportImage(u: PublicUser, opts: {network: string}): Promise<void> {
  const blob = await renderPassportPng(u, opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${u.username}.night-passport.png`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Copy the card image (download if the clipboard refuses), then open X with a caption. */
export async function sharePassportOnX(u: PublicUser, opts: {network: string}): Promise<"copied" | "downloaded"> {
  // Copy while this tab still has focus (the clipboard needs it), then open X.
  let mode: "copied" | "downloaded" = "downloaded";
  try {
    await copyPassportImage(u, opts);
    mode = "copied";
  } catch {
    await downloadPassportImage(u, opts);
  }
  window.open(twitterIntentUrl(passportTweetText(u)), "_blank", "noopener,noreferrer");
  return mode;
}
