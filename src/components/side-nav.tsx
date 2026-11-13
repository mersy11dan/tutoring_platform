"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isCurrent(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav({
  items,
  label,
}: {
  items: { href: string; label: string; exact?: boolean }[];
  label: string;
}) {
  const pathname = usePathname();
  const current = items.find((item) => isCurrent(pathname, item.href, item.exact));

  function list() {
    return (
      <ul className="grid">
        {items.map((item) => {
          const active = isCurrent(pathname, item.href, item.exact);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className="nav-link">
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <nav aria-label={label} className="border-b border-gray-200 bg-white md:border-b-0 md:border-r">
      <details className="nav-disclosure md:hidden">
        <summary>
          Menu
          {current ? <span className="ml-2 font-normal text-gray-700">{current.label}</span> : null}
        </summary>
        {list()}
      </details>
      <div className="hidden px-2 py-4 md:block">{list()}</div>
    </nav>
  );
}
