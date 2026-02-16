import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { initRLCanvas } from "./RLCanvas";
import { initLLMCanvas } from "./LLMCanvas";

interface TileConfig {
  id: string;
  title: string;
  subtitle: string;
  diagramSrc: string;
}

const tiles: TileConfig[] = [
  {
    id: "reinforcement-learning",
    title: "Reinforcement Learning",
    subtitle: "Agent pathfinding & policy optimization",
    diagramSrc: "/diagrams/rl-architecture.svg",
  },
  {
    id: "llm-inference",
    title: "LLM Inference",
    subtitle: "High-throughput token generation",
    diagramSrc: "/diagrams/llm-pipeline.svg",
  },
];

// MDX content rendered as simple placeholder text for now
const tileContent: Record<string, string[]> = {
  "reinforcement-learning": [
    "Reinforcement learning trains agents to make sequential decisions by maximizing cumulative reward through interaction with an environment.",
    "Key concepts include Markov Decision Processes, value functions, policy gradients, and temporal difference learning. Modern approaches like PPO and SAC have made RL practical for real-world applications.",
    "The animation on this tile shows a simple agent navigating a grid world — one of the most fundamental RL environments. The agent learns to find a path to the goal through exploration and exploitation.",
  ],
  "llm-inference": [
    "Large Language Model inference involves generating text token-by-token through autoregressive decoding, where each new token depends on all previous tokens.",
    "Optimizing inference throughput requires techniques like KV-cache management, continuous batching, speculative decoding, and quantization. These optimizations can reduce latency by orders of magnitude.",
    "The animation shows tokens flowing through a transformer block — the core computational unit. Each token is contextualized by attending to all previous tokens in the sequence.",
  ],
};

function CanvasTile({
  tileId,
  onExpand,
}: {
  tileId: string;
  onExpand: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlRef = useRef<{ stop: () => void; start: () => void } | null>(
    null
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    const initFn =
      tileId === "reinforcement-learning" ? initRLCanvas : initLLMCanvas;
    const ctrl = initFn(canvasRef.current);
    controlRef.current = ctrl ?? null;
    return () => ctrl?.stop();
  }, [tileId]);

  const tile = tiles.find((t) => t.id === tileId)!;

  return (
    <motion.div
      layoutId={tileId}
      onClick={onExpand}
      className="relative cursor-pointer rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 overflow-hidden group hover:border-[var(--color-accent)]/30 transition-colors duration-300"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-56 md:h-64"
      />
      <div className="p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-[var(--color-accent)] transition-colors">
          {tile.title}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
          {tile.subtitle}
        </p>
      </div>
    </motion.div>
  );
}

function ExpandedTile({
  tileId,
  onClose,
}: {
  tileId: string;
  onClose: () => void;
}) {
  const tile = tiles.find((t) => t.id === tileId)!;
  const content = tileContent[tileId] || [];

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
          className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8 md:p-12"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            {tile.title}
          </h2>
          <p className="text-sm text-[var(--color-accent)] mb-8">
            {tile.subtitle}
          </p>

          <img
            src={tile.diagramSrc}
            alt={`${tile.title} architecture diagram`}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 mb-8 bg-white dark:bg-zinc-950 p-4"
          />

          <div className="space-y-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {content.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}

export function BentoGrid() {
  const [expandedTile, setExpandedTile] = useState<string | null>(null);

  const handleClose = useCallback(() => setExpandedTile(null), []);

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setExpandedTile(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {tiles.map((tile) => (
          <CanvasTile
            key={tile.id}
            tileId={tile.id}
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
