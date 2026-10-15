/** Illustration de la bannière d'accueil : étudiant, globe, avion en papier, toque. Originale, vectorielle. */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 540" className={className} aria-hidden>
      <defs>
        <linearGradient id="ha-globe" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stopColor="#3D8BFF" /><stop offset=".55" stopColor="#0B63F6" /><stop offset="1" stopColor="#0A4FC4" /></linearGradient>
        <linearGradient id="ha-skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9A6440" /><stop offset="1" stopColor="#7A4B2E" /></linearGradient>
        <clipPath id="ha-clip"><circle cx="280" cy="290" r="210" /></clipPath>
      </defs>
      <circle cx="280" cy="290" r="236" fill="#fff" opacity=".06" /><circle cx="280" cy="290" r="222" fill="none" stroke="#fff" strokeOpacity=".18" strokeDasharray="3 8" />
      <circle cx="280" cy="290" r="210" fill="url(#ha-globe)" />
      <g clipPath="url(#ha-clip)">
        <g fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1.4"><ellipse cx="280" cy="290" rx="210" ry="70" /><ellipse cx="280" cy="290" rx="210" ry="140" /><ellipse cx="280" cy="290" rx="70" ry="210" /><ellipse cx="280" cy="290" rx="140" ry="210" /><line x1="70" y1="290" x2="490" y2="290" /><line x1="280" y1="80" x2="280" y2="500" /></g>
        <g fill="#fff" opacity=".1"><path d="M120 200 q30 -40 70 -20 q20 20 -10 40 q-40 20 -60 -20Z" /><path d="M360 170 q40 -20 70 10 q10 30 -30 40 q-30 0 -40 -50Z" /><path d="M330 360 q30 -20 60 10 q-10 40 -50 40 q-20 -20 -10 -50Z" /></g>
        {/* sac à dos (parties visibles de part et d'autre des épaules) */}
        <rect x="128" y="352" width="50" height="132" rx="24" fill="#F5B51B" /><rect x="382" y="352" width="50" height="132" rx="24" fill="#F5B51B" />
        <rect x="136" y="392" width="22" height="30" rx="6" fill="#D99A0B" />
        {/* buste */}
        <path d="M146 540 Q142 372 280 360 Q418 372 414 540Z" fill="#EAF3FF" />
        <path d="M232 366 L280 420 L328 366 Q280 350 232 366Z" fill="#fff" /><path d="M262 362 L280 400 L298 362Z" fill="url(#ha-skin)" />
        <path d="M184 372 L212 540 M376 372 L348 540" stroke="#063B70" strokeWidth="14" strokeLinecap="round" />
        <rect x="262" y="318" width="36" height="52" rx="14" fill="url(#ha-skin)" />
        {/* livre tenu contre la poitrine */}
        <path d="M168 392 Q150 484 232 474" stroke="#EAF3FF" strokeWidth="46" fill="none" strokeLinecap="round" /><path d="M392 392 Q410 484 328 474" stroke="#EAF3FF" strokeWidth="46" fill="none" strokeLinecap="round" />
        <rect x="214" y="430" width="132" height="92" rx="10" fill="#063B70" /><rect x="214" y="430" width="132" height="92" rx="10" fill="none" stroke="#fff" strokeOpacity=".25" />
        <rect x="302" y="430" width="14" height="46" fill="#F5B51B" /><g stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round"><path d="M232 458 H290 M232 474 H280" /></g>
        <circle cx="228" cy="474" r="15" fill="url(#ha-skin)" /><circle cx="332" cy="474" r="15" fill="url(#ha-skin)" />
        {/* tête */}
        <circle cx="228" cy="262" r="10" fill="#6E4229" /><circle cx="332" cy="262" r="10" fill="#6E4229" />
        <circle cx="280" cy="262" r="56" fill="url(#ha-skin)" />
        <g fill="#1B1820"><path d="M222 252 Q218 196 280 192 Q342 196 338 252 Q320 222 280 220 Q240 222 222 252Z" />{[[236, 208], [256, 196], [282, 192], [308, 196], [328, 210], [224, 230], [338, 232]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="15" />)}</g>
        <g fill="#1B1820"><ellipse cx="260" cy="262" rx="3.6" ry="4.4" /><ellipse cx="300" cy="262" rx="3.6" ry="4.4" /></g>
        <path d="M262 284 Q280 300 298 284" stroke="#3E2314" strokeWidth="3.4" fill="none" strokeLinecap="round" /><path d="M252 250 Q260 245 268 249 M292 249 Q300 245 308 250" stroke="#1B1820" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </g>
      {/* trajectoire et avion en papier */}
      <path d="M40 470 Q150 520 300 500 T520 200" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" strokeDasharray="2 9" strokeLinecap="round" />
      <g transform="translate(516 192) rotate(-38)"><path d="M0 0 L46 -10 L14 6Z" fill="#fff" /><path d="M14 6 L46 -10 L18 24Z" fill="#CFE0FF" /><path d="M14 6 L22 18 L18 24Z" fill="#9DBBF5" /></g>
      {/* toque flottante (claire pour se détacher du fond navy) */}
      <g transform="translate(430 92) rotate(12)"><path d="M18 34 V58 Q54 78 90 58 V34 L54 46Z" fill="#CFE0FF" /><path d="M0 22 L54 2 L108 22 L54 44Z" fill="#fff" /><path d="M54 2 L108 22 L54 44Z" fill="#E4EEFF" /><path d="M100 24 V60" stroke="#F5B51B" strokeWidth="3.5" strokeLinecap="round" /><circle cx="100" cy="64" r="6" fill="#F5B51B" /></g>
      {/* étincelles */}
      {[[96, 120, 15], [500, 360, 12], [60, 330, 9], [372, 40, 11]].map(([x, y, r], i) => <path key={i} transform={`translate(${x} ${y})`} d={`M0 ${-r} Q2 -2 ${r} 0 Q2 2 0 ${r} Q-2 2 ${-r} 0 Q-2 -2 0 ${-r}Z`} fill="#F5B51B" />)}
      {[[150, 60], [520, 270], [40, 220], [470, 470]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 4 : 6} fill="#fff" opacity=".7" />)}
    </svg>
  );
}
