"use client";

import { motion } from "framer-motion";
import { ProjectBlockData } from "@/lib/profile-types";

interface Props {
  data: ProjectBlockData;
  accentColor: string;
}

export function ProjectBlock({ data, accentColor }: Props) {
  const title = data.title || "Proyecto";
  const description = data.description || "Descripción del proyecto";
  const link = data.link || "#";
  const metrics = data.metrics || "";
  const imageUrl = data.imageUrl;
  const stack = data.stack || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bento-block block-project h-full"
    >
      <div className="project-preview">
        {link !== "#" ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
            {imageUrl ? (
              <img
                src={imageUrl}
                className="w-full h-full object-cover opacity-80 transition-opacity hover:opacity-100"
                alt={title}
              />
            ) : (
              <div className="project-preview-code group-hover:bg-black/40 transition-colors">
                <div><span className="kw" style={{ color: accentColor }}>import</span> {'{ Project }'} <span className="kw" style={{ color: accentColor }}>from</span> <span className="str">&apos;huevsite&apos;</span></div>
                <div>&nbsp;</div>
                <div><span className="kw" style={{ color: accentColor }}>const</span> <span className="fn" style={{ color: '#4D9FFF' }}>{title.replace(/\s+/g, '')}</span> = () <span className="kw" style={{ color: accentColor }}>=&gt;</span> (</div>
                <div>&nbsp; &lt;<span className="fn" style={{ color: '#4D9FFF' }}>Showcase</span> /&gt;</div>
                <div>)</div>
              </div>
            )}
          </a>
        ) : (
          imageUrl ? (
            <img
              src={imageUrl}
              className="w-full h-full object-cover opacity-80"
              alt={title}
            />
          ) : (
            <div className="project-preview-code">
              <div><span className="kw" style={{ color: accentColor }}>import</span> {'{ Project }'} <span className="kw" style={{ color: accentColor }}>from</span> <span className="str">&apos;huevsite&apos;</span></div>
              <div>&nbsp;</div>
              <div><span className="kw" style={{ color: accentColor }}>const</span> <span className="fn" style={{ color: '#4D9FFF' }}>{title.replace(/\s+/g, '')}</span> = () <span className="kw" style={{ color: accentColor }}>=&gt;</span> (</div>
              <div>&nbsp; &lt;<span className="fn" style={{ color: '#4D9FFF' }}>Showcase</span> /&gt;</div>
              <div>)</div>
            </div>
          )
        )}
      </div>

      <div className="project-info">
        <div className="project-name">{title}</div>
        <div className="project-desc">{description}</div>
        {stack.length > 0 && (
          <div className="building-stack mt-2">
            {stack.map((tech, i) => (
              <span key={`${tech}-${i}`} className="stack-pill">{tech}</span>
            ))}
          </div>
        )}
        <div className="project-footer">
          {metrics && (
            <div className="project-metrics">
              {metrics.split(',').map((m, i) => (
                <span key={i} className="pm">{m.trim()}</span>
              ))}
            </div>
          )}
          {link !== "#" && (
            <a 
              className="link-btn" 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ 
                color: accentColor, 
                borderColor: `${accentColor}40`,
                '--hover-bg': accentColor 
              } as any}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = accentColor;
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = accentColor;
              }}
            >
              ver demo →
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
