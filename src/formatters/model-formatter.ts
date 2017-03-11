import { ChangeDetectionStrategy } from '@angular/core';
import { DirectiveSymbol } from 'ngast';
import { Metadata } from './data-format';
import { StaticSymbol } from '@angular/compiler';

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
    { key: 'Component', value: meta.isComponent },
    { key: 'Change Cetection', value: _changeDetectionToString(meta.changeDetection) },
    { key: 'Export', value: meta.exportAs }
  ];
};

export const getModuleMetadata = (node: StaticSymbol): Metadata => {
  return [
    { key: 'Name', value: node.name },
    { key: 'Members', value: node.members.join('\n') }
  ];
};