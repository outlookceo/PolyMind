import type { Scenario } from "@/lib/mock-data";

export function ScenarioGrid({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <section id="scenarios" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-9 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/70">
          Use cases
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white">
          One space, many thinking rituals.
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {scenarios.map((scenario) => (
          <div
            className="rounded-lg border border-white/10 bg-[#11141B]/74 p-4 transition hover:border-cyan-200/22 hover:bg-white/[0.06]"
            key={scenario.title}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/[0.07] text-cyan-100">
                <scenario.icon className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{scenario.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{scenario.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
