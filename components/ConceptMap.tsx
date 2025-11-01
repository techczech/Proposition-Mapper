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
    // FIX: Use `any` for links during initialization. D3's `forceLink` mutates the
    // link's `source` and `target` from string IDs to full Node objects. This
    // dynamic nature conflicts with strict typing for the initial string-based
    // processing.
    const links: any[] = relationships.map(rel => ({
      source: rel.source,
      target: rel.target,
      label: rel.label,
      isReverse: rel.isReverse,
    }));

    // Group links that connect the same two nodes, regardless of direction.
    // This handles both bidirectional links and multiple links in the same direction.
    const linkGroups = new Map<string, any[]>();
    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      // Create a canonical key for the pair of nodes to group them
      const key = sourceId < targetId ? `${sourceId}|${targetId}` : `${targetId}|${sourceId}`;
      if (!linkGroups.has(key)) {
        linkGroups.set(key, []);
      }
      linkGroups.get(key)!.push(link);
    });

    // Add properties to each link for rendering logic.
    // This will determine if a link should be curved and by how much.
    linkGroups.forEach(group => {
      if (group.length > 1) {
        group.forEach((link, i) => {
          link.isMultiLink = true;
          link.multiLinkIndex = i;
          link.multiLinkTotal = group.length;
        });
      }
    });

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
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke", linkColor)
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)")
      .attr("fill", "none")
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
      link.attr("d", d => {
          const sourceNode = d.source as Node;
          const targetNode = d.target as Node;
          if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) {
            return null;
          }

          // Draw a straight line for single links.
          if (!d.isMultiLink) {
            return `M${sourceNode.x},${sourceNode.y}L${targetNode.x},${targetNode.y}`;
          }

          // Draw curved lines for multiple links between the same two nodes.
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dr = Math.sqrt(dx * dx + dy * dy);

          // For a group of N links, the middle link (if N is odd) is straight.
          // The links on either side are curved with increasing curvature.
          const total = d.multiLinkTotal;
          const index = d.multiLinkIndex;
          
          // This calculates a 'bend' factor. 0 for the middle link in an odd group.
          // Positive/negative for links on either side.
          const bend = (index - (total - 1) / 2) * 0.2;

          if (bend === 0) {
            return `M${sourceNode.x},${sourceNode.y}L${targetNode.x},${targetNode.y}`;
          }

          // Calculate the control point for a quadratic Bezier curve.
          // The control point is offset perpendicularly from the line's midpoint.
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          const angle = Math.atan2(dy, dx);
          const offset = dr * bend;
          const cpx = midX - offset * Math.sin(angle);
          const cpy = midY + offset * Math.cos(angle);

          return `M${sourceNode.x},${sourceNode.y} Q${cpx},${cpy} ${targetNode.x},${targetNode.y}`;
        });

      linkLabelGroup
        .attr("transform", d => {
            const sourceNode = d.source as Node;
            const targetNode = d.target as Node;
            if (!sourceNode.x || !sourceNode.y || !targetNode.x || !targetNode.y) {
              return null;
            }

            const midX = (sourceNode.x + targetNode.x) / 2;
            const midY = (sourceNode.y + targetNode.y) / 2;

            // If it's not a multi-link, position at the midpoint.
            if (!d.isMultiLink) {
              return `translate(${midX},${midY})`;
            }

            // For curved links, position the label at the peak of the curve.
            const dx = targetNode.x - sourceNode.x;
            const dy = targetNode.y - sourceNode.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            const total = d.multiLinkTotal;
            const index = d.multiLinkIndex;
            const bend = (index - (total - 1) / 2) * 0.2;

            if (bend === 0) {
              return `translate(${midX},${midY})`;
            }

            const angle = Math.atan2(dy, dx);
            const offset = dr * bend;
            const cpx = midX - offset * Math.sin(angle);
            const cpy = midY + offset * Math.cos(angle);

            // The peak of a quadratic Bezier curve (at t=0.5) is a weighted average
            // of the start, control, and end points.
            const peakX = 0.25 * sourceNode.x + 0.5 * cpx + 0.25 * targetNode.x;
            const peakY = 0.25 * sourceNode.y + 0.5 * cpy + 0.25 * targetNode.y;

            return `translate(${peakX}, ${peakY})`;
        });

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