"use client"

import { motion } from "framer-motion"
import { HeroBlock } from "@/components/blocks/HeroBlock"
import { BuildingBlock } from "@/components/blocks/BuildingBlock"
import { GitHubBlock } from "@/components/blocks/GitHubBlock"
import { ProjectBlock } from "@/components/blocks/ProjectBlock"
import { MetricBlock, SocialBlock, CVBlock } from "@/components/blocks/Widgets"
import { StackBlock, CommunityBlock, WritingBlock } from "@/components/blocks/ExtraBlocks"
import type { BlockData } from "@/lib/profile-types"

interface ProfileGridProps {
  blocks: BlockData[]
  accentColor: string
}

export function ProfileGrid({ blocks, accentColor }: ProfileGridProps) {
  // Filtrar solo bloques visibles y ordenar
  const visibleBlocks = blocks
    .filter(block => block.visible)
    .sort((a, b) => a.order - b.order)

  // Mapear tipo de bloque a componente
  const renderBlock = (block: BlockData) => {
    // Los bloques vienen del profile-service con todas las propiedades esparcidas,
    // así que pasamos todo el bloque como data a los componentes
    const props = { data: block as any, accentColor }

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
