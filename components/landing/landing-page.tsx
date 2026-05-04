import { ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { features, scenarios } from "@/lib/mock-data";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { ThinkingSpaceVisual } from "@/components/landing/thinking-space-visual";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { ScenarioGrid } from "@/components/landing/scenario-grid";
import { ExampleDiscussion } from "@/components/landing/example-discussion";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#090B10] text-white">
      <div className="relative">
        <div className="absolute inset-0 aurora-bg" />
        <div className="absolute inset-0 fine-grid opacity-[0.35]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-300/10 to-transparent" />
        <div className="relative">
          <LandingNavbar />
          <main>
            <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-20">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-cyan-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
                  Multi AI discussion space
                </div>
                <h1 className="text-balance text-5xl font-semibold tracking-normal text-white sm:text-6xl lg:text-7xl">
                  Create a thinking space for multiple AIs.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  创建一个多 AI 智能体讨论空间，让不同模型以不同角色共同思考、辩论和总结。
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/spaces/new">
                      Start a space
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/spaces/launch-strategy">
                      <PlayCircle />
                      View live mock
                    </Link>
                  </Button>
                </div>
                <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                  {[
                    ["6", "AI personas"],
                    ["4", "discussion modes"],
                    ["0", "real API calls"]
                  ].map(([value, label]) => (
                    <div className="rounded-md border border-white/10 bg-white/[0.045] p-3" key={label}>
                      <div className="text-2xl font-semibold text-white">{value}</div>
                      <div className="mt-1 text-xs text-slate-400">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <ThinkingSpaceVisual />
            </section>
            <FeatureGrid features={features} />
            <ScenarioGrid scenarios={scenarios} />
            <ExampleDiscussion />
            <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-8 shadow-glow sm:p-10">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/40 to-transparent" />
                <h2 className="max-w-2xl text-3xl font-semibold tracking-normal text-white">
                  Build the discussion before you build the answer.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                  用多个智能体先暴露假设、分歧和证据边界，再生成可以执行的结论。
                </p>
                <Button asChild className="mt-7">
                  <Link href="/dashboard">
                    Open dashboard
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </section>
          </main>
          <LandingFooter />
        </div>
      </div>
    </div>
  );
}
