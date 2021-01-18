export const formatError = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  } else {
    try {
      return JSON.stringify(error);
    } catch (e) {
      console.log('Cannot serialize the error', e);
    }
  }
  return '';
};

export const isMetaNodeId = (id: string): boolean => {
  return id.split('#').length !== 2;
};
