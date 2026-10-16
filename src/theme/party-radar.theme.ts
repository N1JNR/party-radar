import { PoTheme, PoThemeTypeEnum } from '@po-ui/ng-components';

/**
 * Tema escuro do Party Radar para o PO UI.
 *
 * Ponto de partida feito à mão com a paleta do design. Para refinar,
 * gere o tema no construtor (https://po-ui.io/construtor-de-temas)
 * e substitua os tokens abaixo pelo que ele exportar.
 */
export const partyRadarTheme: PoTheme = {
  name: 'party-radar',
  type: {
    dark: {
      color: {
        brand: {
          '01': {
            lightest: '#F0ECFF',
            lighter: '#D5CBFF',
            light: '#A996FF',
            base: '#6E4BFF',
            dark: '#5636E0',
            darker: '#3F25B0',
            darkest: '#24168A',
          },
          '02': { base: '#22D3EE' },
          '03': { base: '#FBBF24' },
        },
        action: {
          default: '#6E4BFF',
          hover: '#5636E0',
          pressed: '#3F25B0',
          disabled: '#30363D',
          focus: '#A996FF',
        },
        neutral: {
          light: {
            '00': '#0E1117',
            '05': '#121722',
            '10': '#161B22',
            '20': '#21262D',
            '30': '#30363D',
          },
          mid: { '40': '#6E7681', '60': '#8B949E' },
          dark: { '70': '#9BA6B2', '80': '#C9D1D9', '90': '#E6EDF3', '95': '#F5F8FA' },
        },
        feedback: {
          positive: { base: '#22C55E' },
          warning: { base: '#F59E0B' },
          negative: { base: '#EF4444' },
          info: { base: '#22D3EE' },
        },
      },
    },
  },
  active: PoThemeTypeEnum.dark,
};
