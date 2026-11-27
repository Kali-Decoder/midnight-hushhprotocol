"use client";

import "./story.css";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {motion, useInView, useScroll, useSpring, useTransform} from "motion/react";
import {type FormEvent, type ReactNode, useEffect, useRef, useState} from "react";
import {CheckIcon, GithubIcon, ShieldCheckIcon, XBrandIcon} from "@/components/icons";
import {MidnightMark, NightCoin} from "@/components/story/MidnightMark";
import ScrollProgress from "@/components/landing/ScrollProgress";
import {type Chip, EASE, SmoothScroll, Stage, Words, scrollToEl} from "@/components/story/motion";
import {
  AddressScreen,
  ClaimNameScreen,
  GiftScreen,
  HomeScreen,
  InboxScreen,
  LinkXScreen,
  ProofScreen,
  SendScreen,
} from "@/components/story/screens";

/* ---------- Story content ---------- */

type Scene = {
  n: string;
  when: string;
  title: {pre: string; hl: string};
  body: string;
  dark?: boolean;
  screen: ReactNode;
  chips: Chip[];
};

const SCENES: Scene[] = [
  {
    n: "01",
    when: "9:12 pm",
    title: {pre: "Meet", hl: "Maya."},
    body: "She draws zines. Fans want to tip her, but all she has is a 60-character wallet address.",
    screen: <AddressScreen />,
    chips: [
      {pos: "tr", tone: "bad", text: "Typo = lost forever"},
      {pos: "ml", text: "Who is mn_addr…?"},
      {pos: "br", tone: "dark", text: "No name. No context."},
    ],
  },
  {
    n: "02",
    when: "9:14 pm",
    dark: true,
    title: {pre: "She claimed", hl: "maya.night."},
    body: "One passkey, no seed phrase. Midnight Passport derives her keys on her phone and keeps them there.",
    screen: <ClaimNameScreen />,
    chips: [
      {pos: "tl", tone: "good", text: "✓ Available"},
      {pos: "ml", text: "Face ID, not 24 words"},
      {pos: "bl", tone: "dark", text: "Keys stay on device"},
    ],
  },
  {
    n: "03",
    when: "9:15 pm",
    title: {pre: "Then linked", hl: "@maya."},
    body: "Her X handle now points to her passport. The contract checks the signed attestation in-circuit.",
    screen: <LinkXScreen />,
    chips: [
      {pos: "tr", tone: "good", text: "✓ Verified on-chain"},
      {pos: "ml", text: "@maya → maya.night"},
      {pos: "br", tone: "amber", text: "Email: hash only"},
    ],
  },
  {
    n: "04",
    when: "Every Friday",
    dark: true,
    title: {pre: "Fans tip her", hl: "by name."},
    body: "Type @maya, pick an amount, send. The tip is sealed to her key and never mentions her.",
    screen: <SendScreen />,
    chips: [
      {pos: "tl", text: "To: @maya"},
      {pos: "ml", tone: "good", text: "Sealed ✓"},
      {pos: "bl", tone: "dark", text: "Sender can't take it back"},
    ],
  },
  {
    n: "05",
    when: "Sunday night",
    title: {pre: "Her inbox", hl: "has no server."},
    body: "Her phone tries her key against the vault's sealed notes. Only hers open. Nobody else learns which.",
    screen: <InboxScreen />,
    chips: [
      {pos: "tr", tone: "good", text: "3 new tips"},
      {pos: "ml", text: "Trial-decrypted locally"},
      {pos: "br", tone: "dark", text: "No backend inbox"},
    ],
  },
  {
    n: "06",
    when: "Sunday, 10:02 pm",
    dark: true,
    title: {pre: "Claimed with", hl: "a proof."},
    body: "A zero-knowledge proof shows she holds the secret and the tip is unclaimed. Midnight checks it natively.",
    screen: <ProofScreen />,
    chips: [
      {pos: "tl", tone: "good", text: "+25 NIGHT", icon: "night"},
      {pos: "ml", text: "Secret stays private"},
      {pos: "bl", tone: "dark", text: "Verified by Midnight", icon: "midnight"},
    ],
  },
  {
    n: "07",
    when: "Always",
    title: {pre: "And gifts", hl: "the new kid."},
    body: "Jo has no passport yet. A scratch card or claim link carries a one-time secret, so Jo can still collect.",
    screen: <GiftScreen />,
    chips: [
      {pos: "tr", tone: "amber", text: "✦ Scratch to reveal"},
      {pos: "ml", text: "One-time link"},
      {pos: "br", tone: "dark", text: "No account needed"},
    ],
  },
];

const MotionLink = motion.create(Link);

const ctaVariants = {
  hidden: {opacity: 0, y: 14},
  show: {opacity: 1, y: 0, transition: {duration: 0.7, ease: EASE}},
};

const textVariants = {
  hidden: {opacity: 0, y: 22},
  show: {opacity: 1, y: 0, transition: {duration: 0.8, ease: EASE}},
};

function SceneBlock({s, index, onActive}: {s: Scene; index: number; onActive: (i: number) => void}) {
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const centered = useInView(ref, {amount: 0.55});
  const textIn = useInView(textRef, {once: true, amount: 0.6});
  const preWords = s.title.pre.split(" ").length;

  useEffect(() => {
    if (centered) onActive(index);
  }, [centered, index, onActive]);

  return (
    <section
      ref={ref}
      id={`scene-${s.n}`}
      className={`hs-scene ${s.dark ? "hs-scene-dark" : ""}`}
      aria-labelledby={`scene-${s.n}-title`}
    >
      <div className="hs-wrap hs-scene-grid">
        <motion.div
          ref={textRef}
          className="hs-scene-text"
          data-in={textIn}
          initial="hidden"
          animate={textIn ? "show" : "hidden"}
          transition={{staggerChildren: 0.12}}
        >
          <motion.span className="hs-kicker" variants={textVariants}>
            <b>{s.n}</b> {s.when}
          </motion.span>
          <motion.h2 id={`scene-${s.n}-title`} variants={{hidden: {}, show: {}}}>
            <Words text={s.title.pre} />{" "}
            <span className="hs-hl">
              <Words text={s.title.hl} start={preWords} />
            </span>
          </motion.h2>
          <motion.p variants={textVariants} transition={{delay: 0.35}}>
            {s.body}
          </motion.p>
        </motion.div>
        <Stage chips={s.chips}>{s.screen}</Stage>
      </div>
    </section>
  );
}

/** Desktop chapter rail: shows where you are in the story; click to jump. */
function SceneRail({active, visible}: {active: number; visible: boolean}) {
  const dark = active >= 0 && SCENES[active]?.dark;
  return (
    <nav
      className="hs-rail"
      aria-label="Story chapters"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        color: dark ? "var(--color-paper)" : "var(--color-ink)",
      }}
    >
      {SCENES.map((s, i) => (
        <button
          key={s.n}
          type="button"
          aria-current={i === active}
          aria-label={`Chapter ${s.n}: ${s.title.pre} ${s.title.hl}`}
          onClick={() => scrollToEl(document.getElementById(`scene-${s.n}`))}
        >
          <i />
          <span>{s.n}</span>
        </button>
      ))}
    </nav>
  );
}

/* ---------- Mobile tiles (desktop shows the scenes instead) ---------- */

const TILES: {kicker: string; title: string; body: string; tone: "light" | "dark" | "wash"; view: ReactNode}[] = [
  {
    kicker: "Name",
    title: "Own a .night name.",
    body: "Passkey in, seed phrase never. Your X handle becomes yourname.night.",
    tone: "light",
    view: (
      <div className="hs-tv">
        <div className="hs-send-to" style={{fontSize: 17}}>
          maya.night <span className="hs-pill" style={{marginLeft: "auto"}}>Available</span>
        </div>
        <div className="hs-note">
          <ShieldCheckIcon width={14} height={14} /> Keys never leave your phone
        </div>
      </div>
    ),
  },
  {
    kicker: "Send",
    title: "Pay by @handle.",
    body: "Send NIGHT to @alice or alice.night. The tip is sealed to her and never names her.",
    tone: "dark",
    view: (
      <div className="hs-tv">
        <div className="hs-send-to" style={{fontSize: 17}}>
          @maya · 25 NIGHT
          <span className="hs-ok">
            <CheckIcon width={12} height={12} />
          </span>
        </div>
        <span className="hs-status">Sealed to her passport</span>
      </div>
    ),
  },
  {
    kicker: "Inbox",
    title: "No server inbox.",
    body: "Your phone finds your tips by trying your key on the vault. Nobody else learns which are yours.",
    tone: "wash",
    view: (
      <div className="hs-tv">
        <div className="hs-send-to" style={{fontSize: 17}}>
          3 new tips <span className="hs-pill" style={{marginLeft: "auto"}}>+40 NIGHT</span>
        </div>
        <span className="hs-sub">Scanned on this device</span>
      </div>
    ),
  },
  {
    kicker: "Claim",
    title: "Prove it, privately.",
    body: "A zero-knowledge proof claims the tip. Your secret stays a private witness.",
    tone: "light",
    view: (
      <div className="hs-proof">
        <span>
          knows(secret) <b>✓</b>
        </span>
        <span>
          not_claimed(note) <b>✓</b>
        </span>
      </div>
    ),
  },
];

/* ---------- Closing claim form ---------- */

function ClaimForm() {
  const router = useRouter();
  const [name, setName] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim().toLowerCase().replace(/^@/, "").replace(/\.night$/, "");
    router.push(clean ? `/register?name=${encodeURIComponent(clean)}` : "/register");
  }

  return (
    <form className="hs-claim-form" onSubmit={onSubmit}>
      <label htmlFor="hs-claim-name" className="sr-only">
        Your name
      </label>
      <input
        id="hs-claim-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="yourname"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={32}
      />
      <span className="hs-claim-suffix">.night</span>
      <button type="submit" className="hs-btn hs-btn-signal">
        Claim it
      </button>
    </form>
  );
}

/* ---------- Page ---------- */

export default function StoryLanding() {
  const [active, setActive] = useState(-1);
  const scenesRef = useRef<HTMLDivElement>(null);
  const storyVisible = useInView(scenesRef, {margin: "-45% 0px -45% 0px"});

  // Closing panel grows to full width as it scrolls in.
  const claimRef = useRef<HTMLElement>(null);
  const {scrollYProgress: claimP} = useScroll({target: claimRef, offset: ["start end", "start 35%"]});
  const claimS = useSpring(claimP, {stiffness: 90, damping: 24, mass: 0.4});
  const claimScale = useTransform(claimS, [0, 1], [0.92, 1]);
  const claimRadius = useTransform(claimS, [0, 1], [72, 40]);
  const claimHeadIn = useInView(claimRef, {once: true, amount: 0.4});
  const {scrollYProgress: claimThrough} = useScroll({target: claimRef, offset: ["start end", "end start"]});
  const ringRotate = useTransform(claimThrough, [0, 1], [-40, 50]);
  const ringY = useTransform(claimThrough, [0, 1], [80, -60]);

  // Hero copy drifts up and fades as you leave it.
  const heroRef = useRef<HTMLElement>(null);
  const {scrollYProgress: heroP} = useScroll({target: heroRef, offset: ["start start", "end start"]});
  const heroY = useTransform(heroP, [0, 1], [0, -90]);
  const heroFade = useTransform(heroP, [0, 0.75], [1, 0]);

  return (
    <div className="hs">
      <SmoothScroll />
      <ScrollProgress />
      <SceneRail active={active} visible={storyVisible} />

      {/* Hero */}
      <header ref={heroRef} className="hs-hero">
        <div className="hs-wrap hs-hero-grid">
          <motion.div className="hs-hero-body" style={{y: heroY, opacity: heroFade}}>
            <motion.a
              href="https://midnight.network"
              target="_blank"
              rel="noopener noreferrer"
              className="hs-mn-badge"
              initial={{opacity: 0, y: 10, scale: 0.96}}
              animate={{opacity: 1, y: 0, scale: 1}}
              transition={{duration: 0.7, ease: EASE}}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/midnight-logo.png" alt="" width={26} height={26} />
              <span>
                Built on <b>Midnight</b>
              </span>
              <span className="hs-mn-badge-sep" aria-hidden />
              <span className="hs-mn-badge-dim">Zero-knowledge L1</span>
            </motion.a>
            <motion.h1 initial="hidden" animate="show">
              <Words text="Pay anyone" />
              <br />
              <span className="hs-word">
                <motion.span
                  custom={2}
                  variants={{
                    hidden: {y: "110%", rotate: 4},
                    show: (i: number) => ({y: "0%", rotate: 0, transition: {delay: 0.05 + i * 0.065, duration: 0.95, ease: EASE}}),
                  }}
                >
                  by
                </motion.span>
              </span>{" "}
              <span className="hs-word">
                <motion.span
                  custom={3}
                  variants={{
                    hidden: {y: "110%", rotate: 4},
                    show: (i: number) => ({y: "0%", rotate: 0, transition: {delay: 0.05 + i * 0.065, duration: 0.95, ease: EASE}}),
                  }}
                >
                  <span className="hs-dim">@</span>name.
                </motion.span>
              </span>
            </motion.h1>
            <motion.p
              className="hs-lede"
              initial={{opacity: 0, y: 16, filter: "blur(4px)"}}
              animate={{opacity: 1, y: 0, filter: "blur(0px)"}}
              transition={{duration: 0.9, ease: EASE, delay: 0.45}}
            >
              No 60-character addresses. No seed phrase. Just a .night name, sealed tips, and a
              zero-knowledge proof to claim them.
            </motion.p>

            {/* Mobile-only send card */}
            <motion.div
              className="hs-send"
              aria-hidden
              initial={{opacity: 0, y: 28, scale: 0.97}}
              animate={{opacity: 1, y: 0, scale: 1}}
              transition={{duration: 0.9, ease: EASE, delay: 0.55}}
            >
              <span className="hs-label">To</span>
              <div className="hs-send-to">
                <span className="hs-av hs-av-signal">M</span>
                @maya
                <span className="hs-ok">
                  <CheckIcon width={12} height={12} />
                </span>
              </div>
              <div className="hs-amt">
                <span className="hs-sub">Amount</span>
                <span className="hs-amt-big">
                  25
                  <small className="hs-unit">
                    <NightCoin size={16} /> NIGHT
                  </small>
                </span>
              </div>
              <span className="hs-status">
                <ShieldCheckIcon width={16} height={16} /> Sealed to maya.night
              </span>
            </motion.div>

            <motion.div
              className="hs-ctas"
              initial="hidden"
              animate="show"
              transition={{staggerChildren: 0.08, delayChildren: 0.65}}
            >
              <MotionLink href="/register" className="hs-btn hs-btn-dark" variants={ctaVariants} whileHover={{y: -2}} whileTap={{scale: 0.97}}>
                Claim your .night
              </MotionLink>
              <MotionLink href="/send" className="hs-btn hs-btn-ghost" variants={ctaVariants} whileHover={{y: -2}} whileTap={{scale: 0.97}}>
                Send NIGHT
              </MotionLink>
              <motion.a
                href="#story"
                className="hs-btn hs-btn-ghost hs-desktop-only"
                variants={ctaVariants} whileHover={{y: -2}} whileTap={{scale: 0.97}}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToEl(document.getElementById("story"));
                }}
              >
                See how it works ↓
              </motion.a>
            </motion.div>
          </motion.div>

          <Stage
            hero
            chips={[
              {pos: "tr", tone: "good", text: "+25 NIGHT", icon: "night"},
              {pos: "ml", text: "@maya"},
              {pos: "br", tone: "dark", text: "Built on Midnight", icon: "midnight"},
            ]}
          >
            <HomeScreen />
          </Stage>
        </div>
      </header>

      {/* Story scenes (desktop) */}
      <div id="story" ref={scenesRef} className="hs-scenes">
        {SCENES.map((s, i) => (
          <SceneBlock key={s.n} s={s} index={i} onActive={setActive} />
        ))}
      </div>

      {/* Tiles (mobile / tablet) */}
      <section className="hs-tiles" aria-label="What Hushh does">
        <div className="hs-wrap hs-tiles-grid">
          {TILES.map((t, i) => (
            <motion.article
              key={t.kicker}
              className={`hs-tile hs-tile-${t.tone}`}
              initial={{opacity: 0, y: 40, scale: 0.97}}
              whileInView={{opacity: 1, y: 0, scale: 1}}
              whileTap={{scale: 0.985}}
              viewport={{once: true, amount: 0.25}}
              transition={{y: {type: "spring", stiffness: 110, damping: 20}, opacity: {duration: 0.6}, scale: {duration: 0.7, ease: EASE}, delay: (i % 2) * 0.1}}
            >
              <span className="hs-tile-kicker">{t.kicker}</span>
              <h2>{t.title}</h2>
              {t.view}
              <p>{t.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Closing claim */}
      <motion.section
        ref={claimRef}
        className="hs-claim"
        style={{scale: claimScale, borderTopLeftRadius: claimRadius, borderTopRightRadius: claimRadius, transformOrigin: "50% 0%"}}
      >
        <motion.div className="hs-claim-ring" aria-hidden style={{rotate: ringRotate, y: ringY}}>
          <MidnightMark width="100%" height="100%" />
        </motion.div>
        <motion.div
          className="hs-wrap hs-claim-inner"
          initial="hidden"
          animate={claimHeadIn ? "show" : "hidden"}
        >
          <h2>
            <Words text="Your" />{" "}
            <span className="hs-accent">
              <Words text=".night" start={1} />
            </span>{" "}
            <Words text="is waiting." start={2} />
          </h2>
          <motion.p variants={{hidden: {opacity: 0, y: 12}, show: {opacity: 0.65, y: 0, transition: {delay: 0.4, duration: 0.7, ease: EASE}}}}>
            Claim it with a passkey. Get paid in a minute.
          </motion.p>
          <motion.div
            style={{display: "flex", justifyContent: "center", width: "100%"}}
            variants={{hidden: {opacity: 0, y: 16}, show: {opacity: 1, y: 0, transition: {delay: 0.5, duration: 0.8, ease: EASE}}}}
          >
            <ClaimForm />
          </motion.div>
          <motion.div variants={{hidden: {opacity: 0}, show: {opacity: 1, transition: {delay: 0.65, duration: 0.6}}}}>
            <Link href="/scratch" className="hs-claim-alt">
              Just want to gift someone? Make a scratch card →
            </Link>
          </motion.div>
          <motion.ul
            className="hs-facts"
            variants={{hidden: {}, show: {transition: {staggerChildren: 0.09, delayChildren: 0.75}}}}
          >
            {[
              ["0", "seed phrases"],
              ["0", "names inside a tip"],
              ["ZK", "claims on Midnight"],
            ].map(([b, t]) => (
              <motion.li
                key={t}
                variants={{hidden: {opacity: 0, y: 12, scale: 0.9}, show: {opacity: 1, y: 0, scale: 1, transition: {type: "spring", stiffness: 220, damping: 18}}}}
              >
                <b>{b}</b> {t}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="hs-footer">
        <div className="hs-wrap hs-footer-grid">
          <div className="hs-footer-brand">
            <Link href="/" className="inline-flex items-center gap-2.5" style={{color: "inherit", textDecoration: "none"}}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logomark.png" alt="" className="h-8 w-8 rounded-[10px] ring-1 ring-white/10" />
              <span className="text-lg font-extrabold tracking-[-0.03em]">Hushh Protocol</span>
            </Link>
            <p>send silently. · private payments on Midnight</p>
            <a href="https://midnight.network" target="_blank" rel="noopener noreferrer" className="hs-mn-foot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/midnight-logo.png" alt="" width={22} height={22} />
              Built on Midnight
            </a>
            <div className="mt-2 flex gap-3">
              <a
                href="https://x.com/hushhprotocol"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Hushh on X"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                <XBrandIcon width={18} height={18} />
              </a>
              <a
                href="https://github.com/Kali-Decoder/Hush-"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Source on GitHub"
                className="opacity-70 transition-opacity hover:opacity-100"
              >
                <GithubIcon width={18} height={18} />
              </a>
            </div>
          </div>
          <nav aria-label="Product">
            <b>Product</b>
            <Link href="/send">Send</Link>
            <Link href="/scratch">Scratch cards</Link>
            <Link href="/inbox">Inbox</Link>
            <Link href="/lookout">Lookout</Link>
          </nav>
          <nav aria-label="Account">
            <b>Account</b>
            <Link href="/register">Claim a name</Link>
            <Link href="/account">Your account</Link>
            <Link href="/passport">Passport</Link>
          </nav>
          <nav aria-label="Protocol">
            <b>Protocol</b>
            <Link href="/protocol">How it works</Link>
            <a href="/whitepaper.html" target="_blank" rel="noopener noreferrer">
              Whitepaper
            </a>
            <Link href="/privacy">Privacy, plainly</Link>
          </nav>
          <nav aria-label="Build">
            <b>Build</b>
            <Link href="/deploy">Deploy contracts</Link>
            <a href="https://midnight.network" target="_blank" rel="noopener noreferrer">
              Midnight
            </a>
          </nav>
        </div>
        <div className="hs-wrap hs-footer-fine">
          <span>© {new Date().getFullYear()} Hushh Protocol</span>
          <span>Prototype on Midnight test networks. Unaudited. Test NIGHT has no real-world value.</span>
        </div>
      </footer>
    </div>
  );
}
