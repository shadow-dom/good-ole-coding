import type { Component } from 'solid-js';
import { For, Show, createSignal } from 'solid-js';
import { ThemeProvider, useTheme, themes } from './theme';
import { useSpacebarRate } from './useSpacebarRate';
import ParticleCanvas from './ParticleCanvas';

const StarterContent: Component = () => {
  const { theme, setThemeIndex, themeIndex } = useTheme();
  const { intensity, tapsPerSec } = useSpacebarRate();
  const [showInfo, setShowInfo] = createSignal(true);

  return (
    <div
      class="relative min-h-screen overflow-hidden transition-colors duration-700"
      style={{ background: theme().bg, color: theme().text }}
    >
      <ParticleCanvas intensity={intensity} />

      {/* Theme switcher */}
      <div class="fixed top-6 right-6 z-20 flex gap-2">
        <For each={themes}>
          {(t, i) => (
            <button
              onClick={() => setThemeIndex(i())}
              class="w-8 h-8 rounded-full border-2 transition-all duration-300 cursor-pointer hover:scale-125"
              style={{
                background: t.particleColors[0],
                "border-color": themeIndex() === i() ? t.text : 'transparent',
                "box-shadow": themeIndex() === i() ? `0 0 12px ${t.glow}` : 'none',
              }}
              title={t.name}
            />
          )}
        </For>
      </div>

      {/* Main content */}
      <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div class="text-center max-w-2xl">
          {/* Logo / Title */}
          <h1
            class="text-7xl font-black tracking-tighter mb-2 transition-all duration-300"
            style={{
              "text-shadow": `0 0 ${20 + intensity() * 40}px ${theme().glow}`,
              transform: `scale(${1 + intensity() * 0.05})`,
            }}
          >
            <span style={{ color: theme().accent }}>go</span>
            <span class="opacity-40">-</span>
            <span>solid</span>
          </h1>

          <p
            class="text-lg mb-10 transition-colors duration-700"
            style={{ color: theme().muted }}
          >
            Go backend + SolidJS frontend starter
          </p>

          {/* Spacebar meter */}
          <div class="mb-10">
            <div
              class="mx-auto h-1.5 rounded-full overflow-hidden transition-all duration-300"
              style={{
                width: '280px',
                background: theme().muted + '33',
              }}
            >
              <div
                class="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${intensity() * 100}%`,
                  background: `linear-gradient(90deg, ${theme().particleColors[0]}, ${theme().particleColors[1]})`,
                  "box-shadow": `0 0 ${8 + intensity() * 16}px ${theme().glow}`,
                }}
              />
            </div>
            <p
              class="text-xs mt-3 tracking-widest uppercase transition-colors duration-700"
              style={{ color: theme().muted }}
            >
              <kbd
                class="inline-block px-2 py-0.5 rounded text-[10px] mr-1.5 border transition-all duration-150"
                style={{
                  "border-color": theme().muted + '66',
                  background: intensity() > 0 ? theme().accent + '22' : 'transparent',
                  color: intensity() > 0 ? theme().accent : theme().muted,
                }}
              >
                space
              </kbd>
              {tapsPerSec()} taps/s &middot; particle velocity {Math.round((1 + intensity() * 5) * 100)}%
            </p>
          </div>

          {/* Feature cards */}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <FeatureCard
              icon="⚡"
              title="Gin API"
              desc="Fast HTTP with SSE streaming"
            />
            <FeatureCard
              icon="🧩"
              title="SolidJS"
              desc="Reactive UI with fine-grained updates"
            />
            <FeatureCard
              icon="🎨"
              title="Tailwind v4"
              desc="Utility-first CSS, zero config"
            />
          </div>

          {/* Info toggle */}
          <Show when={showInfo()}>
            <div
              class="text-sm rounded-xl px-6 py-4 backdrop-blur-sm border transition-all duration-700"
              style={{
                background: theme().accent + '08',
                "border-color": theme().accent + '22',
                color: theme().muted,
              }}
            >
              Tap <kbd class="px-1.5 py-0.5 rounded border text-xs" style={{ "border-color": theme().muted + '44' }}>spacebar</kbd> rapidly to accelerate particles.
              Switch themes with the dots above.
              Mouse repels nearby particles.
              <button
                onClick={() => setShowInfo(false)}
                class="ml-3 underline opacity-60 hover:opacity-100 cursor-pointer"
              >
                dismiss
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        class="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 text-xs transition-colors duration-700"
        style={{ color: theme().muted }}
      >
        <span>Theme: {theme().name}</span>
        <span>{PARTICLE_COUNT} particles</span>
      </div>
    </div>
  );
};

const PARTICLE_COUNT = 180;

const FeatureCard: Component<{ icon: string; title: string; desc: string }> = (props) => {
  const { theme } = useTheme();

  return (
    <div
      class="rounded-xl p-5 border backdrop-blur-sm transition-all duration-500 hover:scale-[1.03]"
      style={{
        background: theme().accent + '08',
        "border-color": theme().accent + '18',
      }}
    >
      <div class="text-2xl mb-2">{props.icon}</div>
      <h3 class="font-semibold mb-1" style={{ color: theme().accent }}>{props.title}</h3>
      <p class="text-xs" style={{ color: theme().muted }}>{props.desc}</p>
    </div>
  );
};

const App: Component = () => {
  return (
    <ThemeProvider>
      <StarterContent />
    </ThemeProvider>
  );
};

export default App;
