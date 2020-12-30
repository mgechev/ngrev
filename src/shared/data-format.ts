import { StaticSymbol, R3InjectableMetadata } from '@angular/compiler';
import { AnnotationNames, InjectableSymbol, Symbol } from 'ngast';
import { Theme } from './themes/color-map';

export interface Graph<T> {
  nodes: Node<T>[];
  edges: Edge[];
}

export enum SymbolTypes {
  Provider = 'provider',
  HtmlElement = 'html-element',
  HtmlElementWithDirective = 'html-element-with-directive',
  ComponentWithDirective = 'component-with-directive',
  Component = 'component',
  ComponentOrDirective = 'component-or-directive',
  Pipe = 'pipe',
  Module = 'module',
  LazyModule = 'lazy-module',
  Meta = 'meta',
  Unknown = 'unknown'
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
  HierarchicalLRDirected,
  HierarchicalUDDirected,
  Regular
}

export interface Config {
  showLibs: boolean;
  showModules: boolean;
  theme: string;
  themes: { [key: string]: Theme };
}

export interface VisualizationConfig<T> {
  layout?: Layout;
  title: string;
  graph: Graph<T>;
}

export type StringPair = { key: string; value: string | null };

export interface Metadata {
  properties: { [key: number]: StringPair };
  filePath?: string | null;
}

export const getId = (symbol: { name: string; path: string }) => {
  return `${symbol.path}#${symbol.name}`;
};

export const getProviderName = (provider: R3InjectableMetadata) => {
  if (provider.type.value) {
    return provider.name;
  }
  return null;
};

export const isAngularSymbol = (symbol: any) => {
  // TODO
  return false;
  // return /node_modules\/@angular/.test(s);
};
