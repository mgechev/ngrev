import { StaticSymbol } from '@angular/compiler';

export interface SymbolWithId extends StaticSymbol {
  id: string;
}

export const formatError = (error: any) => {
  if (typeof error === 'string') {
    return error;
  } else {
    try {
      error = JSON.stringify(error);
    } catch (e) {
      console.log('Cannot serialize the error', e);
    }
    return error;
  }
};

export const isMetaNodeId = (id: string) => {
  return id.split('#').length !== 2;
};
