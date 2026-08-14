
import { useState, useEffect, useRef, useMemo } from 'react'
import './index.css'
import songs from './songs'

function formatTime(secs) {
  if (isNaN(secs) || !secs) return '0:00'

  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
    .toString()
    .padStart(2, '0')

  return `${m}:${s}`
}

function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <span>
      {time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}
    </span>
  )
}

const DUST = Array.from({ length: 25 }).map((_, i) => ({
  id: i,
  left: `${5 + Math.random() * 50}%`,
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

  // Controls when the woman changes from sitting → listening
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

  // Waveform
  const waveBars = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      h: Math.max(
        6,
        20 +
        Math.sin(i * 0.55) * 10 +
        Math.sin(i * 0.2) * 8
      ),
    }))
  }, [currentIndex])

  // ------------------------------------------------
  // SONG CHANGE
  // ------------------------------------------------

  useEffect(() => {
    setProgress(0)
    setDuration(0)
    setCinemaTriggered(false)

    if (audioRef.current) {
      audioRef.current.load()

      if (isPlaying) {
        audioRef.current.play().catch(() => { })
      }
    }
  }, [currentIndex])

  // ------------------------------------------------
  // PLAY / PAUSE + CINEMATIC ANIMATION
  // ------------------------------------------------

  useEffect(() => {
    clearTimeout(cinemaTimer.current)

    if (!audioRef.current) return

    if (isPlaying) {
      // Start the real song immediately
      audioRef.current.play().catch(() => { })

      // Give the scene a little time before the woman
      // starts listening.
      cinemaTimer.current = setTimeout(() => {
        setCinemaTriggered(true)
      }, 1200)
    } else {
      // Stop music
      audioRef.current.pause()

      // Return woman to sitting pose
      setCinemaTriggered(false)
    }

    return () => {
      clearTimeout(cinemaTimer.current)
    }
  }, [isPlaying])

  // ------------------------------------------------
  // VOLUME
  // ------------------------------------------------

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // ------------------------------------------------
  // AUDIO PROGRESS
  // ------------------------------------------------

  const handleTimeUpdate = () => {
    if (!audioRef.current) return

    setProgress(audioRef.current.currentTime)
    setDuration(audioRef.current.duration || 0)
  }

  // ------------------------------------------------
  // SEEK
  // ------------------------------------------------

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()

    const percentage =
      (e.clientX - rect.left) / rect.width

    audioRef.current.currentTime =
      percentage * duration

    setProgress(percentage * duration)
  }

  // ------------------------------------------------
  // NEXT
  // ------------------------------------------------

  const handleNext = () => {
    setCinemaTriggered(false)

    if (shuffle) {
      let nextIndex = Math.floor(
        Math.random() * songs.length
      )

      if (nextIndex === currentIndex) {
        nextIndex =
          (nextIndex + 1) % songs.length
      }

      setCurrentIndex(nextIndex)
    } else {
      setCurrentIndex((index) =>
        index === songs.length - 1
          ? 0
          : index + 1
      )
    }
  }

  // ------------------------------------------------
  // PREVIOUS
  // ------------------------------------------------

  const handlePrev = () => {
    setCinemaTriggered(false)

    setCurrentIndex((index) =>
      index === 0
        ? songs.length - 1
        : index - 1
    )
  }

  // ------------------------------------------------
  // SONG ENDED
  // ------------------------------------------------

  const handleEnded = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0

      audioRef.current
        .play()
        .catch(() => { })

      return
    }

    handleNext()
  }

  // ------------------------------------------------
  // MUSIC NOTES
  // ------------------------------------------------

  useEffect(() => {
    if (!isPlaying) {
      setNoteStyles([])
      return
    }

    const notes = ['♪', '♫', '♩', '♬']

    const generatedNotes = Array.from({
      length: 10,
    }).map(() => ({
      left: `${15 + Math.random() * 25}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${2.5 + Math.random() * 2
        }s`,
      fontSize: `${0.9 + Math.random() * 0.8
        }rem`,
      symbol:
        notes[
        Math.floor(
          Math.random() * notes.length
        )
        ],
    }))

    setNoteStyles(generatedNotes)
  }, [isPlaying])

  const progressPercentage = duration
    ? (progress / duration) * 100
    : 0

  return (
    <>
      {/* AUDIO */}
      <audio
        ref={audioRef}
        src={currentSong.file}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() =>
          setDuration(
            audioRef.current?.duration || 0
          )
        }
      />

      {/* =================================================
          BACKGROUND
          ================================================= */}

      {/* Girl sitting normally */}
      <div className="bg-frame1" />

      {/* Girl listening with head down */}
      <div
        className={`bg-frame2 ${cinemaTriggered ? 'visible' : ''
          }`}
      />

      {/* =================================================
          CINEMATIC EFFECTS
          ================================================= */}

      <div className="overlay" />

      <div className="grain" />

      <div className="letterbox-top" />
      <div className="letterbox-bottom" />

      <div
        className={`warm-light ${isPlaying ? 'on' : ''
          }`}
      />

      {/* =================================================
          DUST
          ================================================= */}

      <div className="dust-container">
        {DUST.map((dust) => (
          <div
            key={dust.id}
            className="dust-particle"
            style={{
              left: dust.left,
              bottom: dust.bottom,
              width: dust.size,
              height: dust.size,
              '--dx': dust.dx,
              animationDelay: dust.delay,
              animationDuration: dust.duration,
              opacity: dust.opacity,
            }}
          />
        ))}
      </div>

      {/* =================================================
          MUSIC NOTES
          ================================================= */}

      {isPlaying && (
        <div className="notes-global">
          {noteStyles.map((note, index) => (
            <div
              key={index}
              className="music-note"
              style={{
                left: note.left,
                bottom: '28%',
                animationDelay:
                  note.animationDelay,
                animationDuration:
                  note.animationDuration,
                fontSize: note.fontSize,
              }}
            >
              {note.symbol}
            </div>
          ))}
        </div>
      )}

      {/* =================================================
          TOP BAR
          ================================================= */}

      <div className="top-bar">
        <div className="radio-brand">
          <div className="radio-dot" />

          <div>
            <div className="radio-name">
              RADIO 97.5
            </div>

            <div className="radio-sub">
              RETRO HITS
            </div>
          </div>
        </div>

        <div className="top-right">
          <span className="clock">
            <LiveClock />
          </span>

          <button className="menu-btn">
            ☰
          </button>
        </div>
      </div>

      {/* =================================================
          BOTTOM MUSIC PLAYER
          ================================================= */}

      <div className="bottom-panel">

        {/* PLAYLIST */}

        <div className="playlist-section">

          <div className="playlist-label">
            PLAYLIST
          </div>

          {songs.map((song, index) => (
            <div
              key={index}
              className={`playlist-item ${index === currentIndex
                ? 'active'
                : ''
                }`}
              onClick={() => {
                setCurrentIndex(index)
                setIsPlaying(true)
              }}
            >
              <div className="cassette-icon">
                📼
              </div>

              <div className="playlist-info">

                <div className="playlist-title">
                  {song.title}
                </div>

                <div className="playlist-artist">
                  {song.artist}
                </div>

              </div>

              {index === currentIndex &&
                isPlaying && (
                  <div className="playing-bars">
                    <span />
                    <span />
                    <span />
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* =================================================
            CASSETTE PLAYER
            ================================================= */}

        <div className="cassette-player">

          {/* CASSETTE */}

          <div className="cassette-visual">

            <div
              className={`cassette-body ${isPlaying
                ? 'glowing'
                : ''
                }`}
            >

              <div className="cassette-window">

                <div
                  className={`reel left ${isPlaying
                    ? 'spinning'
                    : ''
                    }`}
                />

                <div
                  className={`reel right ${isPlaying
                    ? 'spinning'
                    : ''
                    }`}
                />

              </div>

            </div>
          </div>

          {/* NOW PLAYING */}

          <div className="now-playing-section">

            <div className="now-playing-label">
              NOW PLAYING
            </div>

            <h2 className="np-title">
              {currentSong.title}
            </h2>

            <p className="np-artist">
              {currentSong.artist}
            </p>

            {/* WAVEFORM */}

            <div
              className="waveform"
              onClick={handleSeek}
            >
              {waveBars.map(
                (bar, index) => (
                  <div
                    key={index}
                    className={`wave-bar ${(index /
                      waveBars.length) *
                      100 <
                      progressPercentage
                      ? 'played'
                      : ''
                      }`}
                    style={{
                      height: `${bar.h}px`,
                    }}
                  />
                )
              )}
            </div>

            {/* TIME */}

            <div className="time-row">
              <span>
                {formatTime(progress)}
              </span>

              <span>
                {formatTime(duration)}
              </span>
            </div>

            {/* CONTROLS */}

            <div className="controls">

              <button
                className={`ctrl-btn icon-btn ${shuffle
                  ? 'active-btn'
                  : ''
                  }`}
                onClick={() =>
                  setShuffle(
                    (value) => !value
                  )
                }
              >
                ⇄
              </button>

              <button
                className="ctrl-btn"
                onClick={handlePrev}
              >
                ⏮
              </button>

              <button
                className="ctrl-btn play-btn"
                onClick={() =>
                  setIsPlaying(
                    (value) => !value
                  )
                }
              >
                {isPlaying
                  ? '⏸'
                  : '▶'}
              </button>

              <button
                className="ctrl-btn"
                onClick={handleNext}
              >
                ⏭
              </button>

              <button
                className={`ctrl-btn icon-btn ${repeat
                  ? 'active-btn'
                  : ''
                  }`}
                onClick={() =>
                  setRepeat(
                    (value) => !value
                  )
                }
              >
                ↻
              </button>

            </div>
          </div>
        </div>

        {/* =================================================
            RIGHT PANEL
            ================================================= */}

        <div className="right-panel">

          <div className="volume-section">

            <div className="volume-label">
              VOLUME
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) =>
                setVolume(
                  parseFloat(
                    e.target.value
                  )
                )
              }
              className="volume-slider"
            />

          </div>

          <button className="more-songs-btn">
            MORE SONGS ∧
          </button>

        </div>
      </div>
    </>
  )
}