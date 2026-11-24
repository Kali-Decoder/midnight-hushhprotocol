"use client";

import {type ReactNode, useEffect} from "react";
import {AppLoader} from "@/components/AppLoader";
import {ToastHost} from "@/components/ToastHost";
import {PrivyAppProvider} from "@/providers/PrivyAppProvider";
import {boot} from "@/lib/midnight/store";

/** App-wide providers: Privy (X sign-in only) + the Midnight store. */
export function MidnightProvider({children}: {children: ReactNode}) {
  useEffect(() => boot(), []);
  return (
    <PrivyAppProvider>
      <AppLoader />
      {children}
      <ToastHost />
    </PrivyAppProvider>
  );
}
