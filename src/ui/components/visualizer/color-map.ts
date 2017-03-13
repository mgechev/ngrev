import { SymbolTypes } from '../../../shared/data-format';

export const NodeTypeColorMap = {
  [SymbolTypes.Component]: {
    color: {
      background: '#f8f800',
      border: '#fcda1e',
      highlight: {
        background: '#f8f800',
        border: '#fcda1e',
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.ComponentWithDirective]: {
    color: {
      background: '#FFC0CB',
      border: '#FFB8C5',
      highlight: {
        background: '#FFC0CB',
        border: '#FFB8C5'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.HtmlElement]: {
    color: {
      background: '#C2FABC',
      border: '#000000',
      highlight: {
        background: '#C2FABC',
        border: '#000000'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.HtmlElementWithDirective]: {
    color: {
      background: '#ffa807',
      border: '#e5a124',
      highlight: {
        background: '#ffa807',
        border: '#e5a124'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.Meta]: {
    color: {
      background: '#c8c8c8',
      border: '#000000',
      highlight: {
        background: '#c8c8c8',
        border: '#000000'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.Module]: {
    color: {
      background: '#97C2FC',
      border: '#000000',
      highlight: {
        background: '#97C2FC',
        border: '#000000'
      }
    },
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.Provider]: {
    color: {
      background: '#EB7DF4',
      border: '#EA79F4',
      highlight: {
        background: '#EB7DF4',
        border: '#EA79F4'
      }
    },
    font: {
      color: '#000000'
    }
  }
};

export const DefaultColor = {
  color: {
    background: '#ffffff',
    border: '#000000',
    highlight: {
      background: '#ffffff',
      border: '#000000'
    }
  },
  font: {
    color: '#000000'
  }
};
