import { SymbolTypes } from '../../../shared/data-format';

export const NodeTypeColorMap = {
  [SymbolTypes.Component]: {
    margin: 10,
    color: {
      background: '#2196F3',
      border: '#1E88E5',
      highlight: {
        background: '#2196F3',
        border: '#1E88E5',
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.ComponentWithDirective]: {
    margin: 10,
    color: {
      background: '#03A9F4',
      border: '#039BE5',
      highlight: {
        background: '#03A9F4',
        border: '#039BE5'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.HtmlElement]: {
    margin: 10,
    color: {
      background: '#00BCD4',
      border: '#00ACC1',
      highlight: {
        background: '#00BCD4',
        border: '#00ACC1'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.HtmlElementWithDirective]: {
    margin: 10,
    color: {
      background: '#009688',
      border: '#00897B',
      highlight: {
        background: '#009688',
        border: '#00897B'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.Meta]: {
    margin: 10,
    color: {
      background: '#4CAF50',
      border: '#4CAF50',
      highlight: {
        background: '#4CAF50',
        border: '#4CAF50'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.Module]: {
    margin: 10,
    color: {
      background: '#8BC34A',
      border: '#7CB342',
      highlight: {
        background: '#8BC34A',
        border: '#7CB342'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.Provider]: {
    margin: 10,
    color: {
      background: '#FFEB3B',
      border: '#FBC02D',
      highlight: {
        background: '#FFEB3B',
        border: '#FBC02D'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  }
};

export const DefaultColor = {
  margin: 10,
  color: {
    background: '#FFEB3B',
    border: '#FDD835',
    highlight: {
      background: '#FFEB3B',
      border: '#FDD835'
    }
  },
  labelHighlightBold: false,
  font: {
    color: '#000000'
  }
};
