import { AppNav } from "@/components/shared/app-nav";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen aurora-bg">
      <AppNav />
      <main className={cn("mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/70">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-balance text-3xl font-semibold tracking-normal text-white sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
