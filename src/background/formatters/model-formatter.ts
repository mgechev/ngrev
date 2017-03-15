import { ChangeDetectionStrategy } from '@angular/core';
import { DirectiveSymbol, ProviderSymbol } from 'ngast';
import { Metadata } from '../../shared/data-format';
import { StaticSymbol, ElementAst } from '@angular/compiler';

const _changeDetectionToString = (cd: ChangeDetectionStrategy) => {
  switch (cd) {
    case ChangeDetectionStrategy.Default:
      return 'Default';
    case ChangeDetectionStrategy.OnPush:
      return 'OnPush';
  }
};

export const getProviderMetadata = (provider: ProviderSymbol): Metadata => {
  const meta = provider.getMetadata();
  const deps = (meta.deps || []).map(d => d.token.identifier.reference.name).join(', ');
  return {
    filePath: provider.symbol.filePath,
    properties: [
      { key: 'Name', value: provider.symbol.name },
      { key: 'Multiprovider', value: meta.multi.toString() },
      { key: 'Dependencies', value: deps }
    ]
  };
};

export const getDirectiveMetadata = (dir: DirectiveSymbol): Metadata => {
  const meta = dir.getNonResolvedMetadata();
  return {
    filePath: dir.symbol.filePath,
    properties: [
      { key: 'Selector', value: meta.selector },
      { key: 'Component', value: meta.isComponent.toString() },
      { key: 'Change Detection', value: _changeDetectionToString(meta.changeDetection) },
      { key: 'Export', value: meta.exportAs }
    ]
  };
};

export const getElementMetadata = (el: ElementAst): Metadata => {
  return {
    properties: [
      { key: 'Name', value: el.name },
      { key: 'Directives', value: el.directives.map(d => d.directive.type.reference.name).join(', ') },
      { key: 'Attributes', value: el.attrs.map(a => `[${a.name}=${a.value}]`).join(', ') }
    ]
  };
};

export const getModuleMetadata = (node: StaticSymbol): Metadata => {
  return {
    filePath: node.filePath,
    properties: [
      { key: 'Name', value: node.name },
      { key: 'Members', value: node.members.join('\n') }
    ]
  };
};