import { ChangeDetectionStrategy } from '@angular/core';
import { DirectiveSymbol, ProviderSymbol, PipeSymbol } from 'ngast';
import { Metadata } from '../../shared/data-format';
import { StaticSymbol, ElementAst } from '@angular/compiler';

const _changeDetectionToString = (cd: ChangeDetectionStrategy | null): string | null => {
  switch (cd) {
    case ChangeDetectionStrategy.Default:
      return 'Default';
    case ChangeDetectionStrategy.OnPush:
      return 'OnPush';
  }
  return null;
};

export const getProviderMetadata = (provider: ProviderSymbol): Metadata => {
  const meta = provider.getMetadata();
  const deps = (meta.deps || []).map(d => {
    const t = d.token;
    if (t) {
      if (t.identifier) {
        return t.identifier.reference.name;
      }
      return t.value;
    };
    return 'Undefined';
  }).join(', ');
  let filePath = null;
  let name = meta.token.value;
  if (meta.token.identifier) {
    filePath = meta.token.identifier.reference.filePath;
    name = meta.token.identifier.reference.name;
  }
  return {
    filePath,
    properties: [
      { key: 'Name', value: name },
      { key: 'Multiprovider', value: (meta.multi === true).toString() },
      { key: 'Dependencies', value: deps }
    ]
  };
};

export const getPipeMetadata = (pipe: PipeSymbol): Metadata => {
  const meta = pipe.getMetadata();
  return {
    filePath: pipe.symbol.filePath,
    properties: [
      { key: 'Name', value: (meta || { name: 'Unknown' }).name },
      { key: 'Pure', value: ((meta || { pure: true }).pure === true).toString() }
    ]
  };
};

export const getDirectiveMetadata = (dir: DirectiveSymbol): Metadata => {
  const meta = dir.getNonResolvedMetadata() || {
    selector: 'Unknown',
    isComponent: false,
    changeDetection: null,
    exportAs: null
  };
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
