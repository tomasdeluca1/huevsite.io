"use client"

import { motion } from "framer-motion"
import { HeroBlock } from "@/components/blocks/HeroBlock"
import { BuildingBlock } from "@/components/blocks/BuildingBlock"
import { GitHubBlock } from "@/components/blocks/GitHubBlock"
import { ProjectBlock } from "@/components/blocks/ProjectBlock"
import { MetricBlock, SocialBlock, CVBlock } from "@/components/blocks/Widgets"
import { StackBlock, CommunityBlock, WritingBlock } from "@/components/blocks/ExtraBlocks"
import { MediaBlock, CertificationBlock, AchievementBlock, CustomBlock, CollabBlock } from "@/components/blocks/NewBlocks"
import type { BlockData } from "@/lib/profile-types"
import { trackClick } from "@/components/analytics/AnalyticsTracker"

interface ProfileGridProps {
  blocks: BlockData[]
  accentColor: string
  displayName?: string
  tagline?: string
  subscriptionTier?: "free" | "pro"
  userId?: string
  subSiteId?: string
  isWinner?: boolean
}

export function ProfileGrid({ blocks, accentColor, displayName, tagline, subscriptionTier, userId, subSiteId, isWinner = false }: ProfileGridProps) {
  // Filtrar solo bloques visibles y ordenar
  const visibleBlocks = blocks
    .filter(block => block.visible)
    .sort((a, b) => a.order - b.order)

  const hasHero = visibleBlocks.some(b => b.type === 'hero');
  
  const handleBlockClick = (blockId: string) => {
    if (userId) {
      trackClick(userId, blockId, subSiteId);
    }
  };

  // Mapear tipo de bloque a componente
  const renderBlock = (block: BlockData) => {
    // Los bloques vienen del profile-service con todas las propiedades esparcidas,
    const props = {
      data: block as any,
      accentColor
    }

    switch (block.type) {
      case "hero":
        return <HeroBlock {...props} subscriptionTier={subscriptionTier} isWinner={isWinner} />
      case "building":
        return <BuildingBlock {...props} />
      case "github":
        return <GitHubBlock {...props} />
      case "project":
        return <ProjectBlock {...props} />
      case "metric":
        return <MetricBlock {...props} />
      case "stack":
        return <StackBlock {...props} />
      case "social":
        return <SocialBlock {...props} />
      case "community":
        return <CommunityBlock {...props} />
      case "writing":
        return <WritingBlock {...props} />
      case "cv":
        return <CVBlock {...props} />
      case "media":
        return <MediaBlock {...props} />
      case "certification":
        return <CertificationBlock {...props} />
      case "achievement":
        return <AchievementBlock {...props} />
      case "custom":
        return <CustomBlock {...props} />
      case "collab":
        return <CollabBlock {...props} />
      default:
        return null
    }
  }

  const getGridClasses = (block: BlockData) => {
    const col = block.col_span || 1;
    const row = block.row_span || 1;
    return `col-span-${col} row-span-${row}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="huevsite-grid"
    >
      {/* Fallback Header if no Hero block exists */}
      {!hasHero && displayName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-2"
        >
          <div className="huevsite-block flex flex-col justify-center p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem]">
            <h1 className="text-3xl font-extrabold text-white mb-1">{displayName}</h1>
            <p className="text-sm text-[var(--text-dim)] font-mono">// {tagline || 'builder'}</p>
          </div>
        </motion.div>
      )}
      {visibleBlocks.map((block, index) => (
        <motion.div
          key={block.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.4 }}
          className={getGridClasses(block)}
          onClickCapture={() => handleBlockClick(block.id)}
        >
          {renderBlock(block)}
        </motion.div>
      ))}

      {/* Empty state */}
      {visibleBlocks.length === 0 && (
        <div className="col-span-4 huevsite-block text-center p-12">
          <p className="text-muted-foreground">
            Este bloque está más vacío que el INDEC.
          </p>
        </div>
      )}
    </motion.div>
  )
}
