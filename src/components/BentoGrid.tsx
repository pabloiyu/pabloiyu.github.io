import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { initRLCanvas } from "./RLCanvas";
import { initLLMCanvas } from "./LLMCanvas";
import { initParallelismCanvas } from "./ParallelismCanvas";

interface DiagramEntry {
  src: string;
  alt: string;
  area: string;
}

interface TileConfig {
  id: string;
  title: string;
  canvas: "rl" | "llm" | "parallelism";
  diagrams: DiagramEntry[];
  gridTemplate: {
    areas: string;
    columns: string;
    rows: string;
  };
  content: string[];
}

const canvasInitMap = {
  rl: initRLCanvas,
  llm: initLLMCanvas,
  parallelism: initParallelismCanvas,
} as const;

const tiles: TileConfig[] = [
  {
    id: "reinforcement-learning",
    title: "Reinforcement Learning",
    canvas: "rl",
    diagrams: [
      { src: "/diagrams/rl-architecture.svg", alt: "Agent-environment interaction loop", area: "loop" },
      { src: "/diagrams/rl-value-heatmap.svg", alt: "Value function heatmap", area: "value" },
      { src: "/diagrams/rl-policy-update.svg", alt: "Policy gradient update steps", area: "policy" },
    ],
    gridTemplate: {
      areas: `
        "loop   loop   policy"
        "text-0 text-0 policy"
        "value  text-1 text-1"
        "value  text-2 text-2"
      `,
      columns: "1fr 1fr 1fr",
      rows: "auto auto auto auto",
    },
    content: [
      "Reinforcement learning trains agents to make sequential decisions by maximizing cumulative reward through interaction with an environment.",
      "Key concepts include Markov Decision Processes, value functions, policy gradients, and temporal difference learning. Modern approaches like PPO and SAC have made RL practical for real-world applications.",
      "The agent-environment loop is the core abstraction: at each step the agent observes state, takes an action, and receives a reward signal that shapes future behaviour.",
    ],
  },
  {
    id: "llm-inference",
    title: "LLM Inference",
    canvas: "llm",
    diagrams: [
      { src: "/diagrams/llm-pipeline.svg", alt: "Transformer inference pipeline", area: "pipe" },
      { src: "/diagrams/llm-attention.svg", alt: "Causal attention matrix", area: "attn" },
      { src: "/diagrams/llm-kv-cache.svg", alt: "KV cache mechanism", area: "kv" },
    ],
    gridTemplate: {
      areas: `
        "pipe  pipe  pipe"
        "text-0 text-0 text-0"
        "attn  text-1 kv"
        "attn  text-2 kv"
      `,
      columns: "1fr 1fr 1fr",
      rows: "auto auto auto auto",
    },
    content: [
      "Large Language Model inference generates text token-by-token through autoregressive decoding, where each new token depends on all previous tokens.",
      "Optimizing throughput requires KV-cache management, continuous batching, speculative decoding, and quantization — techniques that can reduce latency by orders of magnitude.",
      "The causal attention mask ensures each position only attends to earlier tokens, while the KV cache avoids redundant computation across decoding steps.",
    ],
  },
  {
    id: "parallelism",
    title: "Parallelism Strategies",
    canvas: "parallelism",
    diagrams: [
      { src: "/diagrams/tensor-parallelism.svg", alt: "Tensor parallelism column split", area: "tp" },
      { src: "/diagrams/pipeline-parallelism.svg", alt: "Pipeline parallelism stages", area: "pp" },
      { src: "/diagrams/data-parallelism.svg", alt: "Data parallelism with all-reduce", area: "dp" },
    ],
    gridTemplate: {
      areas: `
        "tp     tp     pp"
        "text-0 text-0 pp"
        "dp     text-1 text-1"
        "dp     text-2 text-2"
      `,
      columns: "1fr 1fr 1fr",
      rows: "auto auto auto auto",
    },
    content: [
      "Tensor parallelism splits individual weight matrices across GPUs, enabling layers too large for a single device. Each GPU computes a partial result, then an all-gather or all-reduce synchronises the output.",
      "Pipeline parallelism assigns consecutive layers to different GPUs. Micro-batching fills the pipeline to reduce the bubble — idle time where GPUs wait for activations from earlier stages.",
      "Data parallelism replicates the full model on every GPU and shards the batch. After each forward-backward pass, gradients are averaged via all-reduce so all replicas stay in sync.",
    ],
  },
];

/* ── Collapsed tile ──────────────────────────────────────────── */

function CanvasTile({
  tile,
  index,
  onExpand,
}: {
  tile: TileConfig;
  index: number;
  onExpand: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctrl = canvasInitMap[tile.canvas](canvasRef.current);
    return () => ctrl?.stop();
  }, [tile.canvas]);

  return (
    <motion.div
      layoutId={tile.id}
      onClick={onExpand}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.5, ease: "easeOut" }}
      className="relative cursor-pointer rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 overflow-hidden group hover:border-[var(--color-accent)]/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 transition-all duration-300"
    >
      <canvas ref={canvasRef} className="w-full h-48 md:h-56" />
      <div className="p-5">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--color-accent)] transition-colors">
          {tile.title}
        </h3>
      </div>
    </motion.div>
  );
}

/* ── Diagram card ────────────────────────────────────────────── */

function DiagramCard({ diagram, index }: { diagram: DiagramEntry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.08, duration: 0.4, ease: "easeOut" }}
      style={{ gridArea: diagram.area }}
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 md:p-4 overflow-hidden"
    >
      <img src={diagram.src} alt={diagram.alt} className="w-full h-full object-contain" />
    </motion.div>
  );
}

/* ── Expanded tile with mosaic grid ──────────────────────────── */

function ExpandedTile({ tileId, onClose }: { tileId: string; onClose: () => void }) {
  const tile = tiles.find((t) => t.id === tileId)!;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <motion.div
          layoutId={tileId}
          className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 md:p-10"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8"
          >
            {tile.title}
          </motion.h2>

          <div
            className="gap-4 md:gap-6"
            style={{
              display: "grid",
              gridTemplateAreas: tile.gridTemplate.areas,
              gridTemplateColumns: tile.gridTemplate.columns,
              gridTemplateRows: tile.gridTemplate.rows,
              alignItems: "start",
            }}
          >
            {tile.diagrams.map((d, i) => (
              <DiagramCard key={d.area} diagram={d} index={i} />
            ))}

            {tile.content.map((text, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                style={{ gridArea: `text-${i}` }}
                className="text-zinc-600 dark:text-zinc-400 leading-relaxed self-center px-1"
              >
                {text}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

/* ── Grid root ───────────────────────────────────────────────── */

export function BentoGrid() {
  const [expandedTile, setExpandedTile] = useState<string | null>(null);
  const handleClose = useCallback(() => setExpandedTile(null), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpandedTile(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section>
      <div className="h-px bg-zinc-800/60 mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiles.map((tile, i) => (
          <CanvasTile
            key={tile.id}
            tile={tile}
            index={i}
            onExpand={() => setExpandedTile(tile.id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {expandedTile && (
          <ExpandedTile tileId={expandedTile} onClose={handleClose} />
        )}
      </AnimatePresence>
    </section>
  );
}
