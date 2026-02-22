"use client";

import { motion } from "framer-motion";
import { BuildingBlockData } from "@/lib/profile-types";

interface Props {
  data: BuildingBlockData;
  accentColor: string;
}

export function BuildingBlock({ data, accentColor }: Props) {
  const project = data.project || "Proyecto sin nombre";
  const description = data.description || "Descripción pendiente";
  const stack = data.stack || [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-block block-building h-full"
      style={{ '--accent': accentColor, borderColor: `${accentColor}40` } as any}
    >
      <div className="block-label">
        <span className="blinker" style={{ backgroundColor: accentColor }}></span>
        Currently building
      </div>
      <div className="building-name" style={{ color: accentColor }}>{project}</div>
      <div className="building-desc">{description}</div>
      {stack.length > 0 && (
        <div className="building-stack">
          {stack.map((tech, i) => (
            <span key={`${tech}-${i}`} className="stack-pill">
              {tech}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
