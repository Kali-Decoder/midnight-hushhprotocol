/** One consistent click for every control. */
const SOUND_URL = "/sounds/logitech-g203-click.mp3";

const VOLUME = 0.55;

let primed = false;

/** Warm the audio pipeline after the first user gesture. */
export function primeClickSounds() {
  if (typeof window === "undefined" || primed) return;
  primed = true;
  const a = new Audio(SOUND_URL);
  a.preload = "auto";
  a.volume = 0;
  void a.play().then(
    () => {
      a.pause();
      a.currentTime = 0;
    },
    () => {}
  );
}

/** Play the click sample (overlaps safely). */
export function playClick() {
  if (typeof window === "undefined") return;
  primeClickSounds();
  const audio = new Audio(SOUND_URL);
  audio.volume = VOLUME;
  void audio.play().catch(() => {});
}

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  '[role="button"]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  "summary",
  "[data-click-sound]",
].join(",");

function isSoundTarget(node: EventTarget | null): boolean {
  if (!(node instanceof Element)) return false;
  const el = node.closest(INTERACTIVE_SELECTOR);
  if (!el) return false;
  if (el.hasAttribute("data-no-click-sound")) return false;
  if (el.getAttribute("aria-disabled") === "true") return false;
  if (el instanceof HTMLButtonElement && el.disabled) return false;
  if (el instanceof HTMLInputElement && el.disabled) return false;
  if (el instanceof HTMLAnchorElement && el.hasAttribute("aria-disabled")) {
    return false;
  }
  return true;
}

/** Attach capture listeners so every interactive control clicks. */
export function attachGlobalClickSounds(): () => void {
  if (typeof document === "undefined") return () => {};

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    if (!isSoundTarget(e.target)) return;
    playClick();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (!isSoundTarget(e.target)) return;
    playClick();
  };

  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("keydown", onKeyDown, true);
  return () => {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeyDown, true);
  };
}
