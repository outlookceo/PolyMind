import Link from "next/link";

import { Brand } from "@/components/shared/brand";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#features", label: "Features" },
  { href: "#scenarios", label: "Scenarios" },
  { href: "#example", label: "Example" }
];

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090B10]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              className="rounded-md px-3 py-2 text-sm text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/spaces/new">New space</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
