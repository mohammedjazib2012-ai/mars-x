// ============================================================
// MARSX: Mission Control - game data and rules (version 2)
// All numbers are SIMPLIFIED GAME VALUES, not NASA measurements.
// ============================================================

export const MAX_DAYS = 10

export const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)))
export const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const RESOURCES = [
  { key: 'oxygen', label: 'Oxygen', short: 'Oxygen', icon: '🫧', blurb: 'Breathable cabin air' },
  { key: 'water', label: 'Water', short: 'Water', icon: '💧', blurb: 'Drinking, hygiene, crops' },
  { key: 'food', label: 'Food', short: 'Food', icon: '🌱', blurb: 'Rations and greenhouse' },
  { key: 'power', label: 'Electricity', short: 'Power', icon: '⚡', blurb: 'Solar and battery reserve' },
  { key: 'base', label: 'Base Condition', short: 'Base', icon: '🏗️', blurb: 'Habitat and equipment' },
  { key: 'safety', label: 'Astronaut Safety', short: 'Safety', icon: '🧑‍🚀', blurb: 'Crew health and radiation' },
]

export const START_RESOURCES = {
  oxygen: 100,
  water: 100,
  food: 100,
  power: 100,
  base: 100,
  safety: 100,
}

// What the base consumes at the end of every day (game simulation)
export const DRAIN = { oxygen: -4, water: -4, food: -4, power: -3, base: -2 }

export const WIN = { minResource: 20, minBase: 25, minSafety: 40 }
export const LOSE_SAFETY = 10
export const LOW_LEVEL = 25

// ---------------- DIFFICULTY ----------------
export const DIFFICULTY = {
  cadet: {
    id: 'cadet',
    label: 'Cadet',
    icon: '🟢',
    drain: 0.75,
    event: 0.75,
    mult: 0.85,
    desc: 'Gentler daily drains and weaker events. Great for learning. Score ×0.85.',
  },
  astronaut: {
    id: 'astronaut',
    label: 'Astronaut',
    icon: '🟠',
    drain: 1,
    event: 1,
    mult: 1,
    desc: 'The standard mission. Score ×1.0.',
  },
  commander: {
    id: 'commander',
    label: 'Commander',
    icon: '🔴',
    drain: 1.25,
    event: 1.2,
    mult: 1.2,
    desc: 'Faster drains and harder events. For experts. Score ×1.2.',
  },
}

// ---------------- CREW ----------------
export const EXHAUSTED_AT = 40 // energy below this = exhausted
export const ENERGY_COST = 22 // energy lost by the astronaut who does the task
export const ENERGY_REST = 12 // energy everyone recovers overnight

export const CREW = [
  { id: 'park', name: 'Dr. Lena Park', role: 'Flight Surgeon', initials: 'LP', offset: 0, skills: ['safety', 'oxygen'] },
  { id: 'rivera', name: 'Mateo Rivera', role: 'Systems Engineer', initials: 'MR', offset: -4, skills: ['repair', 'power'] },
  { id: 'khan', name: 'Dr. Aisha Khan', role: 'Geologist', initials: 'AK', offset: 3, skills: ['research', 'risk'] },
  { id: 'petrov', name: 'Ivan Petrov', role: 'Botanist', initials: 'IP', offset: -2, skills: ['food', 'water'] },
]

export const SKILL_ICONS = {
  safety: '🩺',
  oxygen: '🫧',
  repair: '🔧',
  power: '⚡',
  research: '🔬',
  risk: '🧑‍🚀',
  food: '🌱',
  water: '💧',
}

export const STYLE_LABELS = {
  power: 'power management',
  research: 'scientific research',
  water: 'water management',
  food: 'food production',
  oxygen: 'life support',
  repair: 'maintenance and repair',
  safety: 'crew safety',
  risk: 'field work and risk-taking',
  emergency: 'emergency response',
}

// Positive results are boosted for specialists and reduced for exhausted astronauts.
export function crewModifier(member, energy, opt) {
  const skill = opt.skill || opt.style
  const specialist = member.skills.includes(skill)
  const exhausted = energy < EXHAUSTED_AT
  let mult = 1
  if (specialist) mult += 0.3
  if (exhausted) mult -= 0.3
  return { mult, specialist, exhausted }
}

export function scaleEffects(effects, mult) {
  const out = {}
  Object.entries(effects).forEach(([key, value]) => {
    out[key] = value > 0 ? Math.max(1, Math.round(value * mult)) : value
  })
  return out
}

export function scaleEvent(effects, mult) {
  const out = {}
  Object.entries(effects).forEach(([key, value]) => {
    const scaled = Math.round(value * mult)
    if (scaled !== 0) out[key] = scaled
  })
  return out
}

export function adjustedRisk(chance, mod) {
  let c = chance
  if (mod.exhausted) c += 0.15
  if (mod.specialist) c -= 0.1
  return Math.max(0.05, Math.min(0.9, c))
}

// ---------------- RANDOM EVENTS ----------------
export const EVENTS = [
  {
    id: 'dust',
    icon: '🌪️',
    title: 'Dust Storm Approaching',
    text: 'Dust is filling the sky above the base. Sunlight is dropping and wind is stressing the outer equipment.',
    effects: { power: -12, base: -4 },
    fact: "Martian dust storms can grow huge, even planet-wide. NASA's Opportunity rover lost contact during the 2018 global dust storm because dust blocked the sunlight its solar panels needed.",
    response: {
      id: 'resp-dust',
      style: 'emergency',
      skill: 'repair',
      icon: '🛡️',
      title: 'Activate Storm Protocol',
      desc: 'Seal outer hatches, switch to battery reserve and brace the base for the storm.',
      effects: { power: -4, base: 5, safety: 6 },
      lesson: 'Missions plan for dust storms in advance: reducing power use and protecting equipment keeps the crew safe until the sky clears.',
    },
  },
  {
    id: 'solar',
    icon: '🌫️',
    title: 'Reduced Solar Power',
    text: 'A layer of dust has settled over the solar arrays and electricity output is falling.',
    effects: { power: -14 },
    fact: "Dust on solar panels cuts power. NASA's InSight lander slowly lost solar power as dust built up, which eventually ended its mission in 2022.",
    response: {
      id: 'resp-solar',
      style: 'emergency',
      skill: 'power',
      icon: '🧹',
      title: 'Clean the Solar Arrays',
      desc: 'Send a short outdoor team to clear dust from the panels.',
      effects: { power: 15, safety: -3 },
      lesson: 'Maintaining the power system matters as much as building it, and going outside always carries some risk.',
    },
  },
  {
    id: 'equipment',
    icon: '🛠️',
    title: 'Equipment Failure',
    text: 'An alarm sounds: the oxygen generator has a fault and the habitat is losing air quality.',
    effects: { base: -12, oxygen: -6 },
    fact: 'On the International Space Station, systems that make oxygen and recycle water need regular repairs and part swaps. Crews train for this before they fly.',
    response: {
      id: 'resp-equipment',
      style: 'emergency',
      skill: 'repair',
      icon: '🧰',
      title: 'Emergency Repair Crew',
      desc: 'Pull the engineers off other work and fix the generator right now.',
      effects: { base: 14, oxygen: 6, power: -6 },
      lesson: 'Crews carry spare parts and practice repairs because there is no quick resupply from Earth.',
    },
  },
  {
    id: 'waterfault',
    icon: '🚰',
    title: 'Water Supply Problem',
    text: 'The water recycler is clogged and some water has leaked into a storage compartment.',
    effects: { water: -14, base: -3 },
    fact: 'NASA recycles water on the ISS from sources like humidity and urine. NASA reported reaching about 98% water recovery in 2023.',
    response: {
      id: 'resp-waterfault',
      style: 'emergency',
      skill: 'water',
      icon: '🔩',
      title: 'Repair and Flush the Filters',
      desc: 'Stop the leak, flush the recycler and restore the water loop.',
      effects: { water: 12, power: -5 },
      lesson: 'Recycling water is far cheaper than shipping it from Earth, but the recycling hardware must be kept working.',
    },
  },
  {
    id: 'maintenance',
    icon: '🔔',
    title: 'Unexpected Maintenance Alert',
    text: 'Sensors report vibration and wear in several pumps and seals. Something needs attention soon.',
    effects: { base: -10, power: -2 },
    fact: "A space habitat can't pop to a hardware store. NASA plans spare parts, maintenance schedules and repair skills for long missions.",
    response: {
      id: 'resp-maintenance',
      style: 'emergency',
      skill: 'repair',
      icon: '📋',
      title: 'Run Full Diagnostics',
      desc: 'Check every pump, seal and valve before small faults turn into big ones.',
      effects: { base: 10, power: -4, safety: 2 },
      lesson: 'Finding a small fault early is much safer than a failure in the middle of a crisis.',
    },
  },
  {
    id: 'radiation',
    icon: '☢️',
    title: 'Solar Radiation Spike',
    text: 'Monitors show a surge of energetic particles from the Sun. Radiation levels outside are rising.',
    effects: { safety: -8 },
    fact: "Mars has a thin atmosphere and no global magnetic field, so more radiation reaches the surface than on Earth. NASA's Curiosity rover carries an instrument (RAD) to measure it.",
    response: {
      id: 'resp-radiation',
      style: 'emergency',
      skill: 'safety',
      icon: '🧱',
      title: 'Shelter in the Storm Shelter',
      desc: 'Move the whole crew into the most heavily shielded part of the base.',
      effects: { safety: 8, power: -3 },
      lesson: 'Radiation protection is a top safety issue for Mars missions, and shielded shelters help the crew ride out solar storms.',
    },
  },
  {
    id: 'blight',
    icon: '🥀',
    title: 'Greenhouse Crop Trouble',
    text: 'Part of the greenhouse is wilting and yields are dropping.',
    effects: { food: -12 },
    fact: "Growing food in space is hard. NASA's Veggie plant system on the ISS has been used to study growing crops such as lettuce and zinnias.",
    response: {
      id: 'resp-blight',
      style: 'emergency',
      skill: 'food',
      icon: '🌿',
      title: 'Treat and Replant Crops',
      desc: 'Remove the damaged plants, adjust the nutrients and replant the beds.',
      effects: { food: 12, water: -6 },
      lesson: 'On-site food production reduces dependence on supply ships, but it takes water and careful crew attention.',
    },
  },
]

// New in v2: a different schedule every mission.
// Day 1 is always calm. All 7 problems happen once, on random days 2-10.
// If a previous schedule is given, no problem lands on the same day as before.
export function buildSchedule(prev) {
  let schedule = []
  for (let attempt = 0; attempt < 300; attempt++) {
    const slots = shuffle(Array.from({ length: MAX_DAYS - 1 }, (_, i) => i + 1)).slice(0, EVENTS.length)
    const order = shuffle(EVENTS.map((e) => e.id))
    schedule = Array(MAX_DAYS).fill(null)
    slots.forEach((slot, i) => {
      schedule[slot] = order[i]
    })
    const repeats = prev ? schedule.some((id, i) => id && prev[i] === id) : false
    if (!repeats) return schedule
  }
  return schedule
}

// ---------------- DAILY DECISIONS ----------------
export const DECISIONS = [
  {
    id: 'power-save',
    style: 'power',
    icon: '🔋',
    title: 'Power-Saving Mode',
    desc: 'Dim non-essential systems and pause lab activity to save electricity.',
    effects: { power: 10, safety: -2 },
    lesson: 'Mars receives less than half the sunlight Earth does, so power budgeting is a core part of mission planning.',
  },
  {
    id: 'research',
    style: 'research',
    icon: '⚗️',
    title: 'Extra Power for Research',
    desc: 'Run the geology lab at full power to analyze soil and rock samples.',
    effects: { power: -12, science: 15 },
    lesson: 'Science is the reason to go to Mars, but every experiment competes with life support for power.',
  },
  {
    id: 'hydroponics',
    style: 'food',
    icon: '🌱',
    title: 'Divert Water to Hydroponics',
    desc: 'Use stored water to boost the greenhouse harvest.',
    effects: { water: -10, food: 14 },
    lesson: 'Growing food on-site reduces dependence on resupply from Earth, but plants need water.',
  },
  {
    id: 'water-save',
    style: 'water',
    icon: '🚿',
    title: 'Water Conservation Drill',
    desc: 'Recycle greywater and pause irrigation for a day.',
    effects: { water: 8, food: -4 },
    lesson: 'Recycling is the key to long missions: the less water you must carry, the more science you can bring.',
  },
  {
    id: 'repair',
    style: 'repair',
    icon: '🔧',
    title: 'Repair Equipment Now',
    desc: 'Spend the day on maintenance and replace worn parts.',
    effects: { base: 14, power: -6 },
    lesson: 'Preventive maintenance is cheaper and safer than emergency repair.',
  },
  {
    id: 'skip-repairs',
    style: 'risk',
    icon: '🎲',
    title: 'Skip Repairs and Push On',
    desc: 'Keep the crew on research and ignore the wear warnings. Something might break.',
    effects: { science: 12, base: -6, power: 2 },
    risk: {
      chance: 0.4,
      effects: { base: -10, safety: -6, oxygen: -4 },
      text: 'A worn seal failed overnight! Air leaked and the crew had to scramble to fix it.',
    },
    lesson: 'Risk management means weighing a possible gain against a failure that could endanger the crew.',
  },
  {
    id: 'oxygen-boost',
    style: 'oxygen',
    icon: '🌬️',
    title: 'Boost Oxygen Generator',
    desc: 'Run the oxygen generator at full capacity.',
    effects: { oxygen: 14, power: -10 },
    lesson: "Mars's air is mostly carbon dioxide. NASA's MOXIE experiment on the Perseverance rover demonstrated making oxygen from it.",
  },
  {
    id: 'rest',
    style: 'safety',
    icon: '😴',
    title: 'Crew Rest and Morale Day',
    desc: 'Give the crew a lighter schedule, a good meal and time to recover.',
    effects: { safety: 8, food: -2 },
    lesson: 'NASA studies sleep, stress and teamwork because crew health and morale affect mission success.',
  },
  {
    id: 'shielding',
    style: 'safety',
    icon: '🧱',
    title: 'Reinforce Radiation Shielding',
    desc: 'Pile Martian soil (regolith) against the habitat walls for extra protection.',
    effects: { safety: 7, base: 4, power: -5 },
    lesson: 'NASA has studied using local materials like regolith as shielding, because it blocks radiation and needs no shipping from Earth.',
  },
  {
    id: 'rations',
    style: 'food',
    icon: '🍽️',
    title: 'Reduce Daily Rations',
    desc: 'Cut portions to stretch the food supply.',
    effects: { food: 9, safety: -4 },
    lesson: 'Food planning is a balance: too little food hurts health and morale, too much wastes limited supplies.',
  },
  {
    id: 'exercise',
    style: 'safety',
    icon: '🏋️',
    title: 'Exercise and Medical Checks',
    desc: 'Run fitness training and health screenings for every astronaut.',
    effects: { safety: 7, power: -2, oxygen: -3 },
    lesson: 'Astronauts on the ISS exercise about two hours a day to protect their muscles and bones in low gravity.',
  },
  {
    id: 'eva-ice',
    style: 'risk',
    icon: '🧑‍🚀',
    title: 'EVA: Survey for Subsurface Ice',
    desc: 'Send a spacewalk team to find water ice to drill and melt.',
    effects: { water: 12, oxygen: -6, safety: -3, science: 8 },
    risk: {
      chance: 0.25,
      effects: { safety: -8, base: -3 },
      text: 'A suit-seal alarm forced the team back early, and the airlock was damaged in the rush.',
    },
    lesson: "NASA's Mars orbiters have found water ice under the surface in many places. Future crews could use it for water and fuel.",
  },
  {
    id: 'scrubber',
    style: 'oxygen',
    icon: '🧪',
    title: 'CO₂ Scrubber Service',
    desc: 'Service the filters that remove carbon dioxide from the cabin air.',
    effects: { oxygen: 8, base: 3, power: -4 },
    lesson: 'Removing CO₂ from cabin air is vital: a CO₂ buildup becomes dangerous long before the oxygen runs out.',
  },
  {
    id: 'solar-deploy',
    style: 'power',
    icon: '☀️',
    title: 'Deploy Extra Solar Panels',
    desc: 'Unfold a spare set of solar panels outside the base.',
    effects: { power: 14, safety: -3 },
    lesson: 'More panels mean more power, but setting them up takes outdoor work, and every outdoor trip carries some risk.',
  },
  {
    id: 'greenhouse-expand',
    style: 'food',
    icon: '🥬',
    title: 'Expand the Greenhouse',
    desc: 'Add a new growing rack with lights and nutrient lines.',
    effects: { food: 12, power: -7, water: -4 },
    lesson: 'NASA tests space crop systems like Veggie on the ISS to learn how to grow fresh food far from Earth.',
  },
  {
    id: 'ice-melt',
    style: 'water',
    icon: '🧊',
    title: 'Melt Stored Ice',
    desc: 'Use heaters to melt ice reserves into drinking water.',
    effects: { water: 10, power: -8 },
    lesson: 'Water ice could be a key resource for future crews, but melting and cleaning it costs energy.',
  },
  {
    id: 'battery-check',
    style: 'power',
    icon: '🔌',
    title: 'Backup Battery Check',
    desc: 'Test and rebalance the battery banks so nothing is wasted.',
    effects: { power: 6, base: 4, oxygen: -2 },
    lesson: 'Batteries store solar energy for the night and for dust storms, so they need regular health checks.',
  },
  {
    id: 'send-data',
    style: 'research',
    icon: '📡',
    title: 'Transmit Science Data to Earth',
    desc: 'Send the latest samples and measurements back to the science team.',
    effects: { science: 10, power: -6, safety: 2 },
    lesson: 'Mars missions send data home through antennas and orbiters that act as relay stations.',
  },
]

// ---------------- RULES ----------------
export function checkLoss(res) {
  if (res.oxygen <= 0) return 'Oxygen supply exhausted. The crew could no longer breathe safely.'
  if (res.water <= 0) return 'Water reserves ran out. The crew could not survive without water.'
  if (res.food <= 0) return 'Food supplies ran out. The crew could not continue the mission.'
  if (res.power <= 0) return 'Total power failure. Life-support systems shut down.'
  if (res.base <= 0) return 'The habitat suffered catastrophic equipment and structural failure.'
  if (res.safety <= LOSE_SAFETY) return 'Astronaut safety dropped to a critical level. The mission was aborted.'
  return null
}

const labelOf = (key) => RESOURCES.find((r) => r.key === key).label

// Overnight consumption. Returns the new resources and a list of notes for the report.
export function endOfDay(res, drainMult = 1) {
  const next = { ...res }
  const notes = []
  Object.entries(DRAIN).forEach(([key, value]) => {
    next[key] = clamp(next[key] + Math.round(value * drainMult))
  })
  let safety = next.safety
  const vital = ['oxygen', 'water', 'food', 'power']
  vital.forEach((k) => {
    if (next[k] < LOW_LEVEL) {
      safety -= 5
      notes.push({ type: 'bad', text: `${labelOf(k)} is below ${LOW_LEVEL}%: crew safety -5.` })
    }
  })
  if (next.base < LOW_LEVEL) {
    safety -= 4
    notes.push({ type: 'bad', text: `Base condition is below ${LOW_LEVEL}%: crew safety -4.` })
  }
  if (vital.every((k) => next[k] >= 50) && next.base >= 50) {
    safety += 2
    notes.push({ type: 'good', text: 'All systems above 50%: the crew recovered, safety +2.' })
  }
  next.safety = clamp(safety)
  if (notes.length === 0) notes.push({ type: 'info', text: 'Systems stable overnight.' })
  return { res: next, notes }
}

export function evaluateWin(res) {
  const issues = []
  ;['oxygen', 'water', 'food', 'power'].forEach((k) => {
    if (res[k] < WIN.minResource) issues.push(`${labelOf(k)} ended below ${WIN.minResource}%.`)
  })
  if (res.base < WIN.minBase) issues.push(`Base condition ended below ${WIN.minBase}%.`)
  if (res.safety < WIN.minSafety) issues.push(`Astronaut safety ended below ${WIN.minSafety}%.`)
  return { success: issues.length === 0, issues }
}

export function computeScore(res, science, daysSurvived, won, quizCorrect, difficultyId) {
  const lifeSupport = Math.round(((res.oxygen + res.water + res.food + res.power) / 4) * 3)
  const parts = [
    { label: 'Days survived', value: daysSurvived * 40 },
    { label: 'Life-support reserves', value: lifeSupport },
    { label: 'Base condition', value: res.base * 2 },
    { label: 'Astronaut safety', value: res.safety * 3 },
    { label: 'Science research', value: Math.max(0, science) * 4 },
    { label: 'Mission Control quiz', value: quizCorrect * 25 },
    { label: 'Mission success bonus', value: won ? 150 : 0 },
  ]
  const subtotal = parts.reduce((sum, p) => sum + p.value, 0)
  const mult = DIFFICULTY[difficultyId].mult
  const total = Math.round(subtotal * mult)
  let rank = 'D'
  if (total >= 1450) rank = 'S'
  else if (total >= 1150) rank = 'A'
  else if (total >= 900) rank = 'B'
  else if (total >= 600) rank = 'C'
  return { parts, subtotal, mult, total, rank }
}

// ---------------- ACHIEVEMENTS AND SAVE DATA ----------------
export const ACHIEVEMENTS = [
  { id: 'first-landing', icon: '🚀', title: 'First Landing', desc: 'Complete your first mission, win or lose.', check: () => true },
  { id: 'mission-accomplished', icon: '🏆', title: 'Mission Accomplished', desc: 'Survive all 10 days and win.', check: (c) => c.won },
  {
    id: 'zero-risk',
    icon: '🛡️',
    title: 'Zero Risk Commander',
    desc: 'Win without taking any risky action.',
    check: (c) => c.won && c.log.every((l) => !l.risky),
  },
  {
    id: 'storm-survivor',
    icon: '🌪️',
    title: 'Storm Survivor',
    desc: 'Use the Storm Protocol during the dust storm and win.',
    check: (c) => c.won && c.log.some((l) => l.eventId === 'dust' && l.style === 'emergency'),
  },
  { id: 'science-hero', icon: '🔬', title: 'Science Hero', desc: 'Collect 50 or more science points.', check: (c) => c.science >= 50 },
  { id: 'mars-scholar', icon: '🎓', title: 'Mars Scholar', desc: 'Answer 8 or more Mission Control questions correctly.', check: (c) => c.quizCorrect >= 8 },
  {
    id: 'rapid-responder',
    icon: '🚨',
    title: 'Rapid Responder',
    desc: 'Use the emergency response on 6 or more events.',
    check: (c) => c.log.filter((l) => l.eventId && l.style === 'emergency').length >= 6,
  },
  {
    id: 'dream-team',
    icon: '🤝',
    title: 'Dream Team',
    desc: 'Match the right specialist to the job 7 or more times.',
    check: (c) => c.log.filter((l) => l.specialist).length >= 7,
  },
  {
    id: 'resource-master',
    icon: '💎',
    title: 'Resource Master',
    desc: 'Win with every system at 50% or higher.',
    check: (c) => c.won && Object.values(c.res).every((v) => v >= 50),
  },
  {
    id: 'commander-class',
    icon: '🎖️',
    title: 'Commander Class',
    desc: 'Win a mission on Commander difficulty.',
    check: (c) => c.won && c.difficulty === 'commander',
  },
]

export function evaluateAchievements(ctx) {
  return ACHIEVEMENTS.filter((a) => a.check(ctx)).map((a) => a.id)
}

const SAVE_KEY = 'marsx-save-v1'
const DEFAULT_SAVE = { best: 0, missions: 0, wins: 0, unlocked: [], lastSchedule: null, seenTutorial: false }

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return { ...DEFAULT_SAVE }
    return { ...DEFAULT_SAVE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SAVE }
  }
}

export function writeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  } catch {
    /* storage not available */
  }
}

// ---------------- FACTS AND GLOSSARY (based on public NASA information) ----------------
export const MARS_FACTS = [
  'A day on Mars (a "sol") lasts about 24 hours and 39 minutes.',
  "Mars has the tallest volcano in the solar system, Olympus Mons, roughly two and a half times as tall as Mount Everest.",
  "Gravity on Mars is only about 38% of Earth's gravity.",
  'Mars looks red because of iron oxide (rust) in its dust and rocks.',
  'Mars has two small moons, Phobos and Deimos.',
  'Radio signals between Earth and Mars take roughly 5 to 20 minutes one way.',
  "NASA's MOXIE experiment on Perseverance made oxygen from the carbon dioxide in Mars's air.",
  "About 95% of Mars's thin atmosphere is carbon dioxide.",
  "NASA's Ingenuity helicopter made the first powered, controlled flights on another planet in 2021.",
  'A year on Mars lasts about 687 Earth days.',
  "Mars is tilted on its axis by about 25 degrees, similar to Earth, so it has seasons too.",
]

export const GLOSSARY = [
  { term: 'Sol', def: 'One Martian day, about 24 hours and 39 minutes long.' },
  { term: 'EVA', def: 'Extravehicular Activity: work outside the habitat or spacecraft in a spacesuit.' },
  { term: 'Regolith', def: "Loose dust, soil and broken rock covering a planet's surface. It can be piled on a habitat as shielding." },
  { term: 'Radiation shielding', def: 'Material placed between the crew and radiation to reduce how much reaches them.' },
  { term: 'Life support (ECLSS)', def: 'The Environmental Control and Life Support System: it provides air, water and a safe temperature.' },
  { term: 'CO₂ scrubber', def: 'Equipment that removes carbon dioxide from cabin air so the crew can keep breathing safely.' },
  { term: 'Hydroponics', def: 'Growing plants in water with added nutrients instead of soil.' },
  { term: 'MOXIE', def: "An instrument on NASA's Perseverance rover that made oxygen from Martian carbon dioxide as an experiment." },
  { term: 'Solar array', def: 'A group of solar panels that turn sunlight into electricity.' },
  { term: 'Signal delay', def: 'The time radio waves take to travel between Earth and Mars: about 5 to 20 minutes one way.' },
  { term: 'Habitat', def: 'A sealed, pressurized building where the crew lives and works.' },
  { term: 'Specialist (in this game)', def: 'An astronaut whose skills match the action. They get +30% on positive results.' },
]

// ---------------- DEBRIEF ----------------
const LESSONS = {
  oxygen: "Mars's atmosphere is mostly carbon dioxide. NASA's MOXIE experiment on the Perseverance rover demonstrated producing oxygen from it, a step toward future crewed missions.",
  water: "NASA's Mars orbiters have found water ice under the surface in many places, and on the ISS most water is recycled instead of resupplied.",
  food: 'NASA researches growing crops in space (for example the Veggie system on the ISS) because resupply from Earth would take many months.',
  power: 'Mars gets less than half the sunlight Earth does, and dust can cover solar panels, so power planning is critical for any Mars base.',
  base: 'Habitats need constant maintenance. On the ISS, crews regularly inspect, repair and replace hardware to keep systems running.',
  safety: "Mars has a thin atmosphere and no global magnetic field, so radiation exposure is a major concern. NASA's Curiosity rover measures it with its RAD instrument.",
}

export function buildDebrief({ log, res, science, status, reason, quizCorrect, quizAnswered }) {
  const lines = []
  if (log.length === 0) return ['No decisions were recorded before the mission ended.']

  const counts = {}
  log.forEach((l) => {
    counts[l.style] = (counts[l.style] || 0) + 1
  })
  const [topStyle, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  lines.push(
    `You made ${log.length} command decision${log.length === 1 ? '' : 's'}. Your most common priority was ${STYLE_LABELS[topStyle]} (${topCount}×).`
  )

  const events = log.filter((l) => l.eventId).length
  const responded = log.filter((l) => l.eventId && l.style === 'emergency').length
  if (events > 0) {
    lines.push(
      `${events} emergency event${events === 1 ? '' : 's'} hit the base. You used the dedicated emergency response ${responded} time${responded === 1 ? '' : 's'}.`
    )
  }

  const risky = log.filter((l) => l.risky).length
  const backfired = log.filter((l) => l.riskHit).length
  if (risky > 0) {
    lines.push(`You took ${risky} risky action${risky === 1 ? '' : 's'} and ${backfired} backfired. Risk can pay off in research, but it can also hurt the crew.`)
  } else {
    lines.push('You avoided risky shortcuts, which protects the crew but can leave science points on the table.')
  }

  const matched = log.filter((l) => l.specialist).length
  const tiredUses = log.filter((l) => l.exhausted).length
  lines.push(
    `You matched the right specialist to the job ${matched} time${matched === 1 ? '' : 's'}` +
      (tiredUses > 0 ? `, but sent an exhausted astronaut ${tiredUses} time${tiredUses === 1 ? '' : 's'}. Rotating the crew keeps everyone sharp.` : ' and kept the crew well rested.')
  )

  if (quizAnswered > 0) {
    lines.push(`You answered ${quizCorrect} of ${quizAnswered} Mission Control question${quizAnswered === 1 ? '' : 's'} correctly.`)
  } else {
    lines.push('You skipped every Mission Control question. Answering them earns bonus resources and score.')
  }

  if (science >= 40) lines.push(`Your research output was excellent (${science} science points). Mission scientists would be thrilled.`)
  else if (science > 0) lines.push(`You collected ${science} science points. More research is possible if you manage power carefully.`)
  else lines.push('You did not spend any resources on research, so the mission produced no new scientific data.')

  const weakest = RESOURCES.map((r) => ({ ...r, value: res[r.key] })).sort((a, b) => a.value - b.value)[0]
  lines.push(`Your weakest system at the end was ${weakest.label} (${weakest.value}%). ${LESSONS[weakest.key]}`)

  if (status === 'lost') lines.push(`Why the mission ended: ${reason}`)
  return lines
}