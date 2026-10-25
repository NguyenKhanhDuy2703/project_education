import React from 'react';
import type { AutomationBlockDefinition, BlockCategory } from '@/types/lab.types';
import { Compass, Crosshair, MousePointer, ShieldCheck, Database, Plus } from 'lucide-react';

interface BlockPaletteProps {
  allowedBlocks: AutomationBlockDefinition[];
  onAddBlock: (blockType: string) => void;
  disabled?: boolean;
}

const CATEGORY_CONFIG: Record<
  BlockCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  navigation: { label: 'Navigation', icon: Compass, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  locator: { label: 'Locator', icon: Crosshair, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  action: { label: 'Action', icon: MousePointer, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  assertion: { label: 'Assertion', icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  data: { label: 'Data', icon: Database, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
};

export const BlockPalette: React.FC<BlockPaletteProps> = ({ allowedBlocks, onAddBlock, disabled = false }) => {
  const categories: BlockCategory[] = ['navigation', 'locator', 'action', 'assertion', 'data'];

  return (
    <div className="flex flex-col h-full bg-card border-r border-border overflow-y-auto select-none" role="region" aria-label="Block Syntax Palette">
      <div className="p-3 border-b border-border bg-muted/40">
        <h3 className="text-xs font-bold text-foreground tracking-wide uppercase">Syntax Palette</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Click or press Enter to append step</p>
      </div>

      <div className="p-2 space-y-4">
        {categories.map((cat) => {
          const blocks = allowedBlocks.filter((b) => b.category === cat);
          if (blocks.length === 0) return null;
          const config = CATEGORY_CONFIG[cat];
          const Icon = config.icon;

          return (
            <div key={cat} className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-1">
                <Icon className={`size-3.5 ${config.color.split(' ')[0]}`} />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">{config.label}</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {blocks.map((block) => (
                  <button
                    key={block.blockType}
                    type="button"
                    disabled={disabled}
                    onClick={() => onAddBlock(block.blockType)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onAddBlock(block.blockType);
                      }
                    }}
                    aria-label={`Add ${block.name} block`}
                    className="min-h-[44px] w-full text-left p-2 rounded-md border border-border bg-background hover:bg-accent hover:border-primary/50 transition-colors flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-medium text-foreground truncate">{block.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{block.description}</div>
                    </div>
                    <div className="size-6 shrink-0 rounded bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Plus className="size-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
