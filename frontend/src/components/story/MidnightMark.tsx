import type {SVGProps} from "react";

/**
 * Midnight mark (ring + three dots), drawn from /midnight-logo.png so it
 * can inherit currentColor at any size. Use the PNG for tile badges.
 */
export function MidnightMark({title, ...props}: SVGProps<SVGSVGElement> & {title?: string}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="8.6" stroke="currentColor" strokeWidth="1.9" />
      <rect x="11.15" y="5.9" width="1.7" height="1.7" rx="0.3" fill="currentColor" />
      <rect x="11.15" y="8.55" width="1.7" height="1.7" rx="0.3" fill="currentColor" />
      <rect x="11.15" y="11.2" width="1.7" height="1.7" rx="0.3" fill="currentColor" />
    </svg>
  );
}

/** NIGHT token glyph: the Midnight mark on a dark coin. */
export function NightCoin({size = 16}: {size?: number}) {
  return (
    <span className="hs-coin" style={{width: size, height: size}} aria-hidden>
      <MidnightMark width={size * 0.78} height={size * 0.78} />
    </span>
  );
}
