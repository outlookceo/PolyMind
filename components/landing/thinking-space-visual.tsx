"use client";

import { motion } from "framer-motion";
import { ArrowRight, BrainCircuit, MessageSquareText, Sparkles } from "lucide-react";

import { AgentAvatar } from "@/components/shared/agent-avatar";
import { Badge } from "@/components/ui/badge";
import { agents } from "@/lib/mock-data";

const visualAgents = agents.slice(0, 5);

const positions = [
  "left-[8%] top-[18%]",
  "right-[9%] top-[16%]",
  "left-[5%] bottom-[18%]",
  "right-[12%] bottom-[17%]",
  "left-1/2 top-[4%] -translate-x-1/2"
];

export function ThinkingSpaceVisual() {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto h-[560px] w-full max-w-[620px]"
      initial={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.035] shadow-glow backdrop-blur-xl" />
      <div className="absolute inset-5 rounded-md border border-white/8 fine-grid opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-cyan-200/15 bg-[#11141B]/90 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between">
          <Badge variant="cyan">Round 2 / 4</Badge>
          <Sparkles className="size-4 text-cyan-200" />
        </div>
        <h3 className="mt-4 text-lg font-semibold leading-6 text-white">
          How should PolyMind make multi-agent thinking visible?
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Each AI replies with a distinct intent: complement, challenge, clarify, or summarize.
        </p>
        <div className="mt-5 space-y-3">
          {["Strategy frame", "Risk check", "Implementation path"].map((item, index) => (
            <motion.div
              animate={{ x: [0, 4, 0] }}
              className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.055] px-3 py-2 text-xs text-slate-300"
              key={item}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                delay: index * 0.35,
                ease: "easeInOut"
              }}
            >
              <span>{item}</span>
              <ArrowRight className="size-3 text-cyan-200" />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="absolute left-[19%] top-[28%] h-px w-[160px] rotate-[22deg] bg-gradient-to-r from-transparent via-blue-300/40 to-transparent" />
      <div className="absolute right-[20%] top-[30%] h-px w-[150px] -rotate-[18deg] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      <div className="absolute bottom-[28%] left-[18%] h-px w-[170px] -rotate-[24deg] bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent" />
      <div className="absolute bottom-[29%] right-[20%] h-px w-[160px] rotate-[21deg] bg-gradient-to-r from-transparent via-rose-300/35 to-transparent" />
      {visualAgents.map((agent, index) => (
        <motion.div
          animate={{ y: [0, -6, 0] }}
          className={`absolute ${positions[index]}`}
          key={agent.id}
          transition={{
            duration: 4.4,
            repeat: Infinity,
            delay: index * 0.28,
            ease: "easeInOut"
          }}
        >
          <div className="group min-w-[168px] rounded-lg border border-white/10 bg-[#11141B]/88 p-3 shadow-panel backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/18">
            <div className="flex items-center gap-3">
              <AgentAvatar avatar={agent.avatar} color={agent.color} />
              <div>
                <div className="text-sm font-medium text-white">{agent.name}</div>
                <div className="text-xs text-slate-400">{agent.role}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <MessageSquareText className="size-3.5" />
              {index === 1 ? "challenging" : index === 4 ? "summarizing" : "thinking"}
            </div>
          </div>
        </motion.div>
      ))}
      <motion.div
        animate={{ offsetDistance: ["0%", "100%"] }}
        className="absolute left-[18%] top-[30%] size-1.5 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,1)]"
        style={{
          offsetPath: "path('M 0 0 C 90 30 200 80 285 160')"
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute bottom-7 left-7 right-7 rounded-lg border border-white/10 bg-black/20 p-3 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <BrainCircuit className="size-4 text-cyan-200" />
          Live mock discussion, no API calls in prototype
        </div>
      </div>
    </motion.div>
  );
}
