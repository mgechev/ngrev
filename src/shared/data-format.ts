import { StaticSymbol } from '@angular/compiler';
export interface Graph<T> {
  nodes: Node<T>[];
  edges: Edge[];
}

export enum SymbolTypes {
  Provider,
  HtmlElement,
  HtmlElementWithDirective,
  ComponentWithDirective,
  Component,
  ComponentOrDirective,
  Pipe,
  Module,
  LazyModule,
  Meta
}

export interface SymbolType {
  angular: boolean;
  type: SymbolTypes;
}

export interface Node<T> {
  id: string;
  label: string;
  data?: T;
  type?: SymbolType;
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
  dashes?: boolean;
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
  properties: {[key: number]: StringPair};
  filePath?: string;
}


export const getId = (symbol: { name: string, filePath: string }) => {
  return `${symbol.filePath}#${symbol.name}`;
};

export const isAngularSymbol = (symbol: StaticSymbol) => {
  return /node_modules\/@angular/.test(symbol.filePath);
};
