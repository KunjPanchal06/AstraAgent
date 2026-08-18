// ════════════════════════════════════════════════════════════════
// FILE: components/agent/settings-dialog.jsx
// PURPOSE: Modal for adjusting agent configuration parameters
//          like reasoning depth and enabled features.
// EXPORTS: SettingsDialog
// DEPENDS ON: settings-store, lucide-react, ui/dialog
// ════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { Settings2, Zap, RefreshCw, CheckCircle2, Database, Network, RotateCcw, Download, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/lib/settings-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
export function SettingsDialog() {
  const {
    maxSteps,
    maxReplans,
    enableCritic,
    enableEpisodicRetrieval,
    enableFactExtraction,
    observationTruncate,
    hydrated,
    hydrate,
    update,
    reset
  } = useSettingsStore();
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  const exportSettings = () => {
    const settings = {
      maxSteps,
      maxReplans,
      enableCritic,
      enableEpisodicRetrieval,
      enableFactExtraction,
      observationTruncate,
      _exportedAt: new Date().toISOString(),
      _version: 1
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported', {
      description: 'Downloaded as JSON file.'
    });
  };
  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        update({
          maxSteps: typeof data.maxSteps === 'number' ? data.maxSteps : undefined,
          maxReplans: typeof data.maxReplans === 'number' ? data.maxReplans : undefined,
          enableCritic: typeof data.enableCritic === 'boolean' ? data.enableCritic : undefined,
          enableEpisodicRetrieval: typeof data.enableEpisodicRetrieval === 'boolean' ? data.enableEpisodicRetrieval : undefined,
          enableFactExtraction: typeof data.enableFactExtraction === 'boolean' ? data.enableFactExtraction : undefined,
          observationTruncate: typeof data.observationTruncate === 'number' ? data.observationTruncate : undefined
        });
        toast.success('Settings imported', {
          description: `Loaded from ${file.name}`
        });
      } catch {
        toast.error('Import failed', {
          description: 'Invalid settings file. Please select a valid JSON.'
        });
      }
    };
    input.click();
  };
  return <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg border border-border/60 bg-muted/40" title="Agent settings">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-[480px] gap-0 p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-emerald-500" />
            Agent Settings
          </DialogTitle>
        <DialogDescription className="sr-only">Configure agent behavior</DialogDescription>
          <p className="text-xs text-muted-foreground">
            Configure the agent&apos;s behavior. Applied to the next task run.
          </p>
        </DialogHeader>

        <div className="scroll-thin max-h-[60vh] overflow-y-auto px-5 py-4">
          {/* ReAct Loop */}
          <Section icon={Zap} label="ReAct Loop" color="text-amber-500" description="Controls for the reasoning-action loop">
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="text-xs">Max reasoning steps</Label>
                  <Badge variant="outline" className="tabular-nums text-[10px]">
                    {maxSteps}
                  </Badge>
                </div>
                <Slider value={[maxSteps]} min={3} max={12} step={1} onValueChange={([v]) => update({
                maxSteps: v
              })} className="py-1" />
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Maximum Thought→Action→Observation cycles per subtask
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="text-xs">Max replans</Label>
                  <Badge variant="outline" className="tabular-nums text-[10px]">
                    {maxReplans}
                  </Badge>
                </div>
                <Slider value={[maxReplans]} min={0} max={3} step={1} onValueChange={([v]) => update({
                maxReplans: v
              })} className="py-1" />
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  How many times the critic can reject &amp; replan (0 = no replanning)
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label className="text-xs">Observation truncation</Label>
                  <Badge variant="outline" className="tabular-nums text-[10px]">
                    {observationTruncate} chars
                  </Badge>
                </div>
                <Slider value={[observationTruncate]} min={500} max={4000} step={100} onValueChange={([v]) => update({
                observationTruncate: v
              })} className="py-1" />
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Tool outputs longer than this get truncated to save context
                </p>
              </div>
            </div>
          </Section>

          <div className="my-3 h-px bg-border/40" />

          {/* Orchestration */}
          <Section icon={RefreshCw} label="Orchestration" color="text-violet-500" description="LangGraph state machine phases">
            <div className="space-y-2.5">
              <ToggleRow icon={CheckCircle2} label="Critic evaluation" description="Evaluate the answer against the task; reject if incomplete" checked={enableCritic} onToggle={v => update({
              enableCritic: v
            })} />
            </div>
          </Section>

          <div className="my-3 h-px bg-border/40" />

          {/* Memory */}
          <Section icon={Database} label="Memory" color="text-cyan-500" description="Agent memory systems">
            <div className="space-y-2.5">
              <ToggleRow icon={Database} label="Episodic retrieval" description="Retrieve similar past task summaries before planning" checked={enableEpisodicRetrieval} onToggle={v => update({
              enableEpisodicRetrieval: v
            })} />
              <ToggleRow icon={Network} label="Fact extraction" description="Extract (subject, relation, object) triples into the knowledge graph" checked={enableFactExtraction} onToggle={v => update({
              enableFactExtraction: v
            })} />
            </div>
          </Section>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={exportSettings} className="gap-1.5 text-xs" title="Export settings as JSON">
              <Download className="h-3 w-3" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={importSettings} className="gap-1.5 text-xs" title="Import settings from JSON">
              <Upload className="h-3 w-3" />
              Import
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
            reset();
            toast.info('Settings reset to defaults');
          }} className="gap-1.5 text-xs text-rose-500 hover:text-rose-600">
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Saved to localStorage
          </span>
        </div>
      </DialogContent>
    </Dialog>;
}
function Section({
  icon: Icon,
  label,
  color,
  description,
  children
}) {
  return <div>
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn('h-4 w-4', color)} />
        <div>
          <h3 className="text-sm font-semibold">{label}</h3>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>;
}
function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onToggle
}) {
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-xs font-medium">{label}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>;
}