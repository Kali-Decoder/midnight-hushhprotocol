import type {ReactNode} from "react";
import {MidnightMark} from "@/components/story/MidnightMark";

/** Max width for phone-frame app screens (cards). */
export const APP_CHROME_WIDTH = "w-full max-w-3xl";

/** Island nav is intentionally wider than the screen cards. */
export const APP_NAV_WIDTH = "w-full max-w-4xl";

/**
 * Phone-screen shell, styled like the landing page phones: an ink header
 * band with the title, and a white sheet that curves up over it.
 * Full-bleed on mobile; framed card on larger screens.
 */
export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={`animate-fade mx-auto h-full ${APP_CHROME_WIDTH}`}>
      <div className="app-sheet flex min-h-[calc(100dvh-5rem)] flex-col overflow-hidden bg-white max-sm:rounded-t-[1.75rem] sm:min-h-[min(44rem,calc(100dvh-10rem))] sm:rounded-[2.25rem] sm:border sm:border-ink/[0.08]">
        <header className="relative shrink-0 overflow-hidden bg-ink px-5 pb-11 pt-6 text-left text-paper sm:px-8 sm:pb-12 sm:pt-8">
          {/* Soft signal glow, echoing the landing blobs */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-signal/20 blur-3xl"
          />
          <MidnightMark
            aria-hidden
            className="pointer-events-none absolute -bottom-16 right-6 h-48 w-48 text-paper/[0.05] sm:right-10"
          />

          <p className="relative mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/55">
            <MidnightMark className="h-3.5 w-3.5 text-signal" />
            <b className="font-semibold text-paper/85">Hushh</b>
            <span aria-hidden>·</span>
            on Midnight
          </p>
          <h1 className="relative text-[2rem] font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-[2.6rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="relative mt-3 max-w-prose text-[13.5px] leading-relaxed text-paper/65 sm:text-[15px]">
              {subtitle}
            </p>
          ) : null}
        </header>

        <div className="relative -mt-6 flex flex-1 flex-col rounded-t-[1.75rem] bg-white px-4 pb-5 pt-6 sm:rounded-t-[2rem] sm:px-7 sm:pt-7">
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>

          <div
            className="flex shrink-0 justify-center pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-5"
            aria-hidden
          >
            <span className="h-1 w-24 rounded-full bg-ink/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
