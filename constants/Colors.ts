const tintColorLight = '#4facfe';
const tintColorDark = '#fff';

export const Colors = {
    light: {
        text: '#2D3436',
        background: '#F4F6FA',
        tint: tintColorLight,
        icon: '#636E72',
        tabIconDefault: '#636E72',
        tabIconSelected: tintColorLight,
    },
    dark: {
        text: '#fff',
        background: '#000',
        tint: tintColorDark,
        icon: '#ccc',
        tabIconDefault: '#ccc',
        tabIconSelected: tintColorDark,
    },
    // Custom Palette
    primary: '#FFB142', // Orange
    secondary: '#a18cd1',
    accent: '#ff9a9e',
    background: '#F4F6FA',
    surface: '#FFFFFF',
    text: '#2D3436',
    textSecondary: '#636E72',
    success: '#00b894',
    warning: '#FFB142', // Orange (was Gold/Yellow)
    orange: '#F39C12',
    error: '#ff7675',

    gradients: {
        blue: ['#4facfe', '#00f2fe'] as const,
        purple: ['#a18cd1', '#fbc2eb'] as const,
        pink: ['#ff9a9e', '#fecfef'] as const,
        orange: ['#f6d365', '#fda085'] as const,
        pastel: ['#64B5F6', '#FF9A9E'] as const,
        abstract: ['#EBF4FF', '#E6E6FA', '#F2E6F7'] as const,
    }
};
