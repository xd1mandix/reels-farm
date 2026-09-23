import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    theme: {
      light: {
        colors: {
          buttonPrimary500: '#BDE6A2',
          buttonPrimary600: '#73BE57',

          primary100: '#E5F5E1',
          primary200: '#E1FFD8',
          primary500: '#81D667',
          primary600: '#5D9E45',
          primary700: '#6EAD60',
          secondary100: '#F4FFEA',
          secondary200: '#CFFFB8',
          secondary500: '#6CCE58',
          secondary600: '#48AF0C',
          secondary700: '#2F9600',

          neutral0: '#FFFFFF',
          neutral100: '#ECEAE7',
          neutral1000: '#182618',
          neutral150: '#D3D1CE',
          neutral200: '#F0ECE8',
          neutral300: '#DBD6CA',
          neutral400: '#D6CEC4',
          neutral500: '#CABBAF',
          neutral600: '#978A79',
          neutral700: '#6A584A',
          neutral800: '#4D4032',
          neutral900: '#342C21',
        },
      },
      dark: {
        colors: {
          primary600: '#A4F185',
        },
      },
    },
    locales: [
      // 'ar',
      // 'fr',
      // 'cs',
      // 'de',
      // 'dk',
      // 'es',
      // 'he',
      // 'id',
      // 'it',
      // 'ja',
      // 'ko',
      // 'ms',
      // 'nl',
      // 'no',
      // 'pl',
      // 'pt-BR',
      // 'pt',
      'ru',
      // 'sk',
      // 'sv',
      // 'th',
      // 'tr',
      // 'uk',
      // 'vi',
      // 'zh-Hans',
      // 'zh',
    ],
  },
  bootstrap(app: StrapiApp) {
    console.log(app);
  },
};
