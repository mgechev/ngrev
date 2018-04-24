import { Theme } from './color-map';
import { SymbolTypes } from '../../shared/data-format';

export const MaterialTheme: Theme = {
  name: 'Material',
  background: '#ffffff',
  fuzzySearch: {
    font: '#000',
    background: '#fff',
    border: '#ccc',
    shadowColor: '#000',
    selected: '#ccc'
  },
  historyLabel: '#000',
  legend: {
    background: 'rgba(255, 255, 255, 0.8)',
    font: '#fff',
    title: '#555',
    border: '1px solid #999'
  },
  backButton: {
    border: 'none',
    background: '#eee',
    font: '#000'
  },
  arrow: {
    color: '#555555',
    highlight: '#333333'
  },
  [SymbolTypes.Component]: {
    margin: 10,
    color: {
      background: '#2196F3',
      border: '#1E88E5',
      highlight: {
        background: '#2196F3',
        border: '#1E88E5'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.ComponentOrDirective]: {
    margin: 10,
    color: {
      background: '#FF5722',
      border: '#E64A19',
      highlight: {
        background: '#FF5722',
        border: '#E64A19'
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
  [SymbolTypes.LazyModule]: {
    margin: 10,
    color: {
      background: '#009688',
      border: '#7FCAC3',
      highlight: {
        background: '#009688',
        border: '#7FCAC3'
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
      background: '#CDDC39',
      border: '#9E9D24',
      highlight: {
        background: '#CDDC39',
        border: '#9E9D24'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.Pipe]: {
    margin: 10,
    color: {
      background: '#FF9800',
      border: '#F57C00',
      highlight: {
        background: '#FF9800',
        border: '#F57C00'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  }
};
