export const DefaultTheme = 'Light';

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

export interface FuzzySearchTheme {
  font: string;
  background: string;
  border: string;
  shadowColor: string;
  selected: string;
}

export interface Theme {
  name: string;
  historyLabel: string;
  legend: LegendTheme;
  backButton: BackButtonTheme;
  background: string;
  arrow: ArrowTheme;
  fuzzySearch: FuzzySearchTheme;
  component: BoxTheme;
  'component-or-directive': BoxTheme;
  'component-with-directive': BoxTheme;
  'html-element': BoxTheme;
  'html-element-with-directive': BoxTheme;
  module: BoxTheme;
  'lazy-module': BoxTheme;
  provider: BoxTheme;
  pipe: BoxTheme;
}

export const DefaultColor: BoxTheme = {
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
