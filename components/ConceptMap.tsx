
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphData, Node, Link, Theme } from '../types';

interface ConceptMapProps {
  graphData: GraphData;
  theme: Theme;
  spread: number;
}

const ConceptMap: React.FC<ConceptMapProps> = ({ graphData, theme, spread }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);

  useEffect(() => {
    if (!graphData || !svgRef.current || !containerRef.current) return;

    const { terms, relationships } = graphData;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);

    svg.selectAll("*").remove(); // Clear previous render
    
    // Theme-based colors
    const linkColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // dark: slate-400 / light: slate-500
    const predicateBgColor = theme === 'dark' ? '#1e293b' : '#ffffff'; // slate-800 / white
    const arrowheadColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // same as link
    const labelColor = theme === 'dark' ? '#f1f5f9' : '#1e293b'; // slate-100 / slate-800

    const nodes: Node[] = terms.map(term => ({ ...term }));
    const links: Link[] = relationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      label: rel.label
    })) as Link[];

    // Adjacency check for highlighting
    const linkedByIndex = new Map<string, boolean>();
    relationships.forEach(rel => {
      linkedByIndex.set(`${rel.source},${rel.target}`, true);
    });
    const areLinked = (a: Node, b: Node) => 
        linkedByIndex.has(`${a.id},${b.id}`) || linkedByIndex.has(`${b.id},${a.id}`) || a.id === b.id;

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(spread))
      .force("charge", d3.forceManyBody().strength(-spread * 2.5))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(spread / 3));

    simulationRef.current = simulation;

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);

    // Arrowhead marker
    g.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 23)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", arrowheadColor)
      .style("stroke","none");

    const link = g.append("g")
      .attr("stroke", linkColor)
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)")
      .style("transition", "stroke-opacity 0.3s ease");
    
    const linkLabelGroup = g.append("g")
      .selectAll(".link-label-group")
      .data(links)
      .join("g")
      .attr("class", "link-label-group")
      .style("transition", "opacity 0.3s ease");

    const linkText = linkLabelGroup.append("text")
      .text(d => d.label)
      .attr("font-size", "10px")
      .attr("fill", labelColor)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");

    linkLabelGroup.insert("rect", "text")
      .attr("fill", predicateBgColor)
      .attr("rx", 3)
      .attr("ry", 3);

    linkLabelGroup.each(function() {
      const textNode = d3.select(this).select("text").node();
      if (textNode) {
          const bbox = textNode.getBBox();
          d3.select(this).select("rect")
              .attr("x", bbox.x - 4)
              .attr("y", bbox.y - 2)
              .attr("width", bbox.width + 8)
              .attr("height", bbox.height + 4);
      }
    });

    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .style("transition", "opacity 0.3s ease")
      .call(drag(simulation))
      .on('click', (event, d) => {
        event.stopPropagation();
        
        const currentTransform = d3.zoomTransform(svg.node()!);
        const k = currentTransform.k;

        const x = width / 2 - d.x! * k;
        const y = height / 2 - d.y! * k;

        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(k));
      })
      .on('mouseover', (event, d) => {
        const containerBounds = containerRef.current!.getBoundingClientRect();
        tooltip
          .html(d.definition || 'No definition available.')
          .style("left", `${event.pageX - containerBounds.left + 15}px`)
          .style("top", `${event.pageY - containerBounds.top + 15}px`);
        
        tooltip.transition().duration(200).style('opacity', 1);

        // Highlight
        node.style('opacity', o => areLinked(d, o) ? 1 : 0.2);
        link.style('stroke-opacity', o => ((o.source as Node).id === d.id || (o.target as Node).id === d.id) ? 0.9 : 0.2);
        linkLabelGroup.style('opacity', o => ((o.source as Node).id === d.id || (o.target as Node).id === d.id) ? 1 : 0.2);
      })
      .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);

        // Reset highlight
        node.style('opacity', 1);
        link.style('stroke-opacity', 0.6);
        linkLabelGroup.style('opacity', 1);
      });

    node.append("circle")
      .attr("r", 8)
      .attr("fill", "url(#node-gradient)");

    node.append("text")
      .text(d => d.label)
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", "14px")
      .attr("fill", labelColor);
    
    // Gradient for nodes
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "node-gradient")
      .attr("x1", "0%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").style("stop-color", "#8b5cf6");
    gradient.append("stop").attr("offset", "100%").style("stop-color", "#38bdf8");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      linkLabelGroup
        .attr("transform", d => `translate(${((d.source as Node).x! + (d.target as Node).x!) / 2}, ${((d.source as Node).y! + (d.target as Node).y!) / 2})`);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };

  }, [graphData, theme, spread]);

  const drag = (simulation: d3.Simulation<Node, undefined>) => {
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x!;
      d.fy = d.y!;
    }
    
    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    return d3.drag<SVGGElement, Node>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return (
    <div ref={containerRef} className="w-full h-full rounded-b-lg overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300 relative">
      <svg ref={svgRef} className="w-full h-full" />
      <div
        ref={tooltipRef}
        className="absolute p-3 rounded-lg shadow-xl text-sm max-w-xs
                   bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm
                   border border-slate-200 dark:border-slate-700
                   text-slate-800 dark:text-slate-200
                   opacity-0 pointer-events-none transition-opacity duration-200 z-10"
      />
    </div>
  );
};

export default ConceptMap;
