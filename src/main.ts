import './style.css'
import eruda from 'eruda'
import ColorThief from 'colorthief'
import HTML from '@datkat21/html'
import {
  getCredentials,
  getLyrics,
  getRecommendations,
  getSongData,
  getSpotifyResults
} from './spotify'
import { getYouTubeResults, getYouTubeVideo } from './youtube'
import { SearchVideo } from './types'
import { audioUrlToDataUrl, decimalToRGB, getContrastColor } from './utils'
import {
  handleLyrics,
  handleMetadata,
  handleProgressBar,
  handleVisualizer
} from './handlers'
import localForage from 'localforage'
import { Track } from 'spotify-types'

localForage.setDriver([localForage.WEBSQL, localForage.INDEXEDDB]);
const colorThief = new ColorThief()

eruda.init()

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET

declare global {
  interface Window {
    creds: {
      access_token: string
      expires_in: number
    }
  }
}

window.creds = await getCredentials(CLIENT_ID, CLIENT_SECRET)

const overlay = new HTML('div')
  .styleJs({
    position: 'fixed',
    width: '100%',
    height: '100%',
    top: '0',
    left: '0',
    background: 'white',
    opacity: '0'
  })
  .appendTo(document.body)

const progress = new HTML('div').styleJs({
  width: '100%',
  height: '100%',
  backgroundColor: 'rgb(0, 0, 0, 0.5)',
  transformOrigin: '0% 50%'
})

new HTML('div')
  .styleJs({
    height: '4px',
    width: '100%',
    overflow: 'hidden',
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '300'
  })
  .append(progress)
  .appendTo(document.body)

const _canvas = new HTML('canvas')
  .styleJs({
    position: 'fixed',
    width: '100%',
    height: '100%',
    top: '0',
    left: '0',
    zIndex: '10',
    opacity: '0.1'
  })
  .appendTo(document.body)
const canvas = _canvas.elm as HTMLCanvasElement
canvas.width = window.innerWidth
canvas.height = window.innerHeight
const ctx = canvas.getContext('2d')

const container = new HTML('div')
  .styleJs({
    position: 'fixed',
    top: '50%',
    padding: '150px',
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    transform: 'translateY(-50%)',
    zIndex: '20'
  })
  .appendTo(document.body)

let songId: string | undefined | null
const audio = new Audio()
let queue: string[] = [];
(window as any).prev = ''
let i = 0

const load = async (songId: string, songData?: Track, lyricsData?: any): Promise<void> => {
  (window as any).prev = songId
  progress.styleJs({
    animation: 'loading 1s infinite linear',
    width: '100%'
  })

  if (lyricsData == null) {
    lyricsData = await getLyrics(songId)
  }
  if (songData == null) {
    songData = await getSongData(songId)
  }

  let searchData;
  let videoData;

  if ((await localForage.getItem(songId)) == null) {
    searchData = await getYouTubeResults(songData)

    for (const data of searchData) {
      if (!('videoId' in data)) continue
      videoData = await getYouTubeVideo((data as SearchVideo).videoId)
      console.log(videoData)
      if (videoData !== null) break
    }
  }

  progress.styleJs({
    animation: 'loading 1s infinite linear',
    width: '100%'
  })

  let bgColor: string | { red: number, green: number, blue: number }
  let textColor: { red: number, green: number, blue: number } | null = null

  if (lyricsData !== null) {
    bgColor = decimalToRGB(lyricsData.colors.background)
    textColor = decimalToRGB(lyricsData.colors.text)

    document.body.style.background = `rgb(${bgColor.red}, ${bgColor.green}, ${bgColor.blue})`
  }

  container.html('')

  new HTML('div')
    .styleJs({
      display: 'flex',
      gap: '10px',
      height: '35px',
      alignItems: 'center'
    })
    .appendMany(
      new HTML('img')
        .attr({
          crossOrigin: 'anonymous',
          src: songData.album.images[0].url
        })
        .styleJs({
          aspectRatio: '1 / 1',
          height: '35px'
        })
        .on('load', (e) => {
          if (textColor != null) {
            return;
          }
          const [r, g, b] = colorThief.getColor(e.target as HTMLImageElement)
          bgColor = `rgb(${r}, ${g}, ${b})`
          document.body.style.background = `rgb(${r}, ${g}, ${b})`
        }),
      new HTML('div')
        .styleJs({
          fontFamily: 'Satoshi, monospace',
          color:
            textColor == null
              ? getContrastColor()
              : `rgb(${textColor?.red}, ${textColor?.green}, ${textColor?.blue})`
        })
        .text(
          `${songData.name}\n${songData.artists
            .map((e: any) => e.name)
            .join(', ')}`
        )
    )
    .appendTo(container)

    let format
    let url

  if (videoData) {
    const itags = [
      '141',
      '251',
      '140',
      '171',
      '250',
      '249',
      '139'
    ]
  
    console.log(videoData?.adaptiveFormats)
  
    if (videoData?.adaptiveFormats == null) throw new Error('No formats found!')
    for (const itag of itags) {
      for (const fmt of videoData.adaptiveFormats) {
        if (fmt.itag === itag) {
          const res = await fetch(`https://corsproxy.org/?${encodeURIComponent(
            `https://invidious.lunar.icu/videoplayback${
              fmt.url?.split('/videoplayback')[1]
            }`
          )}`)
          if (res.status !== 200) {
            console.log('fail', res.url, res.status)
            continue
          } else {
            console.log('success', res.url, res.status)
          }
          format = fmt
          url = fmt.url
          break
        }
      }
      if (format) break
    }
  
    if (url == null) {
      throw new Error('URL is null!')
    }
  }

  if ((await localForage.getItem(songId)) !== null) {
    audio.src = (await localForage.getItem(songId))!
  } else {
    audio.src = await audioUrlToDataUrl(
      `https://corsproxy.org/?${encodeURIComponent(
        `https://invidious.lunar.icu/videoplayback${
          url?.split('/videoplayback')[1]
        }`
      )}`
    )
    await localForage.setItem(songId, audio.src)
    await localForage.setItem('_' + songId, JSON.stringify({ songData, lyricsData }))
  }

  

  const metadata = new MediaMetadata({
    title: songData.name,
    artist: songData.artists.map((x) => x.name).join(', '),
    album: songData.album.name,
    artwork: [
      {
        src: songData.album.images[0].url,
        sizes: `${songData.album.images[0].width as number}x${songData.album.images[0].height as number}`,
        type: 'image/jpeg'
      }
    ]
  })

  const run = async (): Promise<void> => {
    await audio.play()

    handleProgressBar(progress, overlay, songId, audio)

    if (lyricsData === null) {
      new HTML('h1').text("Can't find lyrics...").appendTo(container)
    } else {
      await handleLyrics(container, audio, lyricsData, songId)
    }
  }

  audio.oncanplay = () => {
    run().catch(e => console.error(e))
  }

  console.log('queue', queue.length, i)
  if (queue.length === i) {
    const recommended = await getRecommendations(
      songId,
      songData.artists.map((x) => x.id).join(',')
    )
    recommended.tracks.forEach((track: any) => {
      queue.push(track.id)
    })
  }

  if (i === 0) {
    queue.push(songId)
  }

  audio.onended = async () => {
    load(queue[i + 1]).catch(e => console.error(e))
    i++
  }

  handleMetadata(metadata, () => i++, () => i--, () => i, load, queue, audio)

  new HTML('div').attr({ id: 'player' }).appendTo(container)
}

let done = false
audio.ondurationchange = () => {
  if (done) return
  handleVisualizer(ctx as CanvasRenderingContext2D, canvas, audio)
  done = true
}

const results = new HTML('div');

(window as any).localForage = localForage;

const history = async () => {
  for (const key of (await localForage.keys())) {
    console.log(key)
    
    const track: Track = JSON.parse(await localForage.getItem('_' + key) as string).songData
    let lyricsData: any = JSON.parse(await localForage.getItem('_' + key) as string).lyricsData

    if (!lyricsData) {
      lyricsData = await getLyrics(key)
    }

    results.append(
      new HTML('div')
        .text(
        `${track.name} - ${track.artists
          .map(x => x.name)
          .join(', ')}`
        )
        .on('mouseup', () => {
          songId = key
          if (songId === (window as any).prev) return

          queue = []
          i = 0
          load(key, track, lyricsData).catch(e => console.error(e))
        })
        .styleJs({
          padding: '2.5px 0'
        })
    )
  }
}

localForage.ready(async () => {
  await history();
})

new HTML('div')
  .styleJs({
    position: 'fixed',
    top: '5px',
    left: '0',
    zIndex: '1000',
    padding: '5px'
  })
  .appendTo(document.body)
  .appendMany(
    new HTML('input')
      .attr({
        placeholder: 'Search for a song'
      })
      .on('keydown', (e: any) => {
        e = e as KeyboardEvent
        if (e.key === 'Enter') {
          if (e.target.value === '') {
            results.html('')
            history();
            return
          }
          getSpotifyResults(
            (e.target as HTMLInputElement).value
          ).then(r => {
            results.html('')
            r.tracks?.items.forEach((track) => {
              results.append(
                new HTML('div')
                  .text(
                  `${track.name} - ${track.artists
                    .map((x) => x.name)
                    .join(', ')}`
                  )
                  .on('mouseup', () => {
                    songId = track.id
                    if (songId === (window as any).prev) return

                    queue = []
                    i = 0
                    load(songId).catch(e => console.error(e))
                  })
                  .styleJs({
                    padding: '2.5px 0'
                  })
              )
            })
          }).catch(e => console.error(e))
        }
      }),
    results
  )