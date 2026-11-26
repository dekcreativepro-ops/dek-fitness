import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  BatteryCharging,
  Maximize2,
  Minimize2,
  Smartphone,
  Terminal,
  Volume2,
  VolumeX,
  Wifi,
  X,
} from 'lucide-react';
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
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#080A0E]">
        {fullScreenMode && !isMobileScreen && (
          <button
            onClick={() => setFullScreenMode(false)}
            className="absolute right-3 top-3 z-[900] flex items-center gap-1.5 rounded-full border border-white/15 bg-black/75 px-3 py-1.5 text-[11px] font-semibold text-slate-200 backdrop-blur transition hover:border-[#C8FF00]/50 hover:text-[#C8FF00]"
          >
            <Minimize2 className="h-3.5 w-3.5" /> Quitter Plein écran
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
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#05070A] px-4 py-3">
      {/* Halo subtil d'ambiance en arrière-plan */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, #C8FF00 0%, #00E5FF 45%, transparent 75%)' }}
      />

      {/* Barre d'outils du Studio Mobile (en haut) */}
      <div className="z-20 mb-2 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0E1219]/90 px-3 py-1.5 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 pr-1 text-xs font-semibold text-slate-300">
          <Smartphone className="h-3.5 w-3.5 text-[#C8FF00]" />
          <span className="font-hud tracking-wide text-white">STUDIO MOBILE</span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-1">
          {DEVICE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPresetId(p.id)}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                presetId === p.id
                  ? 'bg-[#C8FF00] font-bold text-black'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              title={p.label}
            >
              {p.label.replace('Android ', '')} ({p.shortLabel})
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/10" />

        <button
          onClick={toggleSound}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
            soundOn
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
          title="Activer ou couper les effets sonores"
        >
          {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          {soundOn ? 'Son ON' : 'Son OFF'}
        </button>

        <button
          onClick={() => setFullScreenMode(true)}
          className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          title="Afficher en plein écran"
        >
          <Maximize2 className="h-3.5 w-3.5" /> Plein écran
        </button>

        <button
          onClick={() => setShowScrcpyHelp((v) => !v)}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
            showScrcpyHelp
              ? 'bg-[#00E5FF]/20 text-[#00E5FF]'
              : 'bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20'
          }`}
          title="Afficher les commandes pour tester sur ton vrai téléphone avec scrcpy"
        >
          <Terminal className="h-3.5 w-3.5" /> Test scrcpy
        </button>
      </div>

      {/* Modale d'aide rapide scrcpy / téléphone réel */}
      {showScrcpyHelp && (
        <div className="z-30 mb-2 w-full max-w-lg rounded-2xl border border-[#00E5FF]/35 bg-[#0D131C]/95 p-3.5 text-xs text-slate-200 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-hud font-bold text-[#00E5FF]">
              TESTER EN DIRECT SUR TON TÉLÉPHONE (ADB + SCRCPY)
            </span>
            <button
              onClick={() => setShowScrcpyHelp(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
            Branche ton Android en USB (Débogage USB activé) puis lance ces commandes dans PowerShell
            pour voir ton téléphone sur PC et ouvrir l’app avec GPS & Caméra réels :
          </p>
          <div className="mt-2 space-y-1.5 rounded-xl bg-black/70 p-2.5 font-mono text-[11px] text-[#C8FF00]">
            <div>adb reverse tcp:5173 tcp:5173</div>
            <div>scrcpy</div>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Puis ouvre <span className="font-semibold text-white">http://localhost:5173</span> sur
            Chrome mobile (ou en Wi-Fi via <span className="text-white">http://&lt;IP-de-ton-PC&gt;:5173</span>,
            l’adresse « Network » affichée par <span className="text-white">npm run dev -- --host</span>).
          </p>
        </div>
      )}

      {/* Châssis Smartphone réaliste */}
      <div
        className="relative flex origin-center items-center justify-center transition-transform duration-200"
        style={{
          width: preset.width + 20,
          height: preset.height + 20,
          transform: `scale(${scale})`,
        }}
      >
        <div
          className="relative flex h-full w-full flex-col overflow-hidden rounded-[44px] border-[7px] border-[#1E2430] bg-[#080A0E] shadow-[0_28px_80px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)]"
        >
          {/* Barre de statut Android / Smartphone */}
          <div className="relative z-30 flex h-8 shrink-0 items-center justify-between bg-[#080A0E] px-6 text-[11px] font-semibold text-slate-200 select-none">
            <span>{clock}</span>
            {/* Îlot caméra frontal */}
            <div className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full border border-white/10 bg-black flex items-center justify-end pr-2">
              <span className="h-2 w-2 rounded-full bg-[#101827] ring-1 ring-white/15" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-[10px] font-bold">5G</span>
              <Wifi className="h-3 w-3" />
              <BatteryCharging className="h-3.5 w-3.5 text-[#C8FF00]" />
            </div>
          </div>

          {/* Conteneur interne de l'application (strictement confiné à l'écran du téléphone) */}
          <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#080A0E]">
            {children}
          </div>

          {/* Barre d'accueil gestuelle Android */}
          <div className="flex h-4 shrink-0 items-center justify-center bg-[#0B0E14]">
            <div className="h-1 w-28 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
