import { Quote } from "lucide-react";

import { AgentAvatar } from "@/components/shared/agent-avatar";
import { Badge } from "@/components/ui/badge";
import { agents } from "@/lib/mock-data";

const example = [
  {
    agent: agents[0],
    intent: "Complement",
    text: "把首次体验设计成一次被组织好的思考，而不是让用户先学习复杂配置。"
  },
  {
    agent: agents[1],
    intent: "Challenge",
    text: "如果没有轮次和引用，多个 AI 只会制造更多文本噪声。"
  },
  {
    agent: agents[2],
    intent: "Converge",
    text: "界面应持续显示目标、发言者、轮次和总结草稿，帮助讨论自然收敛。"
  }
];

export function ExampleDiscussion() {
  return (
    <section id="example" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-200/70">
            Example flow
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white">
            Watch perspectives become a decision.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            示例讨论不是普通消息堆叠，而是让每个 AI 带着明确意图进入同一条思考链。
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-glow">
          <div className="mb-4 flex items-center justify-between">
            <Badge variant="cyan">Round 1</Badge>
            <span className="text-xs text-slate-500">mock stream</span>
          </div>
          <div className="space-y-3">
            {example.map((item) => (
              <div
                className="rounded-lg border border-white/10 bg-[#11141B]/88 p-4"
                key={item.intent}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AgentAvatar avatar={item.agent.avatar} color={item.agent.color} />
                    <div>
                      <div className="text-sm font-medium text-white">{item.agent.name}</div>
                      <div className="text-xs text-slate-400">{item.agent.role}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{item.intent}</Badge>
                </div>
                <div className="mt-4 flex gap-3 text-sm leading-7 text-slate-300">
                  <Quote className="mt-1 size-4 shrink-0 text-cyan-200/70" />
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
