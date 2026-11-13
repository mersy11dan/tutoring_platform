import Link from "next/link";

export function PathMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M4 24C10 24 10 14 16 14C22 14 22 8 28 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-brand-900 no-underline" translate="no">
      <PathMark />
      <span className="font-display text-[1.65rem] leading-none tracking-[-0.03em]">MathPath</span>
    </Link>
  );
}
