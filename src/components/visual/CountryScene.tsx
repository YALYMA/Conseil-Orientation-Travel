/** Illustrations originales (vectorielles, libres de droits) des 5 destinations. Remplacées automatiquement par une photo si elle est fournie (voir CountryVisual). */
type Props = { slug: string; className?: string };

const W = 600, H = 420;
const Defs = ({ id, from, mid, to }: { id: string; from: string; mid?: string; to: string }) => (
  <defs>
    <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={from} />{mid && <stop offset=".55" stopColor={mid} />}<stop offset="1" stopColor={to} />
    </linearGradient>
  </defs>
);
const Sky = ({ id }: { id: string }) => <rect width={W} height={H} fill={`url(#${id}-sky)`} />;
const Cloud = ({ x, y, s = 1, o = 0.55 }: { x: number; y: number; s?: number; o?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity={o}><ellipse cx="0" cy="0" rx="34" ry="11" /><ellipse cx="22" cy="-8" rx="22" ry="12" /><ellipse cx="-18" cy="-6" rx="18" ry="9" /></g>
);
const Stars = ({ pts }: { pts: [number, number][] }) => <g fill="#fff" opacity=".8">{pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.4 : 2} />)}</g>;

function France() {
  const id = "fr";
  return (
    <>
      <Defs id={id} from="#3D5AFE" mid="#8FA6FF" to="#FFC7B0" /><Sky id={id} />
      <Stars pts={[[60, 40], [140, 70], [210, 30], [420, 50], [520, 80], [560, 30], [350, 22], [90, 110]]} />
      <circle cx="470" cy="250" r="70" fill="#FFE9D2" opacity=".35" /><circle cx="470" cy="250" r="44" fill="#FFE6C9" />
      <Cloud x={120} y={120} s={1.1} /><Cloud x={500} y={140} s={0.8} o={0.4} />
      <path d="M0 300 Q120 250 240 290 T480 280 T600 300 V420 H0Z" fill="#6A7FE0" opacity=".7" />
      <path d="M0 330 Q150 290 300 322 T600 315 V420 H0Z" fill="#3A4DB5" />
      <g fill="#1B2350">
        <path d="M300 62 L303 90 L309 150 L321 150 L329 205 L344 205 L366 345 L330 345 L319 296 Q300 262 281 296 L270 345 L234 345 L256 205 L271 205 L279 150 L291 150 L297 90Z" />
        <rect x="274" y="146" width="52" height="7" rx="2" /><rect x="258" y="201" width="84" height="8" rx="2" /><rect x="296" y="50" width="8" height="16" rx="3" />
      </g>
      <g stroke="#8FA6FF" strokeWidth="1.2" opacity=".5" fill="none"><path d="M291 150 L321 205 M309 150 L279 205 M270 215 L330 330 M330 215 L270 330" /></g>
      <rect y="345" width={W} height="75" fill="#18204A" />
      {[40, 90, 150, 450, 510, 565].map((x, i) => <g key={x}><rect x={x - 3} y="352" width="6" height="22" fill="#10173A" /><ellipse cx={x} cy="346" rx={i % 2 ? 17 : 21} ry={i % 2 ? 24 : 28} fill="#26346F" /></g>)}
    </>
  );
}

function Belgique() {
  const id = "be";
  const sph: [number, number][] = [[300, 92], [224, 162], [376, 162], [300, 212], [224, 262], [376, 262], [300, 332]];
  const tubes: [number, number, number, number][] = [[300, 92, 224, 162], [300, 92, 376, 162], [224, 162, 300, 212], [376, 162, 300, 212], [300, 212, 224, 262], [300, 212, 376, 262], [224, 262, 300, 332], [376, 262, 300, 332], [224, 162, 224, 262], [376, 162, 376, 262], [300, 92, 300, 332]];
  return (
    <>
      <Defs id={id} from="#FF8F5C" mid="#FFC27A" to="#FFF0C2" /><Sky id={id} />
      <defs><radialGradient id="be-s" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff" /><stop offset=".45" stopColor="#B7C3D8" /><stop offset="1" stopColor="#566684" /></radialGradient></defs>
      <circle cx="300" cy="215" r="150" fill="#FFF4CC" opacity=".45" /><circle cx="300" cy="215" r="105" fill="#FFF8DC" opacity=".5" />
      <Cloud x={90} y={90} /><Cloud x={520} y={110} s={0.9} o={0.45} />
      <path d="M0 330 Q150 300 300 330 T600 322 V420 H0Z" fill="#B9663F" opacity=".6" />
      {tubes.map(([a, b, c, d], i) => <g key={i}><line x1={a} y1={b} x2={c} y2={d} stroke="#6B7A96" strokeWidth="11" strokeLinecap="round" /><line x1={a - 1.5} y1={b - 1.5} x2={c - 1.5} y2={d - 1.5} stroke="#DDE4F0" strokeWidth="5" strokeLinecap="round" /></g>)}
      {sph.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="35" fill="url(#be-s)" /><circle cx={x - 12} cy={y - 13} r="7" fill="#fff" opacity=".7" /></g>)}
      <g stroke="#566684" strokeWidth="7" strokeLinecap="round"><line x1="300" y1="360" x2="268" y2="386" /><line x1="300" y1="360" x2="332" y2="386" /><line x1="300" y1="360" x2="300" y2="388" /></g>
      {[[10, 1], [452, 1]].map(([x]) => (
        <g key={x} fill="#7A3E2B"><path d={`M${x} 396 V338 H${x + 26} V314 H${x + 50} V290 H${x + 74} V314 H${x + 98} V338 H${x + 124} V396Z`} />
          <g fill="#FFD58A">{[0, 1, 2].map((r) => <rect key={r} x={x + 14 + r * 36} y="352" width="14" height="18" rx="2" />)}<rect x={x + 55} y="308" width="14" height="16" rx="2" /></g></g>
      ))}
      <rect y="394" width={W} height="26" fill="#4E271E" />
    </>
  );
}

function Luxembourg() {
  const id = "lu";
  return (
    <>
      <Defs id={id} from="#52C7B5" mid="#A6E6D6" to="#F2FCF6" /><Sky id={id} />
      <circle cx="120" cy="105" r="40" fill="#FFF8D9" opacity=".95" /><circle cx="120" cy="105" r="64" fill="#fff" opacity=".25" />
      <Cloud x={380} y={80} s={1.2} /><Cloud x={540} y={130} s={0.8} o={0.45} />
      <path d="M0 250 Q130 195 260 240 T520 215 T600 235 V420 H0Z" fill="#4DB596" opacity=".7" />
      <path d="M0 290 Q100 255 200 285 T600 270 V420 H0Z" fill="#2E8F76" />
      <g><path d="M470 120 H545 V250 H470Z" fill="#8FA0B8" /><path d="M462 120 L507 62 L552 120Z" fill="#46567A" /><rect x="498" y="48" width="4" height="16" fill="#46567A" /><rect x="500" y="160" width="14" height="24" rx="7" fill="#46567A" /><path d="M440 250 V190 H470 V250Z" fill="#7C8CA6" /></g>
      <path fillRule="evenodd" fill="#F1E5CE" d="M50 172 H550 V350 H50Z M195 350 V300 A105 105 0 0 1 405 300 V350Z M85 350 V322 A32 32 0 0 1 149 322 V350Z M451 350 V322 A32 32 0 0 1 515 322 V350Z" />
      <rect x="50" y="162" width="500" height="12" rx="3" fill="#D8C7A4" />
      <g stroke="#CDBB96" strokeWidth="2" opacity=".8">{[200, 235, 270, 305, 340, 375].map((x) => <line key={x} x1={x} y1="176" x2={x} y2="200" />)}<path d="M195 300 A105 105 0 0 1 405 300" fill="none" strokeWidth="5" /></g>
      <path d="M0 350 H600 V420 H0Z" fill="#2F9DBB" /><path d="M0 372 Q75 362 150 372 T300 372 T450 372 T600 372" stroke="#8FE0F0" strokeWidth="3" fill="none" opacity=".7" />
      {[30, 70, 120, 480, 530, 575].map((x, i) => <path key={x} d={`M${x} ${352 - (i % 2) * 6} l-15 36 h30Z`} fill={i % 2 ? "#1E6B58" : "#175646"} />)}
    </>
  );
}

function Italie() {
  const id = "it";
  const rows = [182, 232, 282];
  return (
    <>
      <Defs id={id} from="#FF9F6E" mid="#FFC796" to="#FFEBD0" /><Sky id={id} />
      <circle cx="480" cy="120" r="78" fill="#FFF2D2" opacity=".35" /><circle cx="480" cy="120" r="50" fill="#FFF3D6" />
      <Cloud x={110} y={85} s={1.1} /><Cloud x={300} y={50} s={0.8} o={0.4} />
      <path d="M0 300 Q150 265 300 295 T600 285 V420 H0Z" fill="#D98B5E" opacity=".6" />
      <defs><linearGradient id="it-c" x1="0" x2="1"><stop offset="0" stopColor="#B88B5E" /><stop offset=".18" stopColor="#EBCB9E" /><stop offset=".8" stopColor="#EBCB9E" /><stop offset="1" stopColor="#B88B5E" /></linearGradient></defs>
      <path d="M64 346 V218 Q64 172 116 170 L206 170 L232 190 L270 170 L486 170 Q536 172 536 218 V346Z" fill="url(#it-c)" />
      <rect x="64" y="166" width="472" height="8" rx="3" fill="#D9B684" opacity=".0" />
      {rows.map((y, r) => (
        <g key={y}>
          <rect x="64" y={y - 6} width="472" height="5" fill="#D2AE7C" opacity=".8" />
          {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${92 + i * 36} ${y + 42} V${y + 14} a11 11 0 0 1 22 0 V${y + 42}Z`} fill={r === 2 ? "#6E4630" : "#9A6B45"} />)}
        </g>
      ))}
      <rect x="64" y="338" width="472" height="10" fill="#C99C6B" />
      {[28, 570].map((x) => <g key={x}><ellipse cx={x} cy="290" rx="16" ry="76" fill="#2C5A37" /><ellipse cx={x + (x < 300 ? 22 : -22)} cy="320" rx="11" ry="52" fill="#3A6E45" /></g>)}
      <path d="M0 346 Q150 336 300 346 T600 344 V420 H0Z" fill="#C98A5E" /><path d="M0 380 Q200 366 400 380 T600 378 V420 H0Z" fill="#A9703F" />
    </>
  );
}

function Maroc() {
  const id = "ma";
  return (
    <>
      <Defs id={id} from="#FF8A4C" mid="#FFC079" to="#FFE7B8" /><Sky id={id} />
      <circle cx="300" cy="235" r="135" fill="#FFE08A" opacity=".5" /><circle cx="300" cy="235" r="92" fill="#FFE9A8" opacity=".7" />
      <path d="M0 320 Q120 270 250 312 T520 300 T600 315 V420 H0Z" fill="#E8A65E" opacity=".85" />
      <g>
        <rect x="256" y="104" width="88" height="244" fill="#C4623A" /><rect x="326" y="104" width="18" height="244" fill="#A94F2D" />
        <rect x="272" y="72" width="56" height="34" fill="#B1532F" /><rect x="286" y="54" width="28" height="20" fill="#C4623A" />
        <circle cx="300" cy="46" r="7" fill="#F5B51B" /><circle cx="300" cy="33" r="5" fill="#F5B51B" /><rect x="299" y="14" width="2" height="22" fill="#F5B51B" />
        {[108, 140, 188, 236, 284].map((y, i) => (
          i === 0
            ? <g key={y} fill="#F5B51B" opacity=".9">{Array.from({ length: 5 }, (_, k) => <path key={k} d={`M${268 + k * 14} ${y} l5 6 l-5 6 l-5 -6Z`} />)}</g>
            : <g key={y} fill="#7E3319">{[268, 304].map((x) => <path key={x} d={`M${x} ${y + 36} V${y + 14} a12 12 0 0 1 24 0 V${y + 36}Z`} />)}</g>
        ))}
        <path d="M280 348 V318 a20 20 0 0 1 40 0 V348Z" fill="#5E2411" />
      </g>
      <g fill="#D2784A">{[-1, 1].map((s) => <g key={s}><rect x={s < 0 ? 40 : 360} y="316" width="200" height="34" /><g fill="#D2784A">{Array.from({ length: 8 }, (_, i) => <rect key={i} x={(s < 0 ? 40 : 360) + i * 26} y="306" width="14" height="12" />)}</g></g>)}</g>
      {[[96, 0.9], [520, 1.15]].map(([x, s]) => (
        <g key={x} transform={`translate(${x} 352) scale(${s})`}>
          <path d="M0 0 Q6 -60 -2 -118" stroke="#6B3F23" strokeWidth="9" fill="none" strokeLinecap="round" />
          <g fill="#2E6B3E"><path d="M-2 -118 Q-40 -132 -62 -104 Q-30 -118 -2 -112Z" /><path d="M-2 -118 Q36 -136 62 -108 Q30 -120 -2 -112Z" /><path d="M-2 -118 Q-26 -150 -52 -146 Q-24 -138 -2 -112Z" /><path d="M-2 -118 Q22 -152 50 -148 Q22 -140 -2 -112Z" /><path d="M-2 -118 Q-4 -156 8 -168 Q6 -140 -2 -112Z" /></g>
        </g>
      ))}
      <path d="M0 350 Q150 322 320 348 T600 338 V420 H0Z" fill="#E09A52" /><path d="M0 385 Q200 360 420 386 T600 380 V420 H0Z" fill="#C9803D" />
    </>
  );
}

const SCENES: Record<string, () => React.JSX.Element> = { france: France, belgique: Belgique, luxembourg: Luxembourg, italie: Italie, maroc: Maroc };
export const hasScene = (slug: string) => slug in SCENES;

/** Illustration d'un pays ; pour un pays ajouté depuis l'administration (sans illustration), motif générique de la marque. */
export function CountryScene({ slug, className }: Props) {
  const Scene = SCENES[slug];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      {Scene ? <Scene /> : (<><rect width={W} height={H} fill="#0B63F6" /><circle cx="300" cy="210" r="120" fill="#fff" opacity=".12" /><circle cx="300" cy="210" r="70" fill="#F5B51B" opacity=".9" /></>)}
    </svg>
  );
}
