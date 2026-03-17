"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = "top",
  delay = 0.2
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setStyle({});
      return;
    }

    const updatePosition = () => {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      if (!tooltip || !trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportPadding = 12;
      const verticalOffset = 14;

      let nextStyle: React.CSSProperties = {};

      if (position === "top" || position === "bottom") {
        const centeredLeft = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        const clampedLeft = Math.min(
          Math.max(centeredLeft, viewportPadding),
          window.innerWidth - tooltipRect.width - viewportPadding
        );

        nextStyle.left = clampedLeft;

        const shouldFlipToBottom =
          position === "top" && triggerRect.top - tooltipRect.height - verticalOffset < viewportPadding;
        const shouldFlipToTop =
          position === "bottom" && triggerRect.bottom + tooltipRect.height + verticalOffset > window.innerHeight - viewportPadding;

        const effectivePosition =
          shouldFlipToBottom ? "bottom" : shouldFlipToTop ? "top" : position;

        nextStyle.top =
          effectivePosition === "top"
            ? triggerRect.top - tooltipRect.height - verticalOffset
            : triggerRect.bottom + verticalOffset;
      } else {
        const centeredTop = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        const clampedTop = Math.min(
          Math.max(centeredTop, viewportPadding),
          window.innerHeight - tooltipRect.height - viewportPadding
        );

        nextStyle.top = clampedTop;

        const shouldFlipToRight =
          position === "left" && triggerRect.left - tooltipRect.width - verticalOffset < viewportPadding;
        const shouldFlipToLeft =
          position === "right" && triggerRect.right + tooltipRect.width + verticalOffset > window.innerWidth - viewportPadding;

        const effectivePosition =
          shouldFlipToRight ? "right" : shouldFlipToLeft ? "left" : position;

        nextStyle.left =
          effectivePosition === "left"
            ? triggerRect.left - tooltipRect.width - verticalOffset
            : triggerRect.right + verticalOffset;
      }

      setStyle(nextStyle);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isVisible, position]);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <div 
      ref={triggerRef}
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      onTouchStart={() => setIsVisible((current) => !current)}
    >
      {children}
      {mounted && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              ref={tooltipRef}
              initial={{ opacity: 0, scale: 0.96, y: position === "bottom" ? -6 : 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: position === "bottom" ? -4 : 4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none fixed z-[140] w-max max-w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/10 bg-[#09090b]/95 px-3.5 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
              style={style}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="mb-1 text-[9px] font-black uppercase tracking-[0.28em] text-white/35">
                Insight
              </div>
              <div className="text-left text-[11px] font-medium leading-relaxed text-white/86 whitespace-normal">
                {typeof content === "string" ? <p>{content}</p> : content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
