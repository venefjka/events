export const typography = {
  // Заголовки
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  
  // Текст
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyLargeBold: {
    fontSize: 17,
    fontWeight: '700' as const,
    lineHeight: 24,
  },
  
  // Малый текст
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  captionSmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  captionSmallBold: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  
  // Кнопки
  button: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  buttonLarge: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  
  // Специальные
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  overline: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  logo: {
    fontSize: 48,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
};

export type TypographyKey = keyof typeof typography;
