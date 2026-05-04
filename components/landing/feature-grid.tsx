import type { LucideIcon } from "lucide-react";

export function FeatureGrid({
  features
}: {
  features: { title: string; description: string; icon: LucideIcon }[];
}) {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/70">
            Core surface
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white">
            Designed for visible thinking.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-400">
          PolyMind 把智能体配置、讨论过程和总结收敛放在同一个清晰空间里。
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            className="group rounded-lg border border-white/10 bg-white/[0.045] p-5 transition duration-200 hover:-translate-y-1 hover:border-white/18 hover:bg-white/[0.065]"
            key={feature.title}
          >
            <div className="flex size-10 items-center justify-center rounded-md border border-cyan-200/16 bg-cyan-300/10 text-cyan-100">
              <feature.icon className="size-4" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
