import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {ImageResponse} from "next/og";

export const alt = "Hushh Protocol: pay anyone by @name, privately, on Midnight";
export const size = {width: 1200, height: 630};
export const contentType = "image/png";

const INK = "#0a0a0a";
const PAPER = "#f4f2ed";
const FOG = "#e3dedb";
const GRAPHITE = "#6b6b6b";
const SIGNAL = "#00a676";

/** Midnight mark (ring + three dots), same geometry as MidnightMark.tsx. */
function Mark({size: s, color}: {size: number; color: string}) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.6" stroke={color} strokeWidth="1.9" />
      <rect x="11.15" y="5.9" width="1.7" height="1.7" rx="0.3" fill={color} />
      <rect x="11.15" y="8.55" width="1.7" height="1.7" rx="0.3" fill={color} />
      <rect x="11.15" y="11.2" width="1.7" height="1.7" rx="0.3" fill={color} />
    </svg>
  );
}

export default async function OpengraphImage() {
  const root = process.cwd();
  const [extraBold, semiBold, logo] = await Promise.all([
    readFile(join(root, "src/app/_og/PlusJakartaSans-ExtraBold.ttf")),
    readFile(join(root, "src/app/_og/PlusJakartaSans-SemiBold.ttf")),
    readFile(join(root, "public/logomark.png")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: PAPER,
          fontFamily: "Jakarta",
          color: INK,
          overflow: "hidden",
        }}
      >
        {/* soft signal + fog glows, like the landing blobs */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -160,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: `radial-gradient(circle, rgba(0,166,118,0.22), rgba(0,166,118,0) 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -160,
            bottom: -220,
            width: 560,
            height: 560,
            borderRadius: 9999,
            background: `radial-gradient(circle, rgba(227,222,219,0.9), rgba(227,222,219,0) 70%)`,
          }}
        />

        {/* Left: brand + headline */}
        <div style={{display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 60px 72px", width: 700}}>
          <div style={{display: "flex", alignItems: "center", gap: 16}}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={64} height={64} style={{borderRadius: 18, border: `2px solid ${FOG}`}} alt="" />
            <div style={{display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -1.2}}>Hushh Protocol</div>
          </div>

          <div style={{display: "flex", flexDirection: "column"}}>
            <div style={{display: "flex", fontSize: 104, fontWeight: 800, lineHeight: 0.92, letterSpacing: -6}}>
              Pay anyone
            </div>
            <div style={{display: "flex", fontSize: 104, fontWeight: 800, lineHeight: 1, letterSpacing: -6}}>
              by<span style={{color: "#b9b6b0", marginLeft: 26}}>@</span>name.
            </div>
            <div style={{display: "flex", marginTop: 30, fontSize: 28, fontWeight: 600, color: GRAPHITE, lineHeight: 1.35, maxWidth: 560}}>
              Own a .night name. Get tips sealed to you, claimed with a ZK proof.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              alignSelf: "flex-start",
              padding: "10px 20px 10px 12px",
              borderRadius: 999,
              background: "#ffffff",
              border: `1.5px solid ${FOG}`,
              fontSize: 22,
              fontWeight: 600,
              color: GRAPHITE,
            }}
          >
            <div style={{display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 999, background: INK}}>
              <Mark size={26} color="#ffffff" />
            </div>
            Built on <span style={{color: INK, fontWeight: 800, marginLeft: 6}}>Midnight</span>
          </div>
        </div>

        {/* Right: send card */}
        <div style={{display: "flex", flex: 1, alignItems: "center", justifyContent: "center", paddingRight: 64, position: "relative"}}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 400,
              borderRadius: 44,
              background: INK,
              padding: 12,
              boxShadow: "0 40px 80px -30px rgba(10,10,10,0.55)",
              transform: "rotate(3deg)",
            }}
          >
            <div style={{display: "flex", flexDirection: "column", gap: 14, padding: "26px 22px 34px", color: PAPER}}>
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                <div style={{display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 999, background: SIGNAL, color: "#04130d", fontSize: 22, fontWeight: 800}}>
                  M
                </div>
                <div style={{display: "flex", flexDirection: "column"}}>
                  <div style={{display: "flex", fontSize: 24, fontWeight: 800}}>maya.night</div>
                  <div style={{display: "flex", fontSize: 17, fontWeight: 600, color: "rgba(244,242,237,0.6)"}}>@maya · linked</div>
                </div>
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: 14, marginTop: -18, padding: "24px 22px 26px", borderRadius: 34, background: "#ffffff"}}>
              <div style={{display: "flex", fontSize: 15, fontWeight: 600, letterSpacing: 2, color: GRAPHITE}}>SENDING</div>
              <div style={{display: "flex", flexDirection: "column", padding: "16px 18px", borderRadius: 24, background: "#e9f1ea"}}>
                <div style={{display: "flex", fontSize: 17, fontWeight: 600, color: GRAPHITE}}>Amount</div>
                <div style={{display: "flex", alignItems: "center", gap: 10, marginTop: 2}}>
                  <div style={{display: "flex", fontSize: 58, fontWeight: 800, letterSpacing: -2.5, lineHeight: 1}}>25</div>
                  <div style={{display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 999, background: INK}}>
                    <Mark size={20} color="#ffffff" />
                  </div>
                  <div style={{display: "flex", fontSize: 22, fontWeight: 800, color: GRAPHITE}}>NIGHT</div>
                </div>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 800, color: SIGNAL}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke={SIGNAL} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Sealed to maya.night
              </div>
              <div style={{display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0", borderRadius: 999, background: INK, color: PAPER, fontSize: 21, fontWeight: 800}}>
                Send silently
              </div>
            </div>
          </div>

          {/* floating chip */}
          <div
            style={{
              position: "absolute",
              left: -10,
              bottom: 92,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 20px",
              borderRadius: 999,
              background: "#ffffff",
              boxShadow: "0 14px 34px -10px rgba(10,10,10,0.3)",
              fontSize: 22,
              fontWeight: 800,
              color: SIGNAL,
              transform: "rotate(-4deg)",
            }}
          >
            +25 NIGHT
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {name: "Jakarta", data: extraBold, weight: 800, style: "normal"},
        {name: "Jakarta", data: semiBold, weight: 600, style: "normal"},
      ],
    },
  );
}
