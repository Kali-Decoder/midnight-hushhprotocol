"use client";

import {useEffect} from "react";
import {attachGlobalClickSounds} from "@/lib/clickSound";

/** Plays one mouse-click sound on buttons, links, and amount controls. */
export function ClickSoundProvider() {
  useEffect(() => attachGlobalClickSounds(), []);
  return null;
}
