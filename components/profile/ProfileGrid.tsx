"use client"

import { motion } from "framer-motion"
import { HeroBlock } from "@/components/blocks/HeroBlock"
import { BuildingBlock } from "@/components/blocks/BuildingBlock"
import { GitHubBlock } from "@/components/blocks/GitHubBlock"
import { ProjectBlock } from "@/components/blocks/ProjectBlock"
import { MetricBlock, SocialBlock, CVBlock } from "@/components/blocks/Widgets"
import { StackBlock, CommunityBlock, WritingBlock } from "@/components/blocks/ExtraBlocks"
import { MediaBlock, CertificationBlock, AchievementBlock, CustomBlock } from "@/components/blocks/NewBlocks"
import type { BlockData } from "@/lib/profile-types"

interface ProfileGridProps {
  blocks: BlockData[]
  accentColor: string
  displayName?: string
  tagline?: string
}

export function ProfileGrid({ blocks, accentColor, displayName, tagline }: ProfileGridProps) {
  // Filtrar solo bloques visibles y ordenar
  const visibleBlocks = blocks
    .filter(block => block.visible)
    .sort((a, b) => a.order - b.order)

  const hasHero = visibleBlocks.some(b => b.type === 'hero');

  // Mapear tipo de bloque a componente
  const renderBlock = (block: BlockData) => {
    // Los bloques vienen del profile-service con todas las propiedades esparcidas,
    const props = { 
      data: block as any, 
      accentColor 
    }

    switch (block.type) {
      case "hero":
        return <HeroBlock {...props} />
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
      default:
        return null
    }
  }

  // Mapear col_span a clase CSS (aplicado solo en desktop/md+)
  const getColSpanClass = (colSpan: number) => {
    switch (colSpan) {
      case 2: return "md:col-span-2"
      case 3: return "md:col-span-3"
      case 4: return "md:col-span-4"
      default: return "md:col-span-1"
    }
  }

  // Mapear row_span a clase CSS (aplicado solo en desktop/md+)
  const getRowSpanClass = (rowSpan: number) => {
    switch (rowSpan) {
      case 2: return "md:row-span-2"
      case 3: return "md:row-span-3"
      default: return "md:row-span-1"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bento-grid"
    >
      {/* Fallback Header if no Hero block exists */}
      {!hasHero && displayName && (
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="md:col-span-2 md:row-span-1"
        >
           <div className="bento-block flex flex-col justify-center p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[2rem]">
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
          className={`${getColSpanClass(block.col_span)} ${getRowSpanClass(block.row_span)}`}
        >
          {renderBlock(block)}
        </motion.div>
      ))}

      {/* Empty state */}
      {visibleBlocks.length === 0 && (
        <div className="col-span-4 bento-block text-center p-12">
          <p className="text-muted-foreground">
            Este bloque está más vacío que el INDEC.
          </p>
        </div>
      )}
    </motion.div>
  )
}
