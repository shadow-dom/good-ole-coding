import { createContext, useContext, createSignal, type ParentComponent } from 'solid-js';

export interface Theme {
  name: string;
  bg: string;
  particleColors: string[];
  accent: string;
  text: string;
  muted: string;
  glow: string;
}

export const themes: Theme[] = [
  {
    name: 'Void',
    bg: '#0a0a0f',
    particleColors: ['#6366f1', '#818cf8', '#a5b4fc', '#4f46e5'],
    accent: '#818cf8',
    text: '#e2e8f0',
    muted: '#475569',
    glow: 'rgba(99, 102, 241, 0.4)',
  },
  {
    name: 'Solar',
    bg: '#1a0a00',
    particleColors: ['#f97316', '#fb923c', '#fdba74', '#ea580c'],
    accent: '#fb923c',
    text: '#fff7ed',
    muted: '#9a3412',
    glow: 'rgba(249, 115, 22, 0.4)',
  },
  {
    name: 'Biolume',
    bg: '#001a0a',
    particleColors: ['#10b981', '#34d399', '#6ee7b7', '#059669'],
    accent: '#34d399',
    text: '#ecfdf5',
    muted: '#065f46',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  {
    name: 'Neon',
    bg: '#0f000f',
    particleColors: ['#e879f9', '#f0abfc', '#d946ef', '#a855f7'],
    accent: '#e879f9',
    text: '#fdf4ff',
    muted: '#86198f',
    glow: 'rgba(232, 121, 249, 0.4)',
  },
  {
    name: 'Arctic',
    bg: '#020617',
    particleColors: ['#38bdf8', '#7dd3fc', '#bae6fd', '#0284c7'],
    accent: '#38bdf8',
    text: '#f0f9ff',
    muted: '#0c4a6e',
    glow: 'rgba(56, 189, 248, 0.4)',
  },
];

interface ThemeContextValue {
  theme: () => Theme;
  setThemeIndex: (i: number) => void;
  themeIndex: () => number;
}

const ThemeContext = createContext<ThemeContextValue>();

export const ThemeProvider: ParentComponent = (props) => {
  const [idx, setIdx] = createSignal(0);
  const theme = () => themes[idx()];

  return (
    <ThemeContext.Provider value={{ theme, setThemeIndex: setIdx, themeIndex: idx }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
