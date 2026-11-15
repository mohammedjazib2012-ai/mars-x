import { useState, useEffect } from 'react'
import './App.css'

import BaseView from "./src/src/src/BaseView.jsx";
import { QUIZ } from './src/src/quizData.js'
import { sfx, isMuted, setMuted } from './src/sound.js'
import {
  MAX_DAYS,
  RESOURCES,
  START_RESOURCES,
  CREW,
  SKILL_ICONS,
  DECISIONS,
  EVENTS,
  STYLE_LABELS,
  DIFFICULTY,
  WIN,
  LOSE_SAFETY,
  EXHAUSTED_AT,
  ENERGY_COST,
  ENERGY_REST,
  ACHIEVEMENTS,
  MARS_FACTS,
  GLOSSARY,
  clamp,
  pickRandom,
  shuffle,
  checkLoss,
  endOfDay,
  evaluateWin,
  computeScore,
  buildDebrief,
  crewModifier,
  scaleEffects,
  scaleEvent,
  adjustedRisk,
  buildSchedule,
  evaluateAchievements,
  loadSave,
  writeSave,
} from './gameData'

/* ---------------- helpers ---------------- */

function applyEffects(res, science, effects) {
  const next = { ...res }
  let sci = science
  Object.entries(effects || {}).forEach(([key, value]) => {
    if (key === 'science') sci += value
    else next[key] = clamp(next[key] + value)
  })
  return { res: next, science: sci }
}

function diff(a, b) {
  const d = {}
  RESOURCES.forEach((r) => {
    d[r.key] = b[r.key] - a[r.key]
  })
  return d
}

const levelOf = (v) => (v >= 60 ? 'ok' : v >= 30 ? 'warn' : 'crit')
const STATUS_TEXT = { ok: 'NOMINAL', warn: 'CAUTION', crit: 'CRITICAL' }

function makeQuiz(usedIds) {
  const pool = QUIZ.filter((q) => !usedIds.includes(q.id))
  const q = pickRandom(pool.length > 0 ? pool : QUIZ)
  const correctText = q.options[q.answer]
  const options = shuffle(q.options)
  return {
    id: q.id,
    q: q.q,
    options,
    answerIndex: options.indexOf(correctText),
    explain: q.explain,
    picked: null,
    reward: null,
  }
}

// Builds a new mission day using the mission's event schedule.
function createDay(day, res, science, ctx) {
  const eventId = ctx.schedule[day - 1]
  const event = eventId ? EVENTS.find((e) => e.id === eventId) : null
  const cfg = DIFFICULTY[ctx.difficulty]
  const eventEffects = event ? scaleEvent(event.effects, cfg.event) : null
  const afterEvent = event ? applyEffects(res, science, eventEffects) : { res, science }
  const fresh = DECISIONS.filter((d) => !ctx.prevOptionIds.includes(d.id))
  const picked = shuffle(fresh).slice(0, event ? 2 : 3)
  const options = event ? [event.response, ...picked] : picked
  const mostRested = ctx.crew.reduce((a, b) => (b.energy > a.energy ? b : a))
  return {
    day,
    res: afterEvent.res,
    science: afterEvent.science,
    event,
    eventEffects,
    options,
    stage: 'decide',
    outcome: null,
    report: null,
    deltas: diff(res, afterEvent.res),
    quiz: makeQuiz(ctx.usedQuiz),
    assigned: mostRested.id,
    delayMin: 5 + Math.floor(Math.random() * 16),
  }
}

function playDaySound(event) {
  if (event) sfx.alarm()
  else sfx.radio()
}

/* ---------------- small components ---------------- */

function Starfield() {
  const [stars] = useState(() =>
    Array.from({ length: 110 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 0.6,
      delay: Math.random() * 5,
      dur: 2 + Math.random() * 4,
    }))
  )
  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  )
}

function MuteButton() {
  const [muted, setMutedState] = useState(isMuted())
  return (
    <button
      className="btn-ghost small icon-btn"
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      onClick={() => {
        const next = !muted
        setMuted(next)
        setMutedState(next)
      }}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

function EffectChips({ effects }) {
  return (
    <div className="chips">
      {Object.entries(effects).map(([key, value]) => {
        const info = key === 'science' ? { icon: '🔬', short: 'Research' } : RESOURCES.find((r) => r.key === key)
        return (
          <span key={key} className={`chip ${value > 0 ? 'pos' : 'neg'}`}>
            {info.icon} {info.short} {value > 0 ? '+' : ''}
            {value}
          </span>
        )
      })}
    </div>
  )
}

function ResourceCard({ info, value, delta, tick }) {
  const level = levelOf(value)
  return (
    <div className={`res-card ${level}`}>
      <div className="res-top">
        <span className="res-icon">{info.icon}</span>
        <span className="res-label">{info.label}</span>
      </div>
      <div className="res-value">
        {value}
        <small>%</small>
        {delta !== 0 && (
          <span key={tick} className={`delta ${delta > 0 ? 'pos' : 'neg'}`}>
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )}
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${value}%` }} />
      </div>
      <div className="res-foot">
        <span>{info.blurb}</span>
        <b>{STATUS_TEXT[level]}</b>
      </div>
    </div>
  )
}

function Typewriter({ text, speed = 16 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id)
          return c
        }
        return c + 1
      })
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return (
    <span>
      {text.slice(0, count)}
      <i className="cursor" />
    </span>
  )
}

function DustFx() {
  const [bits] = useState(() =>
    Array.from({ length: 42 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      width: 30 + Math.random() * 90,
      delay: Math.random() * 4,
      dur: 2.5 + Math.random() * 3.5,
      opacity: 0.15 + Math.random() * 0.3,
    }))
  )
  return (
    <>
      <div className="fx fx-dust-tint" />
      {bits.map((b) => (
        <span
          key={b.id}
          className="dust-streak"
          style={{
            top: `${b.top}%`,
            width: b.width,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            opacity: b.opacity,
          }}
        />
      ))}
    </>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn-ghost small" onClick={onClose}>
            CLOSE ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function HelpModal({ onClose }) {
  const [tab, setTab] = useState('play')
  return (
    <Modal title="📖 MISSION MANUAL" onClose={onClose}>
      <div className="tabs">
        <button className={`tab ${tab === 'play' ? 'active' : ''}`} onClick={() => setTab('play')}>
          HOW TO PLAY
        </button>
        <button className={`tab ${tab === 'glossary' ? 'active' : ''}`} onClick={() => setTab('glossary')}>
          GLOSSARY
        </button>
      </div>
      {tab === 'play' ? (
        <ol className="how-list">
          <li>
            <b>Read the transmission.</b> Mission Control tells you about the day's problem. Its damage has already hit your resources.
          </li>
          <li>
            <b>Assign an astronaut.</b> A specialist gets +30% on positive results. An exhausted astronaut (energy under {EXHAUSTED_AT}%) gets −30% and raises the risk of a mishap. Rotate your crew!
          </li>
          <li>
            <b>Choose one action.</b> Green chips help, red chips cost. Event responses are marked in orange.
          </li>
          <li>
            <b>Answer the Mission Control question</b> for a bonus: +5 to your weakest system and +5 research.
          </li>
          <li>
            <b>End the day.</b> The base uses oxygen, water, food and power overnight, and you see a report.
          </li>
          <li>
            <b>Win</b> by surviving 10 days with healthy levels. Every mission has all 7 problems, but on different days each time.
          </li>
        </ol>
      ) : (
        <dl className="glossary">
          {GLOSSARY.map((g) => (
            <div key={g.term}>
              <dt>{g.term}</dt>
              <dd>{g.def}</dd>
            </div>
          ))}
        </dl>
      )}
    </Modal>
  )
}

function MedalsModal({ save, onClose }) {
  return (
    <Modal title="🏅 MEDALS AND RECORDS" onClose={onClose}>
      <div className="records">
        <div>
          <b>{save.best}</b>
          <span>Best score</span>
        </div>
        <div>
          <b>{save.missions}</b>
          <span>Missions flown</span>
        </div>
        <div>
          <b>{save.wins}</b>
          <span>Missions won</span>
        </div>
        <div>
          <b>
            {save.unlocked.length}/{ACHIEVEMENTS.length}
          </b>
          <span>Medals</span>
        </div>
      </div>
      <div className="medal-grid">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = save.unlocked.includes(a.id)
          return (
            <div key={a.id} className={`medal ${unlocked ? 'unlocked' : ''}`}>
              <span className="medal-icon">{unlocked ? a.icon : '🔒'}</span>
              <span>
                <b>{a.title}</b>
                <em>{a.desc}</em>
              </span>
            </div>
          )
        })}
      </div>
      <p className="muted">Records are saved in this browser only.</p>
    </Modal>
  )
}

function CrewPicker({ crew, assigned, onAssign }) {
  return (
    <section className="panel crew-picker">
      <h3 className="panel-title">👩‍🚀 STEP 1 · ASSIGN AN ASTRONAUT TO THIS TASK</h3>
      <div className="picker-row">
        {CREW.map((c) => {
          const energy = crew.find((x) => x.id === c.id).energy
          const tired = energy < EXHAUSTED_AT
          return (
            <button
              key={c.id}
              className={`picker ${assigned === c.id ? 'active' : ''} ${tired ? 'tired' : ''}`}
              onClick={() => onAssign(c.id)}
            >
              <span className="avatar">{c.initials}</span>
              <span className="picker-info">
                <b>{c.name}</b>
                <em>{c.role}</em>
                <span className="skill-icons">
                  {c.skills.map((s) => (
                    <i key={s} title={s}>
                      {SKILL_ICONS[s]}
                    </i>
                  ))}
                </span>
                <span className="mini-bar">
                  <span className={`mini-fill ${tired ? 'crit' : 'ok'}`} style={{ width: `${energy}%` }} />
                </span>
                <small>{tired ? 'EXHAUSTED' : `ENERGY ${energy}%`}</small>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function QuizCard({ quiz, onAnswer }) {
  const answered = quiz.picked !== null
  const correct = answered && quiz.picked === quiz.answerIndex
  return (
    <section className="panel quiz">
      <div className="quiz-head">
        <span className="alert-tag calm">📡 MISSION CONTROL QUESTION</span>
        <span className="quiz-bonus">BONUS: +5 weakest system · +5 research</span>
      </div>
      <h4>{quiz.q}</h4>
      <div className="quiz-options">
        {quiz.options.map((o, i) => {
          let cls = 'quiz-opt'
          if (answered) {
            if (i === quiz.answerIndex) cls += ' right'
            else if (i === quiz.picked) cls += ' wrong'
            else cls += ' dim'
          }
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => onAnswer(i)}>
              <b>{'ABCD'[i]}</b> {o}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`quiz-result ${correct ? 'good' : 'bad'}`}>
          <b>{correct ? '✅ Correct!' : '❌ Not quite.'}</b> {quiz.explain}
          {quiz.reward && <em>{quiz.reward}</em>}
        </div>
      )}
    </section>
  )
}

/* ---------------- screens ---------------- */

function MenuScreen({ onStart, onHelp, onMedals, save }) {
  const [fact] = useState(() => pickRandom(MARS_FACTS))
  return (
    <div className="screen menu" key="menu">
      <div className="menu-tools">
        <MuteButton />
      </div>
      <div className="planet" aria-hidden="true" />
      <div className="menu-content">
        <div className="tag-line">NASA SPACE APPS CHALLENGE 2026 · JUNIOR ASTRONAUT MISSION TRAINER</div>
        <h1 className="logo">
          MARS<span>X</span>
        </h1>
        <h2 className="logo-sub">MISSION CONTROL · MARS BASE MANAGER</h2>
        <p className="intro">
          You are the commander of a small Mars colony. For 10 mission days you must keep four astronauts alive by
          managing oxygen, water, food, electricity and the base itself, while dust storms, equipment failures and
          radiation spikes try to stop you. Every decision has a consequence.
        </p>
        <div className="menu-buttons">
          <button className="btn-primary big" onClick={onStart}>
            INITIALIZE MISSION
          </button>
          <button className="btn-ghost" onClick={onHelp}>
            📖 HOW TO PLAY
          </button>
          <button className="btn-ghost" onClick={onMedals}>
            🏅 MEDALS ({save.unlocked.length}/{ACHIEVEMENTS.length})
          </button>
        </div>
        <div className="menu-stats">
          <div>
            <b>10</b>
            <span>Mission Days</span>
          </div>
          <div>
            <b>7</b>
            <span>Random Problems</span>
          </div>
          <div>
            <b>4</b>
            <span>Astronauts</span>
          </div>
          <div>
            <b>{save.best}</b>
            <span>Best Score</span>
          </div>
        </div>
        <div className="fact menu-fact">
          <span>DID YOU KNOW?</span>
          {fact}
        </div>
        <p className="fine-print">
          Educational simulation. Resource values are simplified game numbers, not real NASA measurements.
        </p>
      </div>
    </div>
  )
}

function BriefingScreen({ onBack, onBegin, difficulty, setDifficulty }) {
  return (
    <div className="screen briefing" key="briefing">
      <div className="briefing-head">
        <div className="tag-line">CLASSIFIED · MISSION BRIEFING</div>
        <h2 className="screen-title">Welcome, Commander</h2>
        <p className="lead">
          Your habitat is established, supplies are stocked and Earth is millions of kilometres away. Radio messages
          between Earth and Mars take roughly 5 to 20 minutes one way, so the decisions are yours.
        </p>
      </div>

      <div className="brief-grid">
        <div className="panel">
          <h3 className="panel-title">🎯 Objective</h3>
          <p>
            Keep the colony alive and healthy for <b>10 mission days</b>. Each day you may get a problem report from
            Earth. Assign an astronaut, choose <b>one action</b> and answer a Mission Control question. At day's end
            the base consumes oxygen, water, food and power.
          </p>
          <p className="muted">
            All 7 problems strike during every mission, but on different days each time, so you can never memorize the order.
          </p>
        </div>

        <div className="panel">
          <h3 className="panel-title">🧑‍🚀 Your Crew (fictional)</h3>
          <ul className="crew-brief">
            {CREW.map((c) => (
              <li key={c.id}>
                <span className="avatar">{c.initials}</span>
                <span>
                  <b>{c.name}</b>
                  <em>
                    {c.role} · {c.skills.map((s) => SKILL_ICONS[s]).join(' ')}
                  </em>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3 className="panel-title">📊 Resources</h3>
          <ul className="res-brief">
            {RESOURCES.map((r) => (
              <li key={r.key}>
                <span>{r.icon}</span>
                <b>{r.label}</b>
                <em>{r.blurb}</em>
              </li>
            ))}
          </ul>
          <p className="muted">Everything starts at 100%.</p>
        </div>

        <div className="panel">
          <h3 className="panel-title">⚖️ Win and Lose</h3>
          <p>
            <b className="good">Win:</b> survive all 10 days with Oxygen, Water, Food and Power at {WIN.minResource}%
            or more, Base Condition at {WIN.minBase}%+ and Astronaut Safety at {WIN.minSafety}%+.
          </p>
          <p>
            <b className="bad">Lose:</b> any vital resource or the base reaches 0%, or Astronaut Safety falls to{' '}
            {LOSE_SAFETY}% or below.
          </p>
        </div>

        <div className="panel wide">
          <h3 className="panel-title">🎚️ Choose Difficulty</h3>
          <div className="diff-row">
            {Object.values(DIFFICULTY).map((d) => (
              <button
                key={d.id}
                className={`diff-card ${difficulty === d.id ? 'active' : ''}`}
                onClick={() => setDifficulty(d.id)}
              >
                <b>
                  {d.icon} {d.label}
                </b>
                <span>{d.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel wide">
          <h3 className="panel-title">🔭 Mars Facts (based on public NASA information)</h3>
          <div className="facts-row">
            <div className="fact">
              <span>SOL</span>A Martian day is about 24 hours 39 minutes long, slightly longer than an Earth day.
            </div>
            <div className="fact">
              <span>ATMOSPHERE</span>Mars's air is thin and mostly carbon dioxide, so you cannot breathe it and it gives little radiation shelter.
            </div>
            <div className="fact">
              <span>SUNLIGHT</span>Mars receives less than half the sunlight Earth does, so solar power must be managed carefully.
            </div>
          </div>
          <p className="muted">
            ⚠ All percentages, drains and event effects in this game are simplified simulations, not real NASA measurements.
          </p>
        </div>
      </div>

      <div className="briefing-actions">
        <button className="btn-ghost" onClick={onBack}>
          ← BACK
        </button>
        <button className="btn-primary big" onClick={onBegin}>
          BEGIN MISSION
        </button>
      </div>
    </div>
  )
}

function GameScreen({ game, h }) {
  const { day, res, event, eventEffects, options, stage, outcome, report, deltas, log, tick, crew, assigned, quiz, delayMin, difficulty } = game
  const completed = stage === 'decide' ? day - 1 : day
  const progress = Math.round((completed / MAX_DAYS) * 100)
  const member = CREW.find((c) => c.id === assigned)
  const energy = crew.find((c) => c.id === assigned).energy
  const lost = game.status === 'lost'
  const outcomeLabel = lost ? 'VIEW MISSION REPORT' : `END DAY ${day} ▸ OVERNIGHT REPORT`
  const reportLabel = lost ? 'VIEW MISSION REPORT' : day >= MAX_DAYS ? 'FINISH MISSION' : `BEGIN DAY ${day + 1}`
  const radioText = event
    ? `Commander, this is Mission Control. ${event.text} Act as soon as you can. Out.`
    : ''
  const diffInfo = DIFFICULTY[difficulty]

  return (
    <>
      <div className="fx-layer" aria-hidden="true">
        {event && event.id === 'dust' && <DustFx key={`dust-${day}`} />}
        {event && event.id === 'radiation' && <div key={`rad-${day}`} className="fx fx-rad" />}
        {event && (event.id === 'equipment' || event.id === 'maintenance') && (
          <div key={`alarm-${day}`} className="fx fx-alarm" />
        )}
        {res.power < 25 && <div className="fx fx-dark" />}
      </div>

      <div className="screen game">
        <header className="topbar panel">
          <div className="brand">
            MARS<span>X</span>
            <small>MISSION CONTROL</small>
          </div>
          <div className="day-box">
            <small>MISSION DAY</small>
            <b>
              {day}
              <i> / {MAX_DAYS}</i>
            </b>
          </div>
          <div className="progress-wrap">
            <div className="progress-label">
              <span>MISSION PROGRESS</span>
              <b>{progress}%</b>
            </div>
            <div className="segments">
              {Array.from({ length: MAX_DAYS }, (_, i) => (
                <div key={i} className={`seg ${i < completed ? 'done' : i === completed ? 'current' : ''}`} />
              ))}
            </div>
          </div>
          <div className="top-actions">
            <span className="diff-tag">
              {diffInfo.icon} {diffInfo.label}
            </span>
            <button className="btn-ghost small icon-btn" onClick={h.help} aria-label="Help">
              ❓
            </button>
            <MuteButton />
            <button className="btn-ghost small" onClick={h.abort}>
              ABORT
            </button>
          </div>
        </header>

        <section className="res-strip">
          {RESOURCES.map((r) => (
            <ResourceCard key={r.key} info={r} value={res[r.key]} delta={deltas[r.key] || 0} tick={tick} />
          ))}
        </section>

        <div className="dash-grid">
          <div className="main-col">
            <section className="panel baseview">
              <BaseView power={res.power} base={res.base} eventId={event ? event.id : null} />
            </section>

            {event ? (
              <section className="panel event shake" key={`event-${day}`}>
                <div className="event-head">
                  <span className="event-icon">{event.icon}</span>
                  <div>
                    <span className="alert-tag">📡 INCOMING TRANSMISSION · DAY {day}</span>
                    <h3>{event.title}</h3>
                  </div>
                </div>
                <div className="radio-box">
                  <small>EARTH MISSION CONTROL · SIGNAL DELAY ≈ {delayMin} MIN (simulated)</small>
                  <p className="radio-text">
                    <Typewriter key={`tw-${day}`} text={radioText} />
                  </p>
                </div>
                <div className="impact">
                  <small>IMPACT ALREADY APPLIED:</small>
                  <EffectChips effects={eventEffects} />
                </div>
                <div className="fact">
                  <span>NASA SCIENCE NOTE</span>
                  {event.fact}
                </div>
              </section>
            ) : (
              <section className="panel event calm" key={`event-${day}`}>
                <div className="event-head">
                  <span className="event-icon">✅</span>
                  <div>
                    <span className="alert-tag calm">ALL SYSTEMS NOMINAL · DAY {day}</span>
                    <h3>{day === 1 ? 'Mission Start: Calm Conditions' : 'A Quiet Day on Mars'}</h3>
                  </div>
                </div>
                <p>
                  {day === 1
                    ? 'The first day is calm. Every action costs something, so look at the effects before you commit. Pick an astronaut first.'
                    : 'No emergencies today. Use the quiet day to strengthen your weakest system and rest tired astronauts.'}
                </p>
              </section>
            )}

            {stage === 'decide' && (
              <>
                <CrewPicker crew={crew} assigned={assigned} onAssign={h.assign} />
                <section key={`opts-${day}`}>
                  <h3 className="section-title">STEP 2 · CHOOSE ONE ACTION FOR {member.name.toUpperCase()}</h3>
                  <div className="options">
                    {options.map((opt) => {
                      const mod = crewModifier(member, energy, opt)
                      const eff = scaleEffects(opt.effects, mod.mult)
                      const chance = opt.risk ? adjustedRisk(opt.risk.chance, mod) : null
                      return (
                        <button
                          key={opt.id}
                          className={`option ${opt.style === 'emergency' ? 'emergency' : ''}`}
                          onClick={() => h.choose(opt)}
                        >
                          <div className="opt-top">
                            <span className="opt-icon">{opt.icon}</span>
                            <span className="opt-tag">
                              {opt.style === 'emergency' ? 'EVENT RESPONSE' : STYLE_LABELS[opt.style]}
                            </span>
                          </div>
                          <h4>{opt.title}</h4>
                          <p>{opt.desc}</p>
                          <EffectChips effects={eff} />
                          <div className="badges">
                            {mod.specialist && <span className="badge spec">★ SPECIALIST +30%</span>}
                            {mod.exhausted && <span className="badge tired">😓 EXHAUSTED −30%</span>}
                          </div>
                          {opt.risk && (
                            <div className="risk-note">⚠ RISK: {Math.round(chance * 100)}% chance of a problem</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </section>
              </>
            )}

            {stage === 'outcome' && (
              <section className="panel outcome" key={`out-${day}`}>
                <span className="alert-tag calm">ACTION LOGGED</span>
                <h3>
                  {outcome.option.icon} {outcome.option.title}
                </h3>
                <p>{outcome.option.desc}</p>
                <div className="crew-line">
                  👤 Carried out by <b>{outcome.crewName}</b>
                  {outcome.mod.specialist && <span className="badge spec">★ SPECIALIST +30%</span>}
                  {outcome.mod.exhausted && <span className="badge tired">😓 EXHAUSTED −30%</span>}
                </div>
                <EffectChips effects={outcome.effects} />
                {outcome.riskHit && (
                  <div className="risk-alert bad">
                    ⚠ {outcome.option.risk.text}
                    <EffectChips effects={outcome.option.risk.effects} />
                  </div>
                )}
                {outcome.option.risk && !outcome.riskHit && (
                  <div className="risk-alert good">✓ You took a risk and got away with it this time.</div>
                )}
                <div className="fact">
                  <span>MISSION LESSON</span>
                  {outcome.option.lesson}
                </div>
                {lost && <div className="risk-alert bad">⛔ {game.reason}</div>}
                {!lost && (
                  <p className="muted">
                    Answer the Mission Control question below for a bonus, then end the day. The base consumes supplies overnight (game simulation).
                  </p>
                )}
                <button className="btn-primary" onClick={h.endDay}>
                  {outcomeLabel}
                </button>
              </section>
            )}

            {stage === 'report' && report && (
              <section className="panel report" key={`rep-${day}`}>
                <span className="alert-tag calm">END OF DAY {day} · OVERNIGHT REPORT</span>
                <h3>Overnight Resource Report</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>System</th>
                      <th>Start</th>
                      <th>Consumed</th>
                      <th>End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RESOURCES.map((r) => {
                      const change = report.after[r.key] - report.before[r.key]
                      return (
                        <tr key={r.key}>
                          <td>
                            {r.icon} {r.label}
                          </td>
                          <td>{report.before[r.key]}%</td>
                          <td className={change < 0 ? 'neg' : change > 0 ? 'pos' : ''}>
                            {change > 0 ? '+' : ''}
                            {change}
                          </td>
                          <td>
                            <b>{report.after[r.key]}%</b>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <ul className="notes">
                  {report.notes.map((n, i) => (
                    <li key={i} className={n.type}>
                      {n.type === 'bad' ? '⚠' : n.type === 'good' ? '✅' : 'ℹ️'} {n.text}
                    </li>
                  ))}
                </ul>
                <p className="muted">Astronauts rested overnight and recovered some energy.</p>
                <div className="fact">
                  <span>DID YOU KNOW?</span>
                  {report.fact}
                </div>
                {lost && <div className="risk-alert bad">⛔ {game.reason}</div>}
                <button className="btn-primary" onClick={h.proceed}>
                  {reportLabel}
                </button>
              </section>
            )}

            {stage !== 'report' && <QuizCard key={`quiz-${day}`} quiz={quiz} onAnswer={h.answerQuiz} />}
          </div>

          <aside className="side-col">
            <section className="panel">
              <h3 className="panel-title">🧑‍🚀 CREW STATUS</h3>
              <ul className="crew-list">
                {CREW.map((c) => {
                  const hp = clamp(res.safety + c.offset)
                  const lvl = levelOf(hp)
                  const en = crew.find((x) => x.id === c.id).energy
                  return (
                    <li key={c.id}>
                      <span className="avatar">{c.initials}</span>
                      <div className="crew-info">
                        <div>
                          <b>{c.name}</b>
                          <em>
                            {c.role} · energy {en}%{en < EXHAUSTED_AT ? ' 😓' : ''}
                          </em>
                        </div>
                        <div className="bar thin">
                          <div className={`bar-fill ${lvl}`} style={{ width: `${hp}%` }} />
                        </div>
                      </div>
                      <span className={`crew-status ${lvl}`}>{hp >= 70 ? 'HEALTHY' : hp >= 40 ? 'STRESSED' : 'AT RISK'}</span>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="panel">
              <h3 className="panel-title">📜 MISSION LOG</h3>
              {log.length === 0 ? (
                <p className="muted">No actions logged yet.</p>
              ) : (
                <ul className="log-list">
                  {[...log].reverse().map((l) => (
                    <li key={l.day}>
                      <b>DAY {l.day}</b>
                      <span>{l.choice}</span>
                      <em>
                        by {l.crewName}
                        {l.eventTitle ? ` · Event: ${l.eventTitle}` : ''}
                      </em>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </>
  )
}

function ResultScreen({ game, onRestart, onMenu }) {
  const { res, science, log, status, reason, summary, quizCorrect, quizAnswered, difficulty } = game
  const won = status === 'won'
  const { score, newMedals, isBest, prevBest } = summary
  const debrief = buildDebrief({ log, res, science, status, reason, quizCorrect, quizAnswered })
  const title = won ? 'MISSION SUCCESS' : status === 'failed' ? 'MISSION INCOMPLETE' : 'MISSION FAILED'
  const subtitle = won
    ? 'The colony survived all 10 days within safe limits. Outstanding work, Commander.'
    : status === 'failed'
    ? `The crew survived, but the base did not meet safe standards. ${reason}`
    : reason
  const diffInfo = DIFFICULTY[difficulty]

  return (
    <div className="screen result" key="result">
      <div className={`result-banner ${won ? 'win' : status === 'failed' ? 'partial' : 'lose'}`}>
        <div className="result-icon">{won ? '🏆' : status === 'failed' ? '⚠️' : '💥'}</div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="result-tags">
          <span>
            {diffInfo.icon} {diffInfo.label} difficulty
          </span>
          {isBest && <span className="best">🌟 NEW BEST SCORE</span>}
        </div>
      </div>

      <div className="result-grid">
        <section className="panel">
          <h3 className="panel-title">📊 FINAL RESOURCE LEVELS</h3>
          <div className="final-bars">
            {RESOURCES.map((r) => {
              const v = res[r.key]
              return (
                <div key={r.key} className="final-row">
                  <span>
                    {r.icon} {r.label}
                  </span>
                  <div className="bar">
                    <div className={`bar-fill ${levelOf(v)}`} style={{ width: `${v}%` }} />
                  </div>
                  <b>{v}%</b>
                </div>
              )
            })}
          </div>
        </section>

        <section className="panel score-panel">
          <h3 className="panel-title">🏅 MISSION SCORE</h3>
          <div className="score-big">
            <b>{score.total}</b>
            <span className="rank">RANK {score.rank}</span>
          </div>
          <ul className="score-parts">
            {score.parts.map((p) => (
              <li key={p.label}>
                <span>{p.label}</span>
                <b>+{p.value}</b>
              </li>
            ))}
            <li>
              <span>Difficulty multiplier</span>
              <b>×{score.mult}</b>
            </li>
          </ul>
          <p className="muted">Previous best: {prevBest}</p>
        </section>

        {newMedals.length > 0 && (
          <section className="panel wide">
            <h3 className="panel-title">🎖️ NEW MEDALS UNLOCKED</h3>
            <div className="medal-grid">
              {ACHIEVEMENTS.filter((a) => newMedals.includes(a.id)).map((a) => (
                <div key={a.id} className="medal unlocked">
                  <span className="medal-icon">{a.icon}</span>
                  <span>
                    <b>{a.title}</b>
                    <em>{a.desc}</em>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="panel wide">
          <h3 className="panel-title">🧠 COMMANDER DEBRIEF · WHAT YOUR DECISIONS MEANT</h3>
          <ul className="debrief">
            {debrief.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="panel wide">
          <h3 className="panel-title">🗂️ DECISION TIMELINE</h3>
          <ul className="timeline">
            {log.map((l) => (
              <li key={l.day}>
                <b>DAY {l.day}</b>
                <span>{l.choice}</span>
                <em>
                  by {l.crewName}
                  {l.eventTitle ? ` · Event: ${l.eventTitle}` : ''}
                </em>
                {l.riskHit && <strong>Risk backfired</strong>}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="briefing-actions">
        <button className="btn-ghost" onClick={onMenu}>
          MAIN MENU
        </button>
        <button className="btn-primary big" onClick={onRestart}>
          RESTART MISSION
        </button>
      </div>
      <p className="fine-print center">
        Restarting shuffles all problems onto new days. Simplified educational simulation. Learn more from NASA at nasa.gov.
      </p>
    </div>
  )
}

/* ---------------- main app ---------------- */

function App() {
  const [screen, setScreen] = useState('menu')
  const [game, setGame] = useState(null)
  const [save, setSave] = useState(() => loadSave())
  const [difficulty, setDifficulty] = useState('astronaut')
  const [modal, setModal] = useState(null)

  function persist(next) {
    setSave(next)
    writeSave(next)
  }

  function startMission() {
    const schedule = buildSchedule(save.lastSchedule)
    const crew = CREW.map((c) => ({ id: c.id, energy: 100 }))
    const first = createDay(1, START_RESOURCES, 0, {
      schedule,
      difficulty,
      prevOptionIds: [],
      usedQuiz: [],
      crew,
    })
    const nextSave = { ...save, lastSchedule: schedule }
    persist(nextSave)
    setGame({
      ...first,
      schedule,
      difficulty,
      crew,
      log: [],
      prevOptionIds: first.options.map((o) => o.id),
      usedQuiz: [first.quiz.id],
      quizCorrect: 0,
      quizAnswered: 0,
      status: 'playing',
      reason: '',
      tick: 0,
      summary: null,
    })
    setScreen('game')
    playDaySound(first.event)
    if (!save.seenTutorial) setModal('help')
  }

  function assignCrew(id) {
    if (!game || game.stage !== 'decide') return
    setGame({ ...game, assigned: id })
  }

  function chooseOption(opt) {
    if (!game || game.stage !== 'decide') return
    const member = CREW.find((c) => c.id === game.assigned)
    const energy = game.crew.find((c) => c.id === game.assigned).energy
    const mod = crewModifier(member, energy, opt)
    const effects = scaleEffects(opt.effects, mod.mult)
    const riskHit = opt.risk ? Math.random() < adjustedRisk(opt.risk.chance, mod) : false

    let result = applyEffects(game.res, game.science, effects)
    if (riskHit) result = applyEffects(result.res, result.science, opt.risk.effects)
    const reason = checkLoss(result.res)
    const change = diff(game.res, result.res)
    const crew = game.crew.map((c) => (c.id === game.assigned ? { ...c, energy: Math.max(0, c.energy - ENERGY_COST) } : c))

    if (reason) sfx.lose()
    else if (riskHit) sfx.bad()
    else sfx.good()

    setGame({
      ...game,
      res: result.res,
      science: result.science,
      crew,
      stage: 'outcome',
      outcome: { option: opt, riskHit, effects, mod, crewName: member.name },
      deltas: change,
      log: [
        ...game.log,
        {
          day: game.day,
          eventId: game.event ? game.event.id : null,
          eventTitle: game.event ? game.event.title : null,
          choice: opt.title,
          style: opt.style,
          risky: Boolean(opt.risk),
          riskHit,
          crewName: member.name,
          specialist: mod.specialist,
          exhausted: mod.exhausted,
        },
      ],
      status: reason ? 'lost' : 'playing',
      reason: reason || '',
      tick: game.tick + 1,
    })
  }

  function answerQuiz(index) {
    if (!game || game.quiz.picked !== null || game.stage === 'report') return
    const correct = index === game.quiz.answerIndex
    let res = game.res
    let science = game.science
    let reward = null
    if (correct) {
      const weakest = ['oxygen', 'water', 'food', 'power', 'base'].sort((a, b) => game.res[a] - game.res[b])[0]
      const result = applyEffects(game.res, game.science, { [weakest]: 5, science: 5 })
      res = result.res
      science = result.science
      const label = RESOURCES.find((r) => r.key === weakest).label
      reward = `Bonus applied: +5 ${label} and +5 research.`
      sfx.good()
    } else {
      sfx.bad()
    }
    setGame({
      ...game,
      res,
      science,
      quizCorrect: game.quizCorrect + (correct ? 1 : 0),
      quizAnswered: game.quizAnswered + 1,
      quiz: { ...game.quiz, picked: index, reward },
      deltas: diff(game.res, res),
      tick: game.tick + 1,
    })
  }

  function finishMission(g, status, reason, res) {
    const won = status === 'won'
    const daysSurvived = status === 'lost' ? Math.max(0, g.day - 1) : MAX_DAYS
    const score = computeScore(res, g.science, daysSurvived, won, g.quizCorrect, g.difficulty)
    const earned = evaluateAchievements({
      won,
      status,
      res,
      science: g.science,
      log: g.log,
      quizCorrect: g.quizCorrect,
      difficulty: g.difficulty,
    })
    const newMedals = earned.filter((id) => !save.unlocked.includes(id))
    const isBest = score.total > save.best
    persist({
      ...save,
      best: Math.max(save.best, score.total),
      missions: save.missions + 1,
      wins: save.wins + (won ? 1 : 0),
      unlocked: [...save.unlocked, ...newMedals],
    })
    setGame({
      ...g,
      res,
      status,
      reason,
      stage: 'done',
      summary: { score, newMedals, isBest, prevBest: save.best },
      tick: g.tick + 1,
    })
    if (won) sfx.win()
    else sfx.lose()
    setScreen('result')
  }

  function endDay() {
    if (!game || game.stage !== 'outcome') return
    if (game.status === 'lost') {
      finishMission(game, 'lost', game.reason, game.res)
      return
    }
    const cfg = DIFFICULTY[game.difficulty]
    const { res: drained, notes } = endOfDay(game.res, cfg.drain)
    const lossReason = checkLoss(drained)
    const crew = game.crew.map((c) => ({ ...c, energy: Math.min(100, c.energy + ENERGY_REST) }))
    if (lossReason) sfx.lose()
    setGame({
      ...game,
      res: drained,
      crew,
      stage: 'report',
      report: { before: game.res, after: drained, notes, fact: pickRandom(MARS_FACTS) },
      deltas: diff(game.res, drained),
      status: lossReason ? 'lost' : 'playing',
      reason: lossReason || '',
      tick: game.tick + 1,
    })
  }

  function proceed() {
    if (!game || game.stage !== 'report') return
    if (game.status === 'lost') {
      finishMission(game, 'lost', game.reason, game.res)
      return
    }
    if (game.day >= MAX_DAYS) {
      const verdict = evaluateWin(game.res)
      finishMission(game, verdict.success ? 'won' : 'failed', verdict.issues.join(' '), game.res)
      return
    }
    const nd = createDay(game.day + 1, game.res, game.science, {
      schedule: game.schedule,
      difficulty: game.difficulty,
      prevOptionIds: game.prevOptionIds,
      usedQuiz: game.usedQuiz,
      crew: game.crew,
    })
    setGame({
      ...game,
      ...nd,
      prevOptionIds: nd.options.map((o) => o.id),
      usedQuiz: [...game.usedQuiz, nd.quiz.id],
      tick: game.tick + 1,
    })
    playDaySound(nd.event)
  }

  function abortMission() {
    if (window.confirm('Abort the mission and return to the main menu?')) {
      setGame(null)
      setScreen('menu')
    }
  }

  function closeModal() {
    if (modal === 'help' && !save.seenTutorial) persist({ ...save, seenTutorial: true })
    setModal(null)
  }

  const handlers = {
    choose: chooseOption,
    assign: assignCrew,
    answerQuiz,
    endDay,
    proceed,
    abort: abortMission,
    help: () => setModal('help'),
  }

  return (
    <div
      className="app"
      onClickCapture={(e) => {
        if (e.target.closest && e.target.closest('button')) sfx.click()
      }}
    >
      <Starfield />
      <div className="nebula" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />

      {screen === 'menu' && (
        <MenuScreen
          save={save}
          onStart={() => setScreen('briefing')}
          onHelp={() => setModal('help')}
          onMedals={() => setModal('medals')}
        />
      )}
      {screen === 'briefing' && (
        <BriefingScreen
          onBack={() => setScreen('menu')}
          onBegin={startMission}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />
      )}
      {screen === 'game' && game && <GameScreen game={game} h={handlers} />}
      {screen === 'result' && game && (
        <ResultScreen
          game={game}
          onRestart={startMission}
          onMenu={() => {
            setGame(null)
            setScreen('menu')
          }}
        />
      )}

      {modal === 'help' && <HelpModal onClose={closeModal} />}
      {modal === 'medals' && <MedalsModal save={save} onClose={closeModal} />}
    </div>
  )
}

export default App