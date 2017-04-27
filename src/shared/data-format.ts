import { StaticSymbol, CompileProviderMetadata } from '@angular/compiler';
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

export const getProviderId = (provider: CompileProviderMetadata) => {
  if (provider.token.value) {
    return provider.token.value;
  } else {
    return getId(provider.token.identifier.reference);
  }
};

export const getProviderName = (provider: CompileProviderMetadata) => {
  if (provider.token.value) {
    return provider.token.value;
  } else {
    return provider.token.identifier.reference.name;
  }
};

export const isAngularSymbol = (symbol: StaticSymbol | CompileProviderMetadata) => {
  if (symbol instanceof StaticSymbol) {
    return /node_modules\/@angular/.test(symbol.filePath);
  } else {
    if (symbol.token.value) {
      // We can't be completely sure since we don't know
      // the filePath but Angular doesn't have any non-reference tokens.
      return false;
    } else {
      return isAngularSymbol(symbol.token.identifier.reference);
    }
  }
};
