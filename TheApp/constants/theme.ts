export const Colors = {
  // Base
  bg: '#0A0A0F',
  bgCard: '#111118',
  bgElevated: '#18181F',
  border: '#1E1E2A',
  borderLight: '#2A2A38',

  // Brand
  gold: '#C9A84C',
  goldLight: '#E4C470',
  goldDim: '#7A6030',

  // Text
  text: '#F0EDE8',
  textSecondary: '#8A8799',
  textMuted: '#4A4860',

  // Semantic
  success: '#2ECC71',
  successDim: '#1A7A42',
  warning: '#F39C12',
  warningDim: '#7A5009',
  danger: '#E74C3C',
  dangerDim: '#7A2018',
  info: '#3498DB',
  infoDim: '#1A4F7A',

  // Status chips
  statusColors: {
    active: '#2ECC71',
    suspended: '#E74C3C',
    pending: '#F39C12',
    draft: '#8A8799',
    published: '#2ECC71',
    archived: '#4A4860',
    paid: '#2ECC71',
    processing: '#3498DB',
    shipped: '#9B59B6',
    delivered: '#2ECC71',
    cancelled: '#E74C3C',
    refunded: '#F39C12',
    pending_payment: '#F39C12',
    open: '#3498DB',
    resolved: '#2ECC71',
    closed: '#8A8799',
    low: '#2ECC71',
    medium: '#F39C12',
    high: '#E74C3C',
    urgent: '#FF0000',
  } as Record<string, string>,
};

export const Typography = {
  displayLarge: { fontFamily: 'serif', fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  displayMedium: { fontFamily: 'serif', fontSize: 24, fontWeight: '600' as const },
  heading: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  subheading: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodySmall: { fontSize: 13, fontWeight: '400' as const },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  mono: { fontFamily: 'monospace', fontSize: 13 },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};
