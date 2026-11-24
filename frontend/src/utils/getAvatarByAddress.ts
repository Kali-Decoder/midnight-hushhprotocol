import {avatarBgColors, avatars, type AvatarChoice} from "@/data/avatarConstants";
import {getRandomAvatar} from "@/utils/getRandomAvatar";

/** Stable 64-hex digest of any identifier (Midnight bech32 address, tip key…). */
function hexDigest(input: string): string {
  if (/^0x[0-9a-f]{8,}$/i.test(input)) return input.slice(2);
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0"));
}

/**
 * Deterministic avatar for a wallet address or key.
 * First 4 hex → background color, last 4 hex → character.
 */
export function getAvatarByAddress(address?: string | null): AvatarChoice {
  if (!address) return getRandomAvatar();

  const trimmed = hexDigest(address.trim().toLowerCase());
  const firstDecimal = parseInt(trimmed.slice(0, 4), 16);
  const lastDecimal = parseInt(trimmed.slice(-4), 16);
  const max = 0xffff;

  const bgColorIndex = Math.min(
    avatarBgColors.length - 1,
    Math.floor((firstDecimal / max) * avatarBgColors.length)
  );
  const avatarIndex = Math.min(
    avatars.length - 1,
    Math.floor((lastDecimal / max) * avatars.length)
  );

  const bgColor = avatarBgColors[bgColorIndex]!;
  const avatar = avatars[avatarIndex]!;

  return {avatarImage: avatar.url, bgColor, name: avatar.name};
}

export default getAvatarByAddress;
