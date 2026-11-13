"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SideNav({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Section" className="border-b border-gray-200 bg-white md:border-b-0 md:border-r">
      <ul className="flex gap-1 overflow-x-auto px-3 py-3 md:grid md:px-3 md:py-6">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap px-3 py-2 text-[15px] no-underline ${
                  active ? "bg-brand-100 text-brand-900" : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
