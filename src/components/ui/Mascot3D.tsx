import { useId } from 'react';
import type { MascotPose, MascotTone } from '../../data/mascots';

// Personnage « argile 3D » dessiné en SVG : gros crâne, grosses mains, dégradés + reflets doux.
// Tout est modifiable (couleurs, poses) sans passer par un outil d'image. Fond transparent :
// c'est la carte qui fournit le fond blanc ou vert.

type Shade = { l: string; m: string; d: string };

const SKIN: Shade = { l: '#FFD6B2', m: '#F0B48A', d: '#C9825A' };
const HAIR: Shade = { l: '#6B5443', m: '#2A2118', d: '#120D09' };
const INK: Shade = { l: '#46526E', m: '#1B2230', d: '#0A0E16' };
const LIME: Shade = { l: '#EAFF7A', m: '#C8FF00', d: '#8DB800' };
const SNOW: Shade = { l: '#FFFFFF', m: '#F1F3F8', d: '#B6BECD' };
const STEEL: Shade = { l: '#E3E7EF', m: '#AEB6C6', d: '#6F788C' };

type Pt = [number, number];

function Limb({ pts, w, c, back = false }: { pts: Pt[]; w: number; c: Shade; back?: boolean }) {
  const d = 'M' + pts.map((p) => p.join(' ')).join(' L');
  const base = back ? c.d : c.m;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={c.d} strokeWidth={w} />
      <path d={d} stroke={base} strokeWidth={w * 0.84} transform={`translate(${-w * 0.04} ${-w * 0.07})`} />
      {!back && <path d={d} stroke="#fff" strokeOpacity={0.34} strokeWidth={w * 0.24} transform={`translate(${-w * 0.2} ${-w * 0.24})`} />}
    </g>
  );
}

function Blob({ uid, c, cx, cy, rx, ry = rx }: { uid: string; c: string; cx: number; cy: number; rx: number; ry?: number }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}-${c})`} />
      <ellipse cx={cx - rx * 0.3} cy={cy - ry * 0.4} rx={rx * 0.3} ry={ry * 0.18} fill="#fff" opacity={0.42} />
    </g>
  );
}

function Head({ uid, cx, cy, front = false }: { uid: string; cx: number; cy: number; front?: boolean }) {
  return (
    <g>
      <circle cx={cx - (front ? 0 : 3)} cy={cy - 3} r={18} fill={`url(#${uid}-hair)`} />
      {!front && <ellipse cx={cx - 12} cy={cy + 2} rx={4} ry={5.5} fill={`url(#${uid}-skin)`} />}
      <Blob uid={uid} c="skin" cx={cx} cy={cy + 1} rx={16} />
      <path
        d={`M${cx - 16} ${cy - 3} Q${cx - 2} ${cy - 25} ${cx + 16} ${cy - 5} Q${cx + 4} ${cy - 10} ${cx - 16} ${cy - 3}Z`}
        fill={`url(#${uid}-hair)`}
      />
      {front ? (
        <g>
          <circle cx={cx - 6.5} cy={cy + 2} r={2.4} fill="#1B2230" />
          <circle cx={cx + 6.5} cy={cy + 2} r={2.4} fill="#1B2230" />
          <circle cx={cx - 5.8} cy={cy + 1.2} r={0.8} fill="#fff" />
          <circle cx={cx + 7.2} cy={cy + 1.2} r={0.8} fill="#fff" />
          <path d={`M${cx - 10} ${cy - 3} L${cx - 3} ${cy - 1.5}M${cx + 10} ${cy - 3} L${cx + 3} ${cy - 1.5}`} stroke="#2A2118" strokeWidth={1.8} strokeLinecap="round" />
          <path d={`M${cx - 5} ${cy + 8} Q${cx} ${cy + 13} ${cx + 5} ${cy + 8}`} stroke="#8A4B2E" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          <circle cx={cx - 11} cy={cy + 7} r={3} fill="#FF8A7A" opacity={0.3} />
          <circle cx={cx + 11} cy={cy + 7} r={3} fill="#FF8A7A" opacity={0.3} />
        </g>
      ) : (
        <g>
          <circle cx={cx + 7} cy={cy + 2} r={2.5} fill="#1B2230" />
          <circle cx={cx + 7.7} cy={cy + 1.2} r={0.8} fill="#fff" />
          <path d={`M${cx + 3} ${cy - 2.5} L${cx + 11} ${cy - 1}`} stroke="#2A2118" strokeWidth={1.8} strokeLinecap="round" />
          <path d={`M${cx + 3} ${cy + 8} Q${cx + 8} ${cy + 12} ${cx + 12} ${cy + 7}`} stroke="#8A4B2E" strokeWidth={1.8} strokeLinecap="round" fill="none" />
          <circle cx={cx + 8} cy={cy + 6.5} r={3} fill="#FF8A7A" opacity={0.3} />
        </g>
      )}
    </g>
  );
}

function Sweat({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y} q4 6 0 9 q-4 -3 0 -9z`} fill="#7DD3FC" opacity={0.9} />;
}

function Poses({ pose, uid, tone }: { pose: MascotPose; uid: string; tone: MascotTone }) {
  const shirt = tone === 'white' ? LIME : SNOW;
  const shoeAt = (cx: number, cy: number) => <Blob uid={uid} c="shoe" cx={cx} cy={cy} rx={12} ry={7} />;

  switch (pose) {
    case 'pecs':
      return (
        <g>
          <ellipse cx={90} cy={172} rx={72} ry={7} fill="#000" opacity={0.1} />
          <Limb pts={[[72, 142], [52, 152]]} w={18} c={INK} back />
          <Limb pts={[[52, 152], [32, 162]]} w={12} c={SKIN} back />
          <Limb pts={[[118, 128], [126, 146], [124, 164]]} w={11} c={SKIN} back />
          <Limb pts={[[74, 140], [124, 124]]} w={32} c={shirt} />
          <Limb pts={[[72, 142], [54, 152]]} w={19} c={INK} />
          <Limb pts={[[54, 152], [32, 162]]} w={12} c={SKIN} />
          {shoeAt(26, 163)}
          <Limb pts={[[128, 124], [138, 146], [134, 164]]} w={12} c={SKIN} />
          <Blob uid={uid} c="skin" cx={134} cy={165} rx={8} ry={6} />
          <Head uid={uid} cx={150} cy={108} />
          <Sweat x={172} y={96} />
          <path d="M160 172 L184 172" stroke="#000" strokeOpacity={0.12} strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    case 'legs':
      return (
        <g>
          <ellipse cx={100} cy={174} rx={58} ry={6} fill="#000" opacity={0.1} />
          <Limb pts={[[80, 128], [118, 126]]} w={20} c={INK} back />
          <Limb pts={[[118, 126], [100, 166]]} w={13} c={SKIN} back />
          <Limb pts={[[82, 126], [96, 84]]} w={32} c={shirt} />
          <Limb pts={[[84, 128], [122, 128]]} w={21} c={INK} />
          <Limb pts={[[122, 128], [108, 166]]} w={13} c={SKIN} />
          {shoeAt(110, 168)}
          <Limb pts={[[100, 88], [118, 100], [130, 80]]} w={12} c={SKIN} />
          <Blob uid={uid} c="skin" cx={131} cy={78} rx={8} ry={7} />
          <Limb pts={[[36, 78], [168, 78]]} w={5} c={STEEL} />
          <Limb pts={[[34, 58], [34, 98]]} w={13} c={INK} />
          <Limb pts={[[170, 58], [170, 98]]} w={13} c={INK} />
          <Limb pts={[[26, 66], [26, 90]]} w={9} c={LIME} />
          <Limb pts={[[178, 66], [178, 90]]} w={9} c={LIME} />
          <Head uid={uid} cx={104} cy={58} />
          <Sweat x={134} y={44} />
        </g>
      );
    case 'cardio':
      return (
        <g>
          <ellipse cx={92} cy={175} rx={40} ry={5} fill="#000" opacity={0.08} />
          <g stroke={tone === 'white' ? '#C8FF00' : '#fff'} strokeWidth={4} strokeLinecap="round" opacity={0.9}>
            <path d="M14 78 L46 78M8 98 L38 98M20 118 L44 118" />
          </g>
          <Limb pts={[[104, 78], [88, 92], [76, 108]]} w={11} c={SKIN} back />
          <Limb pts={[[96, 108], [80, 130]]} w={20} c={INK} back />
          <Limb pts={[[80, 130], [56, 122]]} w={12} c={SKIN} back />
          {shoeAt(48, 120)}
          <Limb pts={[[96, 108], [110, 74]]} w={30} c={shirt} />
          <Limb pts={[[98, 108], [130, 102]]} w={20} c={INK} />
          <Limb pts={[[130, 102], [126, 138]]} w={12} c={SKIN} />
          {shoeAt(130, 143)}
          <Limb pts={[[110, 80], [128, 94], [142, 78]]} w={11} c={SKIN} />
          <Blob uid={uid} c="skin" cx={144} cy={75} rx={8} ry={7} />
          <Head uid={uid} cx={120} cy={50} />
          <Sweat x={90} y={52} />
        </g>
      );
    case 'abs':
      return (
        <g>
          <rect x={14} y={160} width={172} height={11} rx={5.5} fill={`url(#${uid}-mat)`} />
          <Limb pts={[[112, 154], [148, 118]]} w={19} c={INK} back />
          <Limb pts={[[148, 118], [166, 152]]} w={12} c={SKIN} back />
          <Limb pts={[[108, 152], [140, 116]]} w={20} c={INK} />
          <Limb pts={[[140, 116], [158, 150]]} w={12} c={SKIN} />
          {shoeAt(162, 154)}
          <Limb pts={[[108, 152], [72, 118]]} w={32} c={shirt} />
          <Limb pts={[[76, 116], [86, 94], [62, 92]]} w={12} c={SKIN} />
          <Blob uid={uid} c="skin" cx={60} cy={92} rx={8} ry={7} />
          <Head uid={uid} cx={62} cy={100} />
          <Sweat x={42} y={84} />
        </g>
      );
    case 'hiit':
      return (
        <g transform="translate(0 -6)">
          <ellipse cx={100} cy={182} rx={30} ry={5} fill="#000" opacity={0.08} />
          <Limb pts={[[92, 112], [76, 138]]} w={20} c={INK} />
          <Limb pts={[[76, 138], [62, 164]]} w={12} c={SKIN} />
          {shoeAt(58, 169)}
          <Limb pts={[[108, 112], [124, 138]]} w={20} c={INK} />
          <Limb pts={[[124, 138], [138, 164]]} w={12} c={SKIN} />
          {shoeAt(142, 169)}
          <Limb pts={[[100, 66], [100, 112]]} w={34} c={shirt} />
          <Limb pts={[[92, 112], [108, 112]]} w={22} c={INK} />
          <Limb pts={[[88, 70], [66, 52], [55, 30]]} w={11} c={SKIN} />
          <Blob uid={uid} c="skin" cx={54} cy={26} rx={8} ry={7} />
          <Limb pts={[[112, 70], [134, 52], [145, 30]]} w={11} c={SKIN} />
          <Blob uid={uid} c="skin" cx={146} cy={26} rx={8} ry={7} />
          <Head uid={uid} cx={100} cy={44} front />
          <g stroke={tone === 'white' ? '#C8FF00' : '#fff'} strokeWidth={4} strokeLinecap="round" fill="none">
            <path d="M30 60 Q22 44 32 30M170 60 Q178 44 168 30" />
          </g>
        </g>
      );
    case 'fullbody':
    default:
      return (
        <g>
          <ellipse cx={100} cy={176} rx={44} ry={6} fill="#000" opacity={0.1} />
          <Limb pts={[[92, 112], [91, 138]]} w={20} c={INK} />
          <Limb pts={[[91, 138], [90, 164]]} w={12} c={SKIN} />
          {shoeAt(86, 169)}
          <Limb pts={[[108, 112], [109, 138]]} w={20} c={INK} />
          <Limb pts={[[109, 138], [110, 164]]} w={12} c={SKIN} />
          {shoeAt(114, 169)}
          <Limb pts={[[100, 66], [100, 114]]} w={34} c={shirt} />
          <Limb pts={[[92, 114], [108, 114]]} w={22} c={INK} />
          <Limb pts={[[86, 72], [62, 80], [64, 54]]} w={11} c={SKIN} />
          <Limb pts={[[114, 72], [138, 80], [136, 54]]} w={11} c={SKIN} />
          <Limb pts={[[46, 50], [82, 50]]} w={4} c={STEEL} />
          <Limb pts={[[118, 50], [154, 50]]} w={4} c={STEEL} />
          <Limb pts={[[44, 38], [44, 62]]} w={13} c={INK} />
          <Limb pts={[[84, 38], [84, 62]]} w={13} c={INK} />
          <Limb pts={[[116, 38], [116, 62]]} w={13} c={INK} />
          <Limb pts={[[156, 38], [156, 62]]} w={13} c={INK} />
          <Blob uid={uid} c="skin" cx={64} cy={52} rx={8} ry={7} />
          <Blob uid={uid} c="skin" cx={136} cy={52} rx={8} ry={7} />
          <Head uid={uid} cx={100} cy={44} front />
        </g>
      );
  }
}

/** Mascotte 3D. Le fond est transparent : poser sur une carte blanche ou verte (`tone` adapte la tenue). */
export function Mascot3D({ pose, tone = 'white', className = '' }: { pose: MascotPose; tone?: MascotTone; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const grads: [string, Shade][] = [
    ['skin', SKIN],
    ['hair', HAIR],
    ['shoe', tone === 'white' ? INK : SNOW],
    ['mat', tone === 'white' ? LIME : INK],
  ];
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-hidden="true" preserveAspectRatio="xMidYMin meet">
      <defs>
        {grads.map(([name, c]) => (
          <radialGradient key={name} id={`${uid}-${name}`} cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stopColor={c.l} />
            <stop offset="0.55" stopColor={c.m} />
            <stop offset="1" stopColor={c.d} />
          </radialGradient>
        ))}
      </defs>
      <circle cx={100} cy={104} r={78} fill={tone === 'white' ? '#EEF8D2' : '#DCFF4F'} />
      <circle cx={100} cy={104} r={58} fill={tone === 'white' ? '#E2F3B3' : '#D2F72A'} opacity={0.7} />
      <Poses pose={pose} uid={uid} tone={tone} />
    </svg>
  );
}
