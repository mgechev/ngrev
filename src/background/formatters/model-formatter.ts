import { ChangeDetectionStrategy } from '@angular/core';
import { DirectiveSymbol } from 'ngast';
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

export const getDirectiveMetadata = (dir: DirectiveSymbol) => {
  const meta = dir.getNonResolvedMetadata();
  return [
    { key: 'Selector', value: meta.selector },
    { key: 'Component', value: meta.isComponent.toString() },
    { key: 'Change Detection', value: _changeDetectionToString(meta.changeDetection) },
    { key: 'Export', value: meta.exportAs }
  ];
};

export const getElementMetadata = (el: ElementAst) => {
  return [
    { key: 'Name', value: el.name },
    { key: 'Directives', value: el.directives.map(d => d.directive.type.reference.name).join(', ') },
    { key: 'Attributes', value: el.attrs.map(a => `[${a.name}=${a.value}]`).join(', ') }
  ];
};

export const getModuleMetadata = (node: StaticSymbol): Metadata => {
  return [
    { key: 'Name', value: node.name },
    { key: 'Members', value: node.members.join('\n') }
  ];
};