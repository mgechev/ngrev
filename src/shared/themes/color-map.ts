import { SymbolTypes, Direction, SymbolType } from '../../shared/data-format';
import { MaterialTheme } from './material';

export const DefaultTheme = MaterialTheme.name;

export const BuiltInThemesMap = {
  [MaterialTheme.name]: MaterialTheme
};

export interface BoxHighlightColor {
  background: string;
  border: string;
}

export interface BoxColor {
  background: string;
  border: string;
  highlight: BoxHighlightColor;
}

export interface BoxFont {
  color: string;
}

export interface BoxTheme {
  margin: number;
  color: BoxColor;
  labelHighlightBold: boolean;
  font: BoxFont;
}

export interface LegendTheme {
  background: string;
  font: string;
  title: string;
  border: string;
}

export interface BackButtonTheme {
  background: string;
  font: string;
  border: string;
}

export interface ArrowTheme {
  color: string;
  highlight: string;
}

export interface Theme {
  name: string;
  historyLabel: string;
  legend: LegendTheme;
  backButton: BackButtonTheme;
  background: string;
  arrow: ArrowTheme;
  [SymbolTypes.Component]: BoxTheme;
  [SymbolTypes.ComponentOrDirective]: BoxTheme;
  [SymbolTypes.ComponentWithDirective]: BoxTheme;
  [SymbolTypes.HtmlElement]: BoxTheme;
  [SymbolTypes.HtmlElementWithDirective]: BoxTheme;
  [SymbolTypes.Module]: BoxTheme;
  [SymbolTypes.LazyModule]: BoxTheme;
  [SymbolTypes.Provider]: BoxTheme;
  [SymbolTypes.Pipe]: BoxTheme;
}

export const DefaultColor = {
  margin: 10,
  color: {
    background: '#90A4AE',
    border: '#607D8B',
    highlight: {
      background: '#90A4AE',
      border: '#607D8B'
    }
  },
  labelHighlightBold: false,
  font: {
    color: '#FFFFFF'
  }
};
