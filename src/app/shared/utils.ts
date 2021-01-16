import { StaticSymbol } from '@angular/compiler';
import { AnnotationNames } from 'ngast';

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
