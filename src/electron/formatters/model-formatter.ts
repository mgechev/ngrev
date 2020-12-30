import { ChangeDetectionStrategy } from '@angular/core';
import { ComponentSymbol, DirectiveSymbol, InjectableSymbol, NgModuleSymbol, PipeSymbol } from 'ngast';
import { Metadata } from '../../shared/data-format';
import { TmplAstElement } from '@angular/compiler';

const _changeDetectionToString = (cd: ChangeDetectionStrategy | undefined): string | null => {
  switch (cd) {
    case ChangeDetectionStrategy.Default:
      return 'Default';
    case ChangeDetectionStrategy.OnPush:
      return 'OnPush';
  }
  return null;
};

export const getProviderMetadata = (provider: InjectableSymbol): Metadata => {
  const deps = provider.getDependencies();
  return {
    filePath: provider.path,
    properties: [
      { key: 'Name', value: provider.name },
      // { key: 'Multiprovider', value: (meta.multi === true).toString() },
      { key: 'Dependencies', value: deps.map(dep => dep.name).join(', ') }
    ]
  };
};

export const getPipeMetadata = (pipe: PipeSymbol): Metadata => {
  return {
    filePath: pipe.path,
    properties: [
      { key: 'Name', value: pipe.name },
      // { key: 'Pure', value: ((meta || { pure: true }).pure === true).toString() }
    ]
  };
};

export const getDirectiveMetadata = (dir: DirectiveSymbol | ComponentSymbol): Metadata => {
  const meta = dir.metadata;
  const getChangeDetection = () => {
    if (dir instanceof ComponentSymbol) {
      return dir.metadata.changeDetection;
    }
    return undefined;
  };
  return {
    filePath: dir.path,
    properties: [
      { key: 'Selector', value: meta.selector },
      { key: 'Component', value: (dir.annotation === 'Component').toString() },
      { key: 'Change Detection', value: _changeDetectionToString(getChangeDetection()) },
      { key: 'Export', value: (meta.exportAs || []).join(', ') }
    ]
  };
};

export const getElementMetadata = (el: TmplAstElement): Metadata => {
  return {
    properties: [
      { key: 'Name', value: el.name },
      // { key: 'Directives', value: el.directives.map(d => d.directive.type.reference.name).join(', ') },
      // { key: 'Attributes', value: el.attrs.map(a => `[${a.name}=${a.value}]`).join(', ') }
    ]
  };
};

export const getModuleMetadata = (node: NgModuleSymbol): Metadata => {
  return {
    filePath: node.path,
    properties: [{ key: 'Name', value: node.name }]
  };
};
