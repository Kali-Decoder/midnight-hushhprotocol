// Session helpers. The passport (keys + .night record) lives in the Midnight
// store; this module only maps it onto the UI's PublicUser shape.

import type {PublicUser} from "@/shared";

export const SESSION_EVENT = "hush:session";

export function walletsMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export type {PublicUser};
