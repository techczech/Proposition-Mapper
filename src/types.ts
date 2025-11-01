
import * as d3 from 'd3';

export interface Term {
  id: string;
  label: string;
  definition: string;
}

export interface Relationship {
  source: string;
  target: string;
  label: string;
}

export interface GraphData {
  terms: Term[];
  relationships: Relationship[];
}

export interface HistoryItem {
  id: string;
  name: string;
  createdAt: string;
  graphData: GraphData;
}

export enum ViewType {
  MAP = 'MAP',
  LIST = 'LIST',
  KWIC = 'KWIC',
}

export type Theme = 'light' | 'dark';

// Types for D3 simulation
// The Node type is extended with properties that D3's force simulation adds to each node object.
// By extending Term, we ensure that the simulation nodes retain all original data.
// FIX: Explicitly define D3 simulation properties to resolve type errors.
export interface Node extends Term, d3.SimulationNodeDatum {
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

// The Link type represents the connections between nodes in the D3 simulation.
// After the simulation starts, d3.forceLink populates `source` and `target`
// with references to the full Node objects.
export interface Link extends d3.SimulationLinkDatum<Node> {
  label: string;
}
