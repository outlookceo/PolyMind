import { Brand } from "@/components/shared/brand";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center lg:px-8">
        <Brand />
        <p>Static UI prototype. No database, no real AI API calls.</p>
      </div>
    </footer>
  );
}
