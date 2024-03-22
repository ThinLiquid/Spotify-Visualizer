import { Track } from 'spotify-types'
import { SearchResults, Video } from './types'

export const getYouTubeResults = async (d: Track): Promise<SearchResults> => {
  const res = await fetch(
    `https://piped-api.lunar.icu/search?q=${encodeURIComponent(`${d.name} - ${d.artists[0].name}`)}&filter=music_songs`
  )
  return await res.json()
}

export const getYouTubeVideo = async (url: string): Promise<Video> => {
  const videoId = url.split('?v=')[1]
  const res = await fetch(`https://piped-api.lunar.icu/streams/${videoId}`)
  return await res.json()
}
