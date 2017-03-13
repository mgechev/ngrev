import { StaticSymbol } from '@angular/compiler';
export interface Graph<T> {
  nodes: Node<T>[];
  edges: Edge[];
}

export interface Node<T> {
  id: string;
  label: string;
  data?: T;
}

export enum Direction {
  From,
  To,
  Both
}

export interface Edge {
  from: string;
  to: string;
  direction?: Direction;
  data?: any;
}

export enum Layout {
  HierarchicalDirected,
  Regular
}

export interface VisualizationConfig<T> {
  layout?: Layout;
  graph: Graph<T>;
}

export type StringPair = { key: string, value: string};

export interface Metadata {
  [key: number]: StringPair;
}


export const getId = (symbol: StaticSymbol) => {
  return `${symbol.filePath}#${symbol.name}`;
};
