export interface Graph<T> {
  nodes: Node<T>[];
  edges: Edge[];
}

export interface Node<T> {
  id: string;
  label: string;
  data?: T;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  data?: any;
}

export enum Layout {
  HierarchicalDirected,
  Regular
}

export interface Visualization<T> {
  layout?: Layout;
  graph: Graph<T>;
}
