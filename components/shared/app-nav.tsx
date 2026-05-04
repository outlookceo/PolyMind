import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navLinks } from "@/lib/constants";
import { Brand } from "@/components/shared/brand";

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090B10]/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/[0.06] hover:text-white"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
            <Link href="/spaces">
              Explore
              <ArrowUpRight />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/spaces/new">
              <Plus />
              New space
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
