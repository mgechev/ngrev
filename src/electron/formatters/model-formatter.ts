import { ChangeDetectionStrategy } from '@angular/core';
import {
  ComponentSymbol,
  DirectiveSymbol,
  InjectableSymbol,
  NgModuleSymbol,
  PipeSymbol,
  TemplateNode,
} from 'ngast';
import { Metadata } from '../../shared/data-format';

const _changeDetectionToString = (
  cd: ChangeDetectionStrategy | undefined
): string | null => {
  switch (cd) {
    case ChangeDetectionStrategy.Default:
      return 'Default';
    case ChangeDetectionStrategy.OnPush:
      return 'OnPush';
  }
  return null;
};

export const getInjectableMetadata = (injectable: InjectableSymbol): Metadata => {
  const deps = injectable.getDependencies();
  return {
    filePath: injectable.path,
    properties: [
      { key: 'Name', value: injectable.name },
      // { key: 'Multiprovider', value: (meta.multi === true).toString() },
      { key: 'Dependencies', value: deps.map((dep) => dep.name).join(', ') },
    ],
  };
};

export const getPipeMetadata = (pipe: PipeSymbol): Metadata => {
  return {
    filePath: pipe.path,
    properties: [
      { key: 'Name', value: pipe.name },
      // { key: 'Pure', value: ((meta || { pure: true }).pure === true).toString() }
    ],
  };
};

export const getDirectiveMetadata = (
  dir: DirectiveSymbol | ComponentSymbol
): Metadata | null => {
  const meta = dir.metadata;
  if (!meta) {
    return null;
  }
  const getChangeDetection = () => {
    if (dir instanceof ComponentSymbol) {
      // TODO: ngast doesn't export ComponentMetadata
      return (meta as ComponentSymbol['metadata'])?.changeDetection;
    }
    return undefined;
  };
  return {
    filePath: dir.path,
    properties: [
      { key: 'Selector', value: meta.selector },
      { key: 'Component', value: (dir.annotation === 'Component').toString() },
      {
        key: 'Change Detection',
        value: _changeDetectionToString(getChangeDetection()),
      },
      { key: 'Export', value: (meta.exportAs || []).join(', ') },
    ],
  };
};

export const getElementMetadata = (el: TemplateNode): Metadata => {
  return {
    properties: [
      { key: 'Name', value: el.name },
      { key: 'Directives', value: el.directives.map(d => d.name).join(', ') },
      { key: 'Attributes', value: el.attributes.map(a => `[${a}]`).join(', ') },
      { key: 'References', value: el.references.map(r => `[${r}]`).join(', ') },
    ],
  };
};

export const getModuleMetadata = (node: NgModuleSymbol): Metadata => {
  return {
    filePath: node.path,
    properties: [{ key: 'Name', value: node.name }],
  };
};
