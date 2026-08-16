// ════════════════════════════════════════════════════════════════
// FILE: components/agent/memory-panel.jsx
// PURPOSE: Displays the agent's knowledge graph, episodic memory,
//          and semantic memory in a tabbed interface.
// EXPORTS: MemoryPanel
// DEPENDS ON: agent-store, lucide-react, framer-motion
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Database, Network, Search, RefreshCw, Brain, ArrowRight, CircleDot, Download, X, ZoomIn, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
export function MemoryPanel() {
  return <div className="h-full min-h-0">
      <Tabs defaultValue="episodic" className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-2.5">
          <TabsList className="bg-muted/40">
            <TabsTrigger value="episodic" className="gap-1.5 text-xs">
              <Database className="h-3.5 w-3.5" />
              Episodic
            </TabsTrigger>
            <TabsTrigger value="semantic" className="gap-1.5 text-xs">
              <Network className="h-3.5 w-3.5" />
              Semantic Graph
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Brain className="h-3 w-3" />
            Agent Memory
          </Badge>
        </div>
        <TabsContent value="episodic" className="mt-0 min-h-0 flex-1 overflow-hidden">
          <EpisodicMemoryView />
        </TabsContent>
        <TabsContent value="semantic" className="mt-0 min-h-0 flex-1 overflow-hidden">
          <SemanticMemoryView />
        </TabsContent>
      </Tabs>
    </div>;
}
function EpisodicMemoryView() {
  const [memories, setMemories] = useState([]);
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/memory');
      const data = await res.json();
      setMemories(data.memories ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    let active = true;
    fetch('/api/agent/memory').then(r => r.json()).then(data => {
      if (active) setMemories(data.memories ?? []);
    }).catch(() => {}).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  const search = async () => {
    if (!query.trim()) {
      setMatches(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/agent/memory?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };
  const display = matches ?? memories;
  return <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder="Semantic search past memories (cosine similarity)…" className="h-9 pl-8 text-xs" />
        </div>
        <Button size="sm" variant="outline" onClick={search} className="h-9 gap-1.5 text-xs">
          <Search className="h-3.5 w-3.5" />
          Search
        </Button>
        <Button size="sm" variant="ghost" onClick={load} className="h-9 w-9 p-0">
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-3 py-1.5">
        <span className="text-[11px] text-muted-foreground">
          {matches ? `${matches.length} matches` : `${memories.length} memories stored`}
        </span>
        {matches && <Button size="sm" variant="ghost" onClick={() => {
        setMatches(null);
        setQuery('');
      }} className="h-6 gap-1 px-2 text-[10px]">
            Clear search
          </Button>}
        <span className="ml-auto text-[10px] text-muted-foreground">
          FAISS-equivalent: hashing-trick TF-IDF + cosine similarity
        </span>
      </div>

      <ScrollArea className="scroll-thin min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {display.length === 0 ? <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Database className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No episodic memories yet. They are stored automatically when the agent completes a task.
              </p>
            </div> : display.map(m => <div key={m.id} className={cn('rounded-lg border p-3 transition-colors', m.success ? 'border-border/60 bg-card/40' : 'border-rose-500/20 bg-rose-500/[0.03]')}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs leading-relaxed">{m.summary}</p>
                  {typeof m.similarity === 'number' && <Badge variant="outline" className="shrink-0 gap-1 text-[9px] text-cyan-600 dark:text-cyan-400">
                      sim {m.similarity.toFixed(2)}
                    </Badge>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {m.keywords.slice(0, 6).map(k => <Badge key={k} variant="secondary" className="h-4 px-1.5 text-[9px] font-normal">
                      {k}
                    </Badge>)}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>)}
        </div>
      </ScrollArea>
    </div>;
}
function SemanticMemoryView() {
  const [graph, setGraph] = useState({
    nodes: [],
    edges: []
  });
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/memory/graph');
      const data = await res.json();
      setGraph(data);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    let active = true;
    fetch('/api/agent/memory/graph').then(r => r.json()).then(data => {
      if (active) setGraph(data);
    }).catch(() => {}).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);
  return <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden">
        {graph.nodes.length === 0 ? <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Network className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              The knowledge graph is empty. It gets populated with key facts
              extracted from the agent&apos;s answers.
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              Run a task and the agent will store (subject → relation → object) triples here.
            </p>
          </div> : <KnowledgeGraphViz graph={graph} />}
      </div>
    </div>;
}
function useForceDirectedLayout(graph, W, H) {
  return useMemo(() => {
    const nodes = graph.nodes;
    const edges = graph.edges;
    if (nodes.length === 0) return new Map();

    // Initialize positions in a circle (seed)
    const pos = new Map();
    const cx = W / 2;
    const cy = H / 2;
    const r0 = Math.min(W, H) / 3;
    nodes.forEach((n, i) => {
      const angle = i / nodes.length * Math.PI * 2;
      pos.set(n.label, {
        x: cx + Math.cos(angle) * r0 + n.label.length % 7 * 3,
        y: cy + Math.sin(angle) * r0 + n.label.length % 5 * 3,
        vx: 0,
        vy: 0
      });
    });

    // Build adjacency for attraction
    const adj = new Map();
    nodes.forEach(n => adj.set(n.label, new Set()));
    edges.forEach(e => {
      adj.get(e.from)?.add(e.to);
      adj.get(e.to)?.add(e.from);
    });
    const REPULSION = 6000;
    const ATTRACTION = 0.04;
    const DAMPING = 0.82;
    const MAX_V = 30;
    const iterations = 120;
    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion: all pairs
      for (let i = 0; i < nodes.length; i++) {
        const a = pos.get(nodes[i].label);
        for (let j = i + 1; j < nodes.length; j++) {
          const b = pos.get(nodes[j].label);
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 1) {
            dist2 = 1;
            dx = (Math.random() - 0.5) * 2;
            dy = (Math.random() - 0.5) * 2;
          }
          const dist = Math.sqrt(dist2);
          const force = REPULSION / dist2;
          const fx = dx / dist * force;
          const fy = dy / dist * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }
      // Attraction: along edges
      edges.forEach(e => {
        const a = pos.get(e.from);
        const b = pos.get(e.to);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = ATTRACTION * dist;
        const fx = dx / dist * force;
        const fy = dy / dist * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      });
      // Apply velocity + centering force + bounds
      pos.forEach(p => {
        p.vx = Math.max(-MAX_V, Math.min(MAX_V, p.vx * DAMPING));
        p.vy = Math.max(-MAX_V, Math.min(MAX_V, p.vy * DAMPING));
        p.x += p.vx;
        p.y += p.vy;
        // gentle pull to center
        p.x += (cx - p.x) * 0.01;
        p.y += (cy - p.y) * 0.01;
        // bounds (with padding for labels)
        p.x = Math.max(50, Math.min(W - 50, p.x));
        p.y = Math.max(30, Math.min(H - 30, p.y));
      });
    }

    // Return plain {x,y} map
    const result = new Map();
    pos.forEach((p, label) => result.set(label, {
      x: p.x,
      y: p.y
    }));
    return result;
  }, [graph, W, H]);
}
function KnowledgeGraphViz({
  graph
}) {
  const W = 800;
  const H = 520;
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [manualPositions, setManualPositions] = useState(new Map());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({
    x: 0,
    y: 0
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0
  });
  const [hiddenTypes, setHiddenTypes] = useState(new Set());
  const svgRef = useRef(null);
  const positions = useForceDirectedLayout(graph, W, H);

  // Merge manual (dragged) positions with computed positions
  const finalPositions = useMemo(() => {
    const merged = new Map(positions);
    manualPositions.forEach((pos, label) => merged.set(label, pos));
    return merged;
  }, [positions, manualPositions]);

  // Reset layout: clear manual positions + zoom/pan
  const resetLayout = () => {
    setManualPositions(new Map());
    setZoom(1);
    setPan({
      x: 0,
      y: 0
    });
    toast.info('Layout reset to defaults');
  };

  // Zoom handler (wheel)
  const handleWheel = e => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.max(0.3, Math.min(3, zoom + delta));
    // Zoom towards cursor
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width * W;
      const my = (e.clientY - rect.top) / rect.height * H;
      const scale = newZoom / zoom;
      setPan({
        x: mx - scale * (mx - pan.x),
        y: my - scale * (my - pan.y)
      });
    }
    setZoom(newZoom);
  };

  // Pan handlers (drag background)
  const handleSvgMouseDown = e => {
    // Only start panning if clicking the background (not a node/edge)
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y
      });
    }
  };
  const handleSvgMouseMovePan = e => {
    if (!isPanning) return;
    const dx = (e.clientX - panStart.x) / (svgRef.current?.getBoundingClientRect().width || 1) * W;
    const dy = (e.clientY - panStart.y) / (svgRef.current?.getBoundingClientRect().height || 1) * H;
    setPan({
      x: panStart.panX + dx,
      y: panStart.panY + dy
    });
  };
  const handleSvgMouseUpPan = () => {
    setIsPanning(false);
  };

  // Compute node type statistics for legend
  const nodeTypeStats = useMemo(() => {
    const stats = {};
    graph.nodes.forEach(n => {
      stats[n.type] = (stats[n.type] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [graph.nodes]);

  // Toggle a node type's visibility
  const toggleType = type => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);else next.add(type);
      return next;
    });
  };

  // Filtered nodes/edges based on hidden types
  const visibleNodes = useMemo(() => graph.nodes.filter(n => !hiddenTypes.has(n.type)), [graph.nodes, hiddenTypes]);
  const visibleNodeLabels = useMemo(() => new Set(visibleNodes.map(n => n.label)), [visibleNodes]);
  const visibleEdges = useMemo(() => graph.edges.filter(e => visibleNodeLabels.has(e.from) && visibleNodeLabels.has(e.to)), [graph.edges, visibleNodeLabels]);
  const palette = ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f43f5e', '#3b82f6'];

  // Build a color index map so colors are stable
  const colorIndex = new Map();
  graph.nodes.forEach((n, i) => colorIndex.set(n.label, i));

  // Compute edges connected to a node
  const edgesForNode = label => graph.edges.filter(e => e.from === label || e.to === label);

  // Search filter: nodes matching the search query
  const matchedNodes = useMemo(() => {
    if (!searchQuery.trim()) return null; // null = no search active
    const q = searchQuery.toLowerCase();
    return new Set(graph.nodes.filter(n => n.label.toLowerCase().includes(q)).map(n => n.label));
  }, [searchQuery, graph.nodes]);

  // Highlight set: edges + nodes connected to hovered/selected node
  const highlightLabel = hoveredNode ?? selectedNode;
  const connectedLabels = new Set();
  if (highlightLabel) {
    connectedLabels.add(highlightLabel);
    edgesForNode(highlightLabel).forEach(e => {
      connectedLabels.add(e.from);
      connectedLabels.add(e.to);
    });
  }

  // Drag handlers for interactive node repositioning
  const handleNodeMouseDown = label => e => {
    e.stopPropagation();
    setDraggedNode(label);
  };
  const handleSvgMouseMove = e => {
    // Handle node dragging
    if (draggedNode && svgRef.current) {
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const scale = W / rect.width;
      const x = (e.clientX - rect.left) * scale;
      const y = (e.clientY - rect.top) * scale;
      // Clamp to bounds
      const clampedX = Math.max(50, Math.min(W - 50, x));
      const clampedY = Math.max(30, Math.min(H - 30, y));
      setManualPositions(prev => {
        const next = new Map(prev);
        next.set(draggedNode, {
          x: clampedX,
          y: clampedY
        });
        return next;
      });
      return;
    }
    // Handle panning
    if (isPanning) {
      handleSvgMouseMovePan(e);
    }
  };
  const handleSvgMouseUp = () => {
    setDraggedNode(null);
    setIsPanning(false);
  };

  // Export functions
  const exportGraphML = () => {
    const nodes = graph.nodes.map(n => `    <node id="${escapeXml(n.id)}"><data key="label">${escapeXml(n.label)}</data><data key="type">${escapeXml(n.type)}</data></node>`).join('\n');
    const edges = graph.edges.map((e, i) => `    <edge id="e${i}" source="${escapeXml(getNodeId(graph, e.from))}" target="${escapeXml(getNodeId(graph, e.to))}"><data key="relation">${escapeXml(e.relation)}</data><data key="weight">${e.weight}</data></edge>`).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="relation" for="edge" attr.name="relation" attr.type="string"/>
  <key id="weight" for="edge" attr.name="weight" attr.type="double"/>
  <graph id="G" edgedefault="undirected">
${nodes}
${edges}
  </graph>
</graphml>`;
    downloadFile(xml, 'knowledge-graph.graphml', 'application/xml');
    toast.success('Graph exported as GraphML', {
      description: `${graph.nodes.length} nodes, ${graph.edges.length} edges`
    });
  };
  const exportJsonLd = () => {
    const jsonld = {
      '@context': {
        '@vocab': 'https://schema.org/',
        relation: {
          '@id': 'https://schema.org/about'
        }
      },
      '@type': 'Graph',
      nodes: graph.nodes.map(n => ({
        '@id': `#${n.label}`,
        '@type': n.type,
        name: n.label,
        value: n.value
      })),
      edges: graph.edges.map(e => ({
        subject: {
          '@id': `#${e.from}`
        },
        relation: e.relation,
        object: {
          '@id': `#${e.to}`
        },
        weight: e.weight
      }))
    };
    downloadFile(JSON.stringify(jsonld, null, 2), 'knowledge-graph.jsonld', 'application/ld+json');
    toast.success('Graph exported as JSON-LD', {
      description: `${graph.nodes.length} nodes, ${graph.edges.length} edges`
    });
  };
  return <ScrollArea className="scroll-thin h-full min-h-0">
      <div className="space-y-4 p-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <CircleDot className="h-3 w-3 text-cyan-500" />
              <span className="font-semibold tabular-nums">{visibleNodes.length}</span>
              <span className="text-muted-foreground">nodes</span>
              {hiddenTypes.size > 0 && <span className="text-[9px] text-muted-foreground/60">
                  / {graph.nodes.length}
                </span>}
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowRight className="h-3 w-3 text-emerald-500" />
              <span className="font-semibold tabular-nums">{visibleEdges.length}</span>
              <span className="text-muted-foreground">edges</span>
              {hiddenTypes.size > 0 && <span className="text-[9px] text-muted-foreground/60">
                  / {graph.edges.length}
                </span>}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={exportGraphML} disabled={graph.nodes.length === 0} className="h-7 gap-1.5 text-[11px]" title="Export as GraphML">
              <Download className="h-3 w-3" />
              GraphML
            </Button>
            <Button size="sm" variant="outline" onClick={exportJsonLd} disabled={graph.nodes.length === 0} className="h-7 gap-1.5 text-[11px]" title="Export as JSON-LD">
              <Download className="h-3 w-3" />
              JSON-LD
            </Button>
            <Button size="sm" variant="ghost" onClick={resetLayout} disabled={graph.nodes.length === 0} className="h-7 w-7 p-0" title="Reset layout (clear manual positions + zoom)">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={load} className="h-7 w-7 p-0" title="Refresh graph">
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Zoom indicator + legend */}
        {graph.nodes.length > 0 && <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ZoomIn className="h-3 w-3" />
              {Math.round(zoom * 100)}%
            </span>
            {zoom !== 1 && <button onClick={() => {
          setZoom(1);
          setPan({
            x: 0,
            y: 0
          });
        }} className="text-emerald-500 hover:underline">
                reset zoom
              </button>}
            <span className="hidden sm:inline">·</span>
            <span className="hidden items-center gap-1.5 sm:flex">
              scroll to zoom · drag background to pan · drag nodes to reposition
            </span>
            {/* Legend — clickable to toggle node type visibility */}
            {nodeTypeStats.length > 0 && <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {nodeTypeStats.map(([type, count]) => {
            const isHidden = hiddenTypes.has(type);
            return <button key={type} onClick={() => toggleType(type)} className={cn('flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] transition-colors', isHidden ? 'border-border/40 bg-muted/20 text-muted-foreground/50 line-through' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 dark:text-cyan-400')} title={isHidden ? `Show ${type} nodes` : `Hide ${type} nodes`}>
                      <span className={cn('h-2 w-2 rounded-full', isHidden ? 'bg-muted-foreground/30' : 'bg-cyan-500')} />
                      {type} ({count})
                    </button>;
          })}
              </div>}
          </div>}

        {/* Search box */}
        {graph.nodes.length > 0 && <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter nodes by label..." className="h-8 pl-8 text-xs" />
            {searchQuery && matchedNodes && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {matchedNodes.size} match{matchedNodes.size !== 1 ? 'es' : ''}
              </span>}
          </div>}

        <div className="overflow-x-auto rounded-xl border border-border/60 bg-muted/20">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={cn('h-[520px] w-full min-w-[640px]', isPanning ? 'cursor-grabbing' : 'cursor-grab')} onMouseMove={handleSvgMouseMove} onMouseUp={handleSvgMouseUp} onMouseLeave={handleSvgMouseUp} onMouseDown={handleSvgMouseDown} onWheel={handleWheel}>
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* edges */}
            {visibleEdges.map((e, i) => {
              const from = finalPositions.get(e.from);
              const to = finalPositions.get(e.to);
              if (!from || !to) return null;
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const isHighlighted = highlightLabel && (e.from === highlightLabel || e.to === highlightLabel);
              const isDimmed = highlightLabel && !isHighlighted;
              const isEdgeSelected = selectedEdge && selectedEdge.from === e.from && selectedEdge.to === e.to && selectedEdge.relation === e.relation;
              return <g key={e.id || `edge-${i}`} className="cursor-pointer" onClick={ev => {
                ev.stopPropagation();
                setSelectedEdge(isEdgeSelected ? null : {
                  from: e.from,
                  to: e.to,
                  relation: e.relation,
                  weight: e.weight
                });
              }}>
                  {/* invisible thicker hit area */}
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth={12} />
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={isHighlighted || isEdgeSelected ? '#10b981' : 'currentColor'} className={cn('text-emerald-500/30 transition-opacity', isDimmed && 'opacity-20')} strokeWidth={Math.min(1 + e.weight, isHighlighted || isEdgeSelected ? 4 : 3)} style={{
                  transition: 'x1 0.3s ease, y1 0.3s ease, x2 0.3s ease, y2 0.3s ease, stroke-width 0.2s ease'
                }} />
                  <text x={midX} y={midY - 4} textAnchor="middle" className={cn('fill-muted-foreground text-[8px] font-medium transition-opacity', isDimmed && 'opacity-20')} style={{
                  transition: 'x 0.3s ease, y 0.3s ease'
                }}>
                    {e.relation}
                  </text>
                </g>;
            })}
            {/* nodes */}
            {visibleNodes.map(n => {
              const pos = finalPositions.get(n.label);
              if (!pos) return null;
              const idx = colorIndex.get(n.label) ?? 0;
              const color = palette[idx % palette.length];
              const isSelected = selectedNode === n.label;
              const isHovered = hoveredNode === n.label;
              const isHighlighted = connectedLabels.has(n.label);
              const isDimmed = highlightLabel && !isHighlighted;
              const isSearchMatch = matchedNodes?.has(n.label) ?? false;
              const isSearchMiss = matchedNodes && !isSearchMatch;
              const isDragged = draggedNode === n.label;
              return <g key={n.id} className={cn('cursor-pointer', isDragged && 'cursor-grabbing')} onClick={() => setSelectedNode(isSelected ? null : n.label)} onMouseEnter={() => setHoveredNode(n.label)} onMouseLeave={() => setHoveredNode(null)} onMouseDown={handleNodeMouseDown(n.label)} style={{
                transition: isDragged ? 'none' : 'transform 0.3s ease'
              }}>
                  {/* search match ring */}
                  {isSearchMatch && <circle cx={pos.x} cy={pos.y} r={26} fill="none" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 2" className="animate-pulse" style={{
                  transition: 'cx 0.3s ease, cy 0.3s ease'
                }} />}
                  <circle cx={pos.x} cy={pos.y} r={isSelected || isHovered ? 22 : 18} fill={color} fillOpacity={isSelected ? 0.3 : isDimmed || isSearchMiss ? 0.05 : 0.15} stroke={color} strokeWidth={isSelected ? 3 : 2} className={cn('transition-opacity', (isDimmed || isSearchMiss) && 'opacity-40')} style={{
                  transition: 'cx 0.3s ease, cy 0.3s ease, r 0.2s ease, fill-opacity 0.2s ease, stroke-width 0.2s ease'
                }} />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" className={cn('text-[9px] font-bold transition-opacity', (isDimmed || isSearchMiss) && 'opacity-40')} fill={color} style={{
                  transition: 'x 0.3s ease, y 0.3s ease'
                }}>
                    {n.label.slice(0, 8)}
                  </text>
                  <text x={pos.x} y={pos.y + 32} textAnchor="middle" className={cn('fill-foreground text-[8px] transition-opacity', (isDimmed || isSearchMiss) && 'opacity-40')} style={{
                  transition: 'x 0.3s ease, y 0.3s ease'
                }}>
                    {n.label.length > 14 ? n.label.slice(0, 13) + '…' : n.label}
                  </text>
                </g>;
            })}
            </g>
          </svg>
        </div>

        {/* Edge detail panel */}
        {selectedEdge && <div className="animate-fade-in rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-semibold">Edge Detail</h4>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedEdge(null)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border/40 bg-background/40 px-3 py-2 text-xs">
              <span className="cursor-pointer font-semibold text-cyan-600 hover:underline dark:text-cyan-400" onClick={() => {
            setSelectedNode(selectedEdge.from);
            setSelectedEdge(null);
          }}>
                {selectedEdge.from}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <ArrowRight className="h-3 w-3 text-emerald-500" />
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {selectedEdge.relation}
                </Badge>
                <ArrowRight className="h-3 w-3 text-emerald-500" />
              </span>
              <span className="cursor-pointer font-semibold text-amber-600 hover:underline dark:text-amber-400" onClick={() => {
            setSelectedNode(selectedEdge.to);
            setSelectedEdge(null);
          }}>
                {selectedEdge.to}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">
                weight: {selectedEdge.weight.toFixed(1)}
              </span>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Click the subject or object to inspect that node.
            </p>
          </div>}

        {/* Node detail panel */}
        {selectedNode && <div className="animate-fade-in rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-cyan-500" />
                <h4 className="text-sm font-semibold">{selectedNode}</h4>
                <Badge variant="outline" className="h-4 px-1 text-[9px]">
                  {edgesForNode(selectedNode).length} edges
                </Badge>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedNode(null)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {edgesForNode(selectedNode).length === 0 ? <p className="text-[11px] text-muted-foreground">No edges connected to this node.</p> : edgesForNode(selectedNode).map(e => {
            const isOutgoing = e.from === selectedNode;
            return <div key={e.id} className="flex items-center gap-2 rounded-md border border-border/40 bg-background/40 px-2.5 py-1.5 text-[11px]">
                      <ArrowRight className={cn('h-3 w-3', isOutgoing ? 'text-emerald-500' : 'rotate-180 text-amber-500')} />
                      <span className="text-muted-foreground">{e.relation}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        {isOutgoing ? e.to : e.from}
                      </span>
                      <span className="ml-auto text-[9px] text-muted-foreground">
                        ×{e.weight.toFixed(1)}
                      </span>
                    </div>;
          })}
            </div>
          </div>}

        {/* fact list */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Stored Facts ({graph.edges.length})
          </p>
          <div className="grid gap-1.5">
            {graph.edges.slice(0, 50).map(e => <div key={e.id} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2.5 py-1.5 text-[11px]">
                <span className="cursor-pointer font-semibold text-cyan-600 hover:underline dark:text-cyan-400" onClick={() => setSelectedNode(e.from)}>
                  {e.from}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ArrowRight className="h-3 w-3 text-emerald-500" />
                  {e.relation}
                  <ArrowRight className="h-3 w-3 text-emerald-500" />
                </span>
                <span className="cursor-pointer font-semibold text-amber-600 hover:underline dark:text-amber-400" onClick={() => setSelectedNode(e.to)}>
                  {e.to}
                </span>
                <span className="ml-auto text-[9px] text-muted-foreground">×{e.weight.toFixed(1)}</span>
              </div>)}
          </div>
        </div>
      </div>
    </ScrollArea>;
}
function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function getNodeId(graph, label) {
  return graph.nodes.find(n => n.label === label)?.id ?? label;
}
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], {
    type: mimeType
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}