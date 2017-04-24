import { DirectiveSymbol, ContextSymbols, ProviderSymbol } from 'ngast';
import { State } from './state';
import { ElementAst, StaticSymbol, DirectiveAst } from '@angular/compiler';
import { DataSet } from 'vis';
import { VisualizationConfig, Metadata, getId, Node, isAngularSymbol, SymbolTypes, Direction } from '../../shared/data-format';
import { getDirectiveMetadata, getElementMetadata, getProviderMetadata } from '../formatters/model-formatter';
import { TemplateState } from './template.state';
import { ProviderState } from './provider.state';

interface NodeMap {
  [id: string]: ProviderSymbol | DirectiveSymbol | ElementAst;
}

const TemplateId = 'template';
const TemplateErrorId = 'template-error';
const DependenciesId = 'dependencies';
const ViewProvidersId = 'view-providers';
const ProvidersId = 'providers';

export class DirectiveState extends State {
  private symbols: NodeMap = {};

  constructor(context: ContextSymbols, protected directive: DirectiveSymbol) {
    super(getId(directive.symbol), context);
  }

  getMetadata(id: string): Metadata {
    const s = this.symbols[id];
    if (!s) {
      return null;
    }
    if (s instanceof ElementAst) {
      return getElementMetadata(s);
    } else if (s instanceof DirectiveSymbol) {
      return getDirectiveMetadata(s);
    } else if (s instanceof ProviderSymbol) {
      return getProviderMetadata(s);
    }
  }

  nextState(id: string) {
    if (id === TemplateId) {
      return new TemplateState(this.context, this.directive);
    }
    if (id === this.symbolId) {
      return null;
    }
    const symbol = this.symbols[id];
    if (symbol instanceof DirectiveSymbol) {
      return new DirectiveState(this.context, symbol);
    } else if (symbol instanceof ProviderSymbol) {
      return new ProviderState(this.context, symbol);
    } else {
      return null;
    }
  }

  getData(): VisualizationConfig<any> {
    const s = this.directive.symbol;
    const nodeId = getId(s);
    const nodes: Node<DirectiveSymbol>[] = [{
      id: nodeId,
      label: s.name,
      data: this.directive,
      type: {
        type: SymbolTypes.Component,
        angular: isAngularSymbol(s)
      }
    }, {
      id: TemplateId,
      label: 'Template',
      type: {
        type: SymbolTypes.Meta,
        angular: false
      }
    }];
    const edges = [{
      from: nodeId,
      to: TemplateId
    }];
    this.addProviderNodes(nodes, edges, 'Dependencies', DependenciesId, this.directive.getDependencies());
    this.addProviderNodes(nodes, edges, 'Providers', ProvidersId, this.directive.getProviders());
    this.addProviderNodes(nodes, edges, 'View Providers', ViewProvidersId, this.directive.getViewProviders());
    return {
      graph: {
        nodes, edges
      }
    };
  }

  private addProviderNodes(nodes: Node<any>[], edges: any[], rootLabel: string, rootId: string, providers: ProviderSymbol[]) {
    if (providers.length > 0) {
      nodes.push({
        id: rootId,
        label: rootLabel,
        type: {
          type: SymbolTypes.Meta,
          angular: false
        }
      });
      edges.push({
        from: getId(this.directive.symbol),
        to: rootId
      });
    }
    providers.forEach(p => {
      nodes.push({
        id: getId(p.symbol),
        data: p,
        label: p.symbol.name,
        type: {
          angular: isAngularSymbol(p.symbol),
          type: SymbolTypes.Provider
        }
      });
    });
    nodes.forEach(n => {
      this.symbols[n.id] = n.data;
    });
    nodes.slice(nodes.length - providers.length, nodes.length).map(n => {
      edges.push({
        from: rootId,
        to: n.id,
        direction: Direction.To
      })
    });
  }
}
