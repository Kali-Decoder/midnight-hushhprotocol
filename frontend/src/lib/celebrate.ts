import confetti from "canvas-confetti";

/** Brand-aligned colors for claim celebration. */
const COLORS = ["#0a0a0a", "#00a676", "#e8b54a", "#f7f6f3", "#2F6FED"];

/**
 * Fire a short confetti celebration when a Twitter username is claimed.
 * No-ops on the server / when reduced motion is preferred.
 */
export function celebrateUsernameClaim() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const defaults = {
    colors: COLORS,
    disableForReducedMotion: true,
    zIndex: 200,
  };

  // Dual side cannons
  void confetti({
    ...defaults,
    particleCount: 70,
    spread: 58,
    startVelocity: 42,
    origin: {x: 0.12, y: 0.72},
    angle: 60,
  });
  void confetti({
    ...defaults,
    particleCount: 70,
    spread: 58,
    startVelocity: 42,
    origin: {x: 0.88, y: 0.72},
    angle: 120,
  });

  // Center burst a beat later
  window.setTimeout(() => {
    void confetti({
      ...defaults,
      particleCount: 90,
      spread: 100,
      startVelocity: 36,
      scalar: 0.95,
      origin: {x: 0.5, y: 0.45},
    });
  }, 160);

  // Soft trailing sparkle
  window.setTimeout(() => {
    void confetti({
      ...defaults,
      particleCount: 40,
      spread: 70,
      startVelocity: 22,
      gravity: 1.1,
      ticks: 180,
      origin: {x: 0.5, y: 0.35},
    });
  }, 420);
}

/**
 * Bigger celebration when an X handle becomes the user's Midnight ID
 * (name claimed and X linked on-chain): side cannons of X and sparkle
 * glyphs, then a centre burst and a slow sparkle fall.
 */
export function celebrateXLinked() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let glyphs: confetti.Shape[] = [];
  try {
    glyphs = [
      confetti.shapeFromText({text: "𝕏", scalar: 2.2, color: "#0a0a0a"}),
      confetti.shapeFromText({text: "✦", scalar: 2, color: "#2F6FED"}),
      confetti.shapeFromText({text: "☾", scalar: 2, color: "#e8b54a"}),
    ];
  } catch {
    // Canvas text shapes unavailable (old browser): plain confetti only.
  }
  const shapes: confetti.Shape[] = glyphs.length ? [...glyphs, "circle", "square"] : ["circle", "square"];
  const base = {colors: COLORS, disableForReducedMotion: true, zIndex: 200};

  // Two waves of side cannons.
  for (const delay of [0, 260]) {
    window.setTimeout(() => {
      void confetti({...base, shapes, scalar: 1.6, particleCount: 26, spread: 62, startVelocity: 48, angle: 60, origin: {x: 0.08, y: 0.75}});
      void confetti({...base, shapes, scalar: 1.6, particleCount: 26, spread: 62, startVelocity: 48, angle: 120, origin: {x: 0.92, y: 0.75}});
    }, delay);
  }

  window.setTimeout(() => {
    void confetti({...base, particleCount: 110, spread: 110, startVelocity: 38, origin: {x: 0.5, y: 0.42}});
  }, 180);

  window.setTimeout(() => {
    void confetti({...base, shapes: glyphs.length ? glyphs : ["circle"], scalar: 1.8, particleCount: 18, spread: 160, startVelocity: 18, gravity: 0.55, drift: 0.2, ticks: 320, origin: {x: 0.5, y: 0.25}});
  }, 620);
}
