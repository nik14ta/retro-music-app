import { useState, useEffect, useRef, useMemo } from 'react'
import './index.css'
import songs from './songs'

function formatTime(secs) {
  if (isNaN(secs) || !secs) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span>
      {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
    </span>
  )
}

// Stable dust particles — generated once so they don't re-randomise on every render
const DUST = Array.from({ length: 25 }).map((_, i) => ({
  id: i,
  left: `${5 + Math.random() * 50}%`,   // cluster near the window/left side
  bottom: `${20 + Math.random() * 50}%`,
  delay: `${Math.random() * 8}s`,
  duration: `${6 + Math.random() * 8}s`,
  dx: `${(Math.random() - 0.5) * 40}px`,
  size: `${1 + Math.random() * 2}px`,
  opacity: 0.4 + Math.random() * 0.5,
}))

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  // cinemaTriggered: becomes true 1 second after play starts — drives the crossfade
  const [cinemaTriggered, setCinemaTriggered] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [noteStyles, setNoteStyles] = useState([])

  const audioRef = useRef(null)
  const cinemaTimer = useRef(null)

  const currentSong = songs[currentIndex]

  // Waveform bars — stable per song
  const waveBars = useMemo(() =>
    Array.from({ length: 60 }).map((_, i) => ({
      h: Math.max(6, 20 + Math.sin(i * 0.55) * 10 + Math.sin(i * 0.2) * 8),
    })),
    [currentIndex]
  )

  // Song change: reset & maybe auto-play
  useEffect(() => {
    setProgress(0)
    setCinemaTriggered(false)
    if (audioRef.current) {
      audioRef.current.load()
      if (isPlaying) audioRef.current.play().catch(() => {})
    }
  }, [currentIndex])

  // Play / Pause sync
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.play().catch(() => {})
      // After 1 second of playing, trigger the cinematic crossfade
      cinemaTimer.current = setTimeout(() => setCinemaTriggered(true), 1000)
    } else {
      audioRef.current.pause()
      clearTimeout(cinemaTimer.current)
      setCinemaTriggered(false)
    }
    return () => clearTimeout(cinemaTimer.current)
  }, [isPlaying])

  // Volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setProgress(audioRef.current.currentTime)
    setDuration(audioRef.current.duration || 0)
  }

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const p = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = p * duration
    setProgress(p * duration)
  }

  const handleNext = () => {
    setCinemaTriggered(false)
    if (shuffle) {
      let next = Math.floor(Math.random() * songs.length)
      if (next === currentIndex) next = (next + 1) % songs.length
      setCurrentIndex(next)
    } else {
      setCurrentIndex(i => (i === songs.length - 1 ? 0 : i + 1))
    }
  }

  const handlePrev = () => {
    setCinemaTriggered(false)
    setCurrentIndex(i => (i === 0 ? songs.length - 1 : i - 1))
  }

  const handleEnded = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    } else {
      handleNext()
    }
  }

  // Music notes — only generated when isPlaying changes
  useEffect(() => {
    if (isPlaying) {
      const notesArr = ['♪', '♫', '♩', '♬']
      setNoteStyles(Array.from({ length: 10 }).map(() => ({
        left: `${15 + Math.random() * 25}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${2.5 + Math.random() * 2}s`,
        fontSize: `${0.9 + Math.random() * 0.8}rem`,
        symbol: notesArr[Math.floor(Math.random() * notesArr.length)],
      })))
    } else {
      setNoteStyles([])
    }
  }, [isPlaying])

  const progressPct = duration ? (progress / duration) * 100 : 0

  return (
    <>
      <audio
        ref={audioRef}
        src={currentSong.file}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
      />

      {/* ── Cinematic Background ── */}
      {/* Frame 1: woman awake */}
      <div className="bg-frame1" />
      {/* Frame 2: woman listening — fades in 1s after play */}
      <div className={`bg-frame2 ${cinemaTriggered ? 'visible' : ''}`} />

      <div className="overlay" />
      <div className="grain" />

      {/* Cinematic letterbox */}
      <div className="letterbox-top" />
      <div className="letterbox-bottom" />

      {/* Warm radio light when playing */}
      <div className={`warm-light ${isPlaying ? 'on' : ''}`} />

      {/* Dust particles — always rendered, always floating */}
      <div className="dust-container">
        {DUST.map(d => (
          <div
            key={d.id}
            className="dust-particle"
            style={{
              left: d.left,
              bottom: d.bottom,
              width: d.size,
              height: d.size,
              '--dx': d.dx,
              animationDelay: d.delay,
              animationDuration: d.duration,
              opacity: d.opacity,
            }}
          />
        ))}
      </div>

      {/* Floating music notes */}
      {isPlaying && (
        <div className="notes-global">
          {noteStyles.map((s, i) => (
            <div key={i} className="music-note" style={{
              left: s.left, bottom: '28%',
              animationDelay: s.animationDelay,
              animationDuration: s.animationDuration,
              fontSize: s.fontSize,
            }}>{s.symbol}</div>
          ))}
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="top-bar">
        <div className="radio-brand">
          <div className="radio-dot" />
          <div>
            <div className="radio-name">RADIO 97.5</div>
            <div className="radio-sub">RETRO HITS</div>
          </div>
        </div>
        <div className="top-right">
          <span className="clock"><LiveClock /></span>
          <button className="menu-btn">☰</button>
        </div>
      </div>

      {/* ── Bottom Panel ── */}
      <div className="bottom-panel">

        {/* Playlist */}
        <div className="playlist-section">
          <div className="playlist-label">PLAYLIST</div>
          {songs.map((song, i) => (
            <div
              key={i}
              className={`playlist-item ${i === currentIndex ? 'active' : ''}`}
              onClick={() => { setCurrentIndex(i); setIsPlaying(true) }}
            >
              <div className="cassette-icon">📼</div>
              <div className="playlist-info">
                <div className="playlist-title">{song.title}</div>
                <div className="playlist-artist">{song.artist}</div>
              </div>
              {i === currentIndex && isPlaying && (
                <div className="playing-bars">
                  <span /><span /><span />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Cassette Player */}
        <div className="cassette-player">
          <div className="cassette-visual">
            <div className={`cassette-body ${isPlaying ? 'glowing' : ''}`}>
              <div className="cassette-window">
                <div className={`reel left ${isPlaying ? 'spinning' : ''}`} />
                <div className={`reel right ${isPlaying ? 'spinning' : ''}`} />
              </div>
            </div>
          </div>

          <div className="now-playing-section">
            <div className="now-playing-label">NOW PLAYING</div>
            <h2 className="np-title">{currentSong.title}</h2>
            <p className="np-artist">{currentSong.artist}</p>

            <div className="waveform" onClick={handleSeek}>
              {waveBars.map((bar, i) => (
                <div
                  key={i}
                  className={`wave-bar ${(i / waveBars.length) * 100 < progressPct ? 'played' : ''}`}
                  style={{ height: `${bar.h}px` }}
                />
              ))}
            </div>

            <div className="time-row">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div className="controls">
              <button className={`ctrl-btn icon-btn ${shuffle ? 'active-btn' : ''}`} onClick={() => setShuffle(s => !s)}>⇄</button>
              <button className="ctrl-btn" onClick={handlePrev}>⏮</button>
              <button className="ctrl-btn play-btn" onClick={() => setIsPlaying(p => !p)}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="ctrl-btn" onClick={handleNext}>⏭</button>
              <button className={`ctrl-btn icon-btn ${repeat ? 'active-btn' : ''}`} onClick={() => setRepeat(r => !r)}>↻</button>
            </div>
          </div>
        </div>

        {/* Volume */}
        <div className="right-panel">
          <div className="volume-section">
            <div className="volume-label">VOLUME</div>
            <input
              type="range" min="0" max="1" step="0.01"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="volume-slider"
            />
          </div>
          <button className="more-songs-btn">MORE SONGS ∧</button>
        </div>

      </div>
    </>
  )
}
