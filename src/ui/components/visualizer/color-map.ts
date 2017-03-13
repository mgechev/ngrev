import { SymbolTypes } from '../../../shared/data-format';

export const NodeTypeColorMap = {
  [SymbolTypes.Component]: {
    color: {
      background: '#4D9F00',
      border: '#4D9F00',
      highlight: {
        background: '#4D9F00',
        border: '#4D9F00',
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.ComponentWithDirective]: {
    color: {
      background: '#64A303',
      border: '#64A303',
      highlight: {
        background: '#64A303',
        border: '#64A303'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.HtmlElement]: {
    color: {
      background: '#ABC001',
      border: '#ABC001',
      highlight: {
        background: '#ABC001',
        border: '#ABC001'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.HtmlElementWithDirective]: {
    color: {
      background: '#EDD503',
      border: '#EDD503',
      highlight: {
        background: '#EDD503',
        border: '#EDD503'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#000000'
    }
  },
  [SymbolTypes.Meta]: {
    color: {
      background: '#3A3E91',
      border: '#3A3E91',
      highlight: {
        background: '#3A3E91',
        border: '#3A3E91'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.Module]: {
    color: {
      background: '#F8B600',
      border: '#F8B600',
      highlight: {
        background: '#F8B600',
        border: '#F8B600'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
    }
  },
  [SymbolTypes.Provider]: {
    color: {
      background: '#FE7E01',
      border: '#FE7E01',
      highlight: {
        background: '#FE7E01',
        border: '#FE7E01'
      }
    },
    labelHighlightBold: false,
    font: {
      color: '#FFFFFF'
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
  labelHighlightBold: false,
  font: {
    color: '#000000'
  }
};
