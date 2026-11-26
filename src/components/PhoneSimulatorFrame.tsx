import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { BatteryFull, Maximize, Minimize, Wifi, X } from './DekIcons';
import { isSoundEnabled, setSoundEnabled, subscribeSound } from '../utils/soundFx';

interface PhoneSimulatorFrameProps {
  children: ReactNode;
}

interface DevicePreset {
  id: string;
  label: string;
  shortLabel: string;
  width: number;
  height: number;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'std', label: 'Android Standard', shortLabel: '390×844', width: 390, height: 844 },
  { id: 'large', label: 'Android Grand', shortLabel: '412×915', width: 412, height: 915 },
  { id: 'compact', label: 'Compact', shortLabel: '360×780', width: 360, height: 780 },
];

export function PhoneSimulatorFrame({ children }: PhoneSimulatorFrameProps) {
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [presetId, setPresetId] = useState<string>('std');
  const soundOn = useSyncExternalStore(subscribeSound, isSoundEnabled);
  const [showScrcpyHelp, setShowScrcpyHelp] = useState(false);
  const [clock, setClock] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [viewportH, setViewportH] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerHeight : 900,
  );

  useEffect(() => {
    const onResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
      setViewportH(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setClock(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      );
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const toggleSound = () => setSoundEnabled(!soundOn);

  // Sur téléphone réel (< 768px) ou en mode plein écran mobile : rendu natif sans châssis
  if (isMobileScreen || fullScreenMode) {
    return (
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-ink">
        {fullScreenMode && !isMobileScreen && (
          <button
            onClick={() => setFullScreenMode(false)}
            className="absolute right-3 top-3 z-[900] flex items-center gap-1.5 rounded-full bg-tile px-3 py-1.5 text-[12px] font-semibold text-fg transition hover:bg-rim"
          >
            <Minimize className="h-3.5 w-3.5" /> Quitter le plein écran
          </button>
        )}
        <div className="relative flex h-full w-full flex-col overflow-hidden">{children}</div>
      </div>
    );
  }

  const preset = DEVICE_PRESETS.find((p) => p.id === presetId) ?? DEVICE_PRESETS[0];
  // Adapter l'échelle si la fenêtre desktop est moins haute que le téléphone choisi
  const availableH = Math.max(540, viewportH - 96);
  const scale = Math.min(1, availableH / (preset.height + 24));

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#08090B] px-4 py-3">
      {/* Barre d'outils desktop */}
      <div className="z-20 mb-3 flex flex-wrap items-center justify-center gap-1 rounded-full bg-card px-2 py-1.5">
        <div className="flex items-center gap-1">
          {DEVICE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPresetId(p.id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                presetId === p.id ? 'bg-tile text-fg' : 'text-mute hover:text-fg'
              }`}
              title={p.label}
            >
              {p.label.replace('Android ', '')} · {p.shortLabel}
            </button>
          ))}
        </div>

        <div className="mx-1 h-4 w-px bg-rim" />

        <button
          onClick={toggleSound}
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-mute transition hover:text-fg"
          title="Activer ou couper les effets sonores"
        >
          {soundOn ? 'Son activé' : 'Son coupé'}
        </button>

        <button
          onClick={() => setFullScreenMode(true)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-mute transition hover:text-fg"
          title="Afficher en plein écran"
        >
          <Maximize className="h-3.5 w-3.5" /> Plein écran
        </button>

        <button
          onClick={() => setShowScrcpyHelp((v) => !v)}
          className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
            showScrcpyHelp ? 'bg-tile text-fg' : 'text-mute hover:text-fg'
          }`}
          title="Afficher les commandes pour tester sur ton vrai téléphone avec scrcpy"
        >
          Test scrcpy
        </button>
      </div>

      {/* Aide rapide scrcpy / téléphone réel */}
      {showScrcpyHelp && (
        <div className="z-30 mb-3 w-full max-w-lg rounded-[24px] bg-card p-4 text-[12px] text-fg">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold">Tester sur ton téléphone (ADB + scrcpy)</span>
            <button
              onClick={() => setShowScrcpyHelp(false)}
              aria-label="Fermer"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-tile text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[12px] leading-4 text-mute">
            Branche ton Android en USB (Débogage USB activé) puis lance ces commandes dans PowerShell
            pour voir ton téléphone sur PC et ouvrir l’app avec GPS et caméra réels :
          </p>
          <div className="mt-2 space-y-1 rounded-2xl bg-ink p-3 font-mono text-[12px] text-lime">
            <div>adb reverse tcp:5173 tcp:5173</div>
            <div>scrcpy</div>
          </div>
          <p className="mt-2 text-[12px] leading-4 text-mute">
            Puis ouvre <span className="font-semibold text-fg">http://localhost:5173</span> sur
            Chrome mobile (ou en Wi-Fi via <span className="text-fg">http://&lt;IP-de-ton-PC&gt;:5173</span>,
            l’adresse « Network » affichée par <span className="text-fg">npm run dev -- --host</span>).
          </p>
        </div>
      )}

      {/* Châssis du téléphone */}
      <div
        className="relative flex origin-center items-center justify-center transition-transform duration-200"
        style={{
          width: preset.width + 20,
          height: preset.height + 20,
          transform: `scale(${scale})`,
        }}
      >
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[48px] border-[6px] border-[#1F2024] bg-ink shadow-[0_24px_64px_rgba(0,0,0,0.7)]">
          {/* Barre de statut */}
          <div className="relative z-30 flex h-9 shrink-0 select-none items-center justify-between bg-ink px-7 text-[12px] font-semibold text-fg">
            <span className="num">{clock}</span>
            {/* Îlot caméra */}
            <div className="absolute left-1/2 top-2 h-5 w-[72px] -translate-x-1/2 rounded-full bg-black" />
            <div className="flex items-center gap-1.5 text-fg">
              <span className="text-[11px] font-bold">5G</span>
              <Wifi className="h-3.5 w-3.5" />
              <BatteryFull className="h-4 w-4" />
            </div>
          </div>

          {/* Conteneur interne de l'application (strictement confiné à l'écran du téléphone) */}
          <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-ink">
            {children}
          </div>

          {/* Barre d'accueil gestuelle */}
          <div className="flex h-4 shrink-0 items-center justify-center bg-card">
            <div className="h-1 w-28 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
