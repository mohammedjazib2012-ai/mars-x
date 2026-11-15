// Animated illustration of the Mars base. It reacts to the game state.
export default function BaseView({ power, base, eventId }) {
  const lightsOn = power >= 25
  const dim = power < 45
  const damage = base < 25 ? 2 : base < 55 ? 1 : 0
  const storm = eventId === 'dust'
  const dustyPanels = storm || eventId === 'solar'
  const alarm = eventId === 'equipment' || eventId === 'maintenance' || base < 25
  const radiation = eventId === 'radiation'

  let caption = '☀️ Clear skies. Base operating normally.'
  if (!lightsOn) caption = '🔦 Power critical. The base is on emergency lighting only.'
  else if (storm) caption = '🌪️ Dust storm over the base. Visibility and solar power are dropping.'
  else if (radiation) caption = '☢️ Radiation alert. The crew should stay in shielded areas.'
  else if (eventId === 'solar') caption = '🌫️ Dust is covering the solar panels.'
  else if (alarm) caption = '🚨 Equipment alarm active. Check the habitat systems.'
  else if (eventId === 'blight') caption = '🥀 Greenhouse trouble. Food production is falling.'
  else if (eventId === 'waterfault') caption = '🚰 Water recycler fault. Check the water system.'
  else if (damage === 1) caption = '🔧 The habitat shows signs of wear. Maintenance recommended.'

  const winClass = `bv-win ${lightsOn ? (dim ? 'flicker' : 'on') : 'off'}`

  return (
    <div className="baseview-wrap">
      <div className="baseview-title">📷 BASE CAM · LIVE VIEW OF THE HABITAT</div>
      <svg viewBox="0 0 600 220" role="img" aria-label="Illustration of the Mars base">
        <defs>
          <linearGradient id="bvSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c1030" />
            <stop offset="65%" stopColor="#7a2e1a" />
            <stop offset="100%" stopColor="#d9753a" />
          </linearGradient>
          <linearGradient id="bvGround" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9a4220" />
            <stop offset="100%" stopColor="#3f170a" />
          </linearGradient>
          <linearGradient id="bvDome" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eef2fb" />
            <stop offset="100%" stopColor="#8795b3" />
          </linearGradient>
          <linearGradient id="bvRad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a35cff" stopOpacity="0.65" />
            <stop offset="55%" stopColor="#5cffa8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#5cffa8" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* sky */}
        <rect width="600" height="220" fill="url(#bvSky)" />
        {!storm && (
          <g fill="#fff" opacity="0.7">
            <circle cx="60" cy="25" r="1.3" />
            <circle cx="140" cy="45" r="1" />
            <circle cx="250" cy="20" r="1.4" />
            <circle cx="330" cy="38" r="1" />
            <circle cx="540" cy="30" r="1.2" />
            <circle cx="580" cy="60" r="1" />
          </g>
        )}
        <circle cx="470" cy="70" r="26" fill="#ffe2b0" opacity={storm ? 0.2 : 0.9} />

        {/* hills and ground */}
        <path
          d="M0 150 L70 120 L130 145 L210 105 L290 150 L380 118 L470 148 L560 112 L600 135 L600 220 L0 220 Z"
          fill="#5e2514"
          opacity="0.85"
        />
        <rect x="0" y="150" width="600" height="70" fill="url(#bvGround)" />

        {/* solar panels */}
        <g>
          {[30, 72, 114].map((x) => (
            <g key={x}>
              <line x1={x + 18} y1="162" x2={x + 18} y2="170" stroke="#9aa3bd" strokeWidth="3" />
              <rect x={x} y="140" width="36" height="22" rx="2" fill="#1d3a6b" stroke="#4dd8ff" strokeWidth="1" />
              <line x1={x + 12} y1="140" x2={x + 12} y2="162" stroke="#4dd8ff" strokeWidth="0.6" opacity="0.7" />
              <line x1={x + 24} y1="140" x2={x + 24} y2="162" stroke="#4dd8ff" strokeWidth="0.6" opacity="0.7" />
              <line x1={x} y1="151" x2={x + 36} y2="151" stroke="#4dd8ff" strokeWidth="0.6" opacity="0.7" />
              {dustyPanels && <rect x={x} y="140" width="36" height="22" rx="2" fill="#c8773a" opacity="0.65" />}
            </g>
          ))}
        </g>

        {/* tunnel and domes */}
        <rect x="288" y="150" width="28" height="15" fill="#8d9ab5" />
        <path d="M168 165 A62 62 0 0 1 292 165 Z" fill="url(#bvDome)" stroke="#cfd8ec" strokeWidth="1.5" />
        <path d="M312 165 A38 38 0 0 1 388 165 Z" fill="url(#bvDome)" stroke="#cfd8ec" strokeWidth="1.5" />
        <rect x="205" y="130" width="14" height="10" rx="2" className={winClass} />
        <rect x="232" y="120" width="14" height="10" rx="2" className={winClass} />
        <rect x="256" y="135" width="12" height="9" rx="2" className={winClass} />
        <rect x="340" y="145" width="12" height="8" rx="2" className={winClass} />
        <rect x="160" y="163" width="236" height="4" fill="#5b667f" />

        {/* damage cracks */}
        {damage >= 1 && (
          <polyline points="222,108 231,120 224,130 235,146" fill="none" stroke="#1a0f0f" strokeWidth="1.6" />
        )}
        {damage >= 2 && (
          <g fill="none" stroke="#1a0f0f" strokeWidth="1.6">
            <polyline points="258,118 250,128 262,138 254,152" />
            <polyline points="186,140 196,148 190,158" />
            <polyline points="336,128 344,138 338,150" />
          </g>
        )}
        {alarm && <circle cx="230" cy="102" r="4.5" fill="#ff4d4d" className="bv-alarm" />}

        {/* antenna */}
        <line x1="450" y1="165" x2="450" y2="112" stroke="#b9c0d4" strokeWidth="3" />
        <path d="M438 114 Q450 128 462 114" fill="none" stroke="#b9c0d4" strokeWidth="2.5" />
        <circle cx="450" cy="107" r="3.5" className="bv-blink" fill={alarm ? '#ff4d4d' : '#3ddc97'} />

        {/* astronaut and rover */}
        <g className="bv-astro">
          <circle cx="410" cy="152" r="5" fill="#ffffff" />
          <rect x="406" y="157" width="9" height="12" rx="2" fill="#e8ebf5" />
          <rect x="403" y="159" width="4" height="8" fill="#b9c0d4" />
        </g>
        <g transform="translate(505,167)">
          <rect x="0" y="-9" width="32" height="9" rx="2" fill="#c3cadb" />
          <rect x="20" y="-17" width="8" height="8" fill="#8f97b3" />
          <circle cx="6" cy="2" r="4.5" fill="#2a2f40" />
          <circle cx="16" cy="2" r="4.5" fill="#2a2f40" />
          <circle cx="27" cy="2" r="4.5" fill="#2a2f40" />
        </g>

        {/* weather overlays */}
        {storm && (
          <g>
            <rect width="600" height="220" fill="#c8682c" opacity="0.38" />
            <ellipse className="bv-cloud c1" cx="100" cy="90" rx="95" ry="22" fill="#d98a4a" opacity="0.5" />
            <ellipse className="bv-cloud c2" cx="330" cy="125" rx="110" ry="26" fill="#cf7d3d" opacity="0.45" />
            <ellipse className="bv-cloud c3" cx="500" cy="70" rx="85" ry="20" fill="#e09a5a" opacity="0.5" />
          </g>
        )}
        {radiation && <rect className="bv-rad" width="600" height="130" fill="url(#bvRad)" />}
        {!lightsOn && <rect width="600" height="220" fill="#000" opacity="0.4" />}
      </svg>
      <div className="baseview-caption">{caption}</div>
    </div>
  )
}