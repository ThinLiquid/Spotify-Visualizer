import { decimalToRGB, getContrastColor, until } from './utils'
import HTML from '@datkat21/html'

export const handleLyrics = async (
  container: HTML,
  audio: HTMLAudioElement,
  lyricsData: any,
  songId: string
): Promise<void> => {
  const {
    red: r,
    blue: b,
    green: g
  } = decimalToRGB(lyricsData.colors.highlightText)
  const { red: r1, blue: b1, green: g1 } = decimalToRGB(lyricsData.colors.text)

  let last3: HTML | null = new HTML('h2').text('').styleJs({
    color: `rgb(${r1}, ${g1}, ${b1})`,
    fontSize: '17px'
  })
  let last = new HTML('h1')
    .text('...')
    .styleJs({
      color: `rgb(${r}, ${g}, ${b})`
    })
    .appendTo(container)
  let last2 = new HTML('h2')
    .text(lyricsData.lyrics.lines[0].words)
    .styleJs({
      color: `rgb(${r1}, ${g1}, ${b1})`
    })
    .appendTo(container)

  let index = 0

  for (const lyric of lyricsData.lyrics.lines) {
    await until(() => audio.currentTime * 1000 >= parseInt(lyric.startTimeMs))

    last.cleanup()
    last2.cleanup()
    last3.cleanup()

    if ((window as any).prev !== songId) {
      break
    }

    const { red, blue, green } = decimalToRGB(lyricsData.colors.highlightText)
    const { red: r, blue: b, green: g } = decimalToRGB(lyricsData.colors.text)

    last = new HTML('h1').text(lyric.words).styleJs({
      color: `rgb(${red}, ${green}, ${blue})`
    })
    last2 = new HTML('h2')
      .text(
        index === lyricsData.lyrics.lines.length - 1
          ? ''
          : lyricsData.lyrics.lines[index + 1].words
      )
      .styleJs({
        color: `rgb(${r}, ${g}, ${b})`
      })
    last3 = new HTML('h2')
      .text(index === 0 ? '...' : lyricsData.lyrics.lines[index - 1].words)
      .styleJs({
        color: `rgb(${r}, ${g}, ${b})`,
        fontSize: '17px'
      })

    last3.appendTo(container)
    last.appendTo(container)
    last2.appendTo(container)
    index++
  }
}

export const handleVisualizer = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  audio: HTMLAudioElement,
  container: HTML
): void => {
  const audioCtx = new AudioContext()
  const audioSource = audioCtx.createMediaElementSource(audio)
  const analyser = audioCtx.createAnalyser()
  audioSource.connect(analyser)
  analyser.connect(audioCtx.destination)
  analyser.fftSize = 128

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  const barWidth = canvas.width / bufferLength

  let x = 0
  let barHeight
  function animate (): void {
    const averageFrequency = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength
    const scaleFactor = 1 + averageFrequency / 500
    container.styleJs({
      transform: `scale(${scaleFactor}) translateY(-${50 / scaleFactor}%)`,
      filter: `blur(${averageFrequency / 400}px)`,
      textShadow: `0 0 ${averageFrequency / 2}px white`
    })

    x = 0
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    analyser.getByteFrequencyData(dataArray)
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] * 0.75
      ctx.fillStyle = getContrastColor()
      ctx.fillRect(x * 2, canvas.height - barHeight, barWidth * 2, barHeight)
      x += barWidth
    }

    requestAnimationFrame(animate)
  }

  animate()
}

export const handleProgressBar = (
  progress: HTML,
  overlay: HTML,
  songId: string,
  audio: HTMLAudioElement
): void => {
  const _i = setInterval(() => {
    progress.styleJs({
      animation: 'none',
      background: getContrastColor() + '99',
      width: ((audio.currentTime / audio.duration) * 100).toString() + '%'
    })
    overlay.styleJs({
      background: getContrastColor()
    })
    if ((window as any).prev !== songId) clearInterval(_i)
  })
}

export const handleMetadata = (
  metadata: MediaMetadata,
  addIndex: () => void,
  subIndex: () => void,
  getIndex: () => number,
  load: Function,
  queue: Object[],
  audio: HTMLAudioElement
): void => {
  navigator.mediaSession.metadata = metadata
  navigator.mediaSession.setActionHandler('play', () => {
    audio.play().catch(e => console.error(e))
  })
  navigator.mediaSession.setActionHandler('pause', () => {
    audio.pause()
  })
  navigator.mediaSession.setActionHandler('previoustrack', () => {
    load(queue[getIndex() - 1])
    subIndex()
  })
  navigator.mediaSession.setActionHandler('nexttrack', () => {
    load(queue[getIndex() + 1])
    addIndex()
  })
}
