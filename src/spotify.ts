import { AccessToken, AudioFeatures, Recommendations, SearchContent, Track } from 'spotify-types'

export const getCredentials = async (
  CLIENT_ID: string,
  CLIENT_SECRET: string
): Promise<AccessToken> => {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  const data = await res.json()
  return data
}

export const getSongData = async (songId: string): Promise<Track> => {
  const res = await fetch(`https://api.spotify.com/v1/tracks/${songId}`, {
    headers: {
      Authorization: `Bearer ${window.creds.access_token}`
    }
  })
  if (res.status !== 200) {
    throw new Error(`${res.status} Failed request... track - ${songId}\n${await res.text()}`)
  }
  const data = await res.json()
  return data
}

export const getAudioFeatures = async (
  songId: string
): Promise<AudioFeatures> => {
  const res = await fetch(
    'https://api.spotify.com/v1/audio-features/' + songId,
    {
      headers: {
        Authorization: `Bearer ${window.creds.access_token}`
      }
    }
  )
  if (res.status !== 200) {
    throw new Error(`${res.status} Failed request... features - ${songId}\n${await res.text()}`)
  }
  const data = await res.json()
  return data
}

export const getLyrics = async (songId: string): Promise<any> => {
  const res = await fetch(`https://corsproxy.io/?https://lyrix.vercel.app/getLyrics/${songId}`)
  if (res.status !== 200) {
    if (res.status === 500) return null
    else throw new Error(`Failed request... lyrics - ${songId}`)
  }
  const data = await res.json()
  return data
}

export const getRecommendations = async (
  songId: string,
  artists: string
): Promise<Recommendations> => {
  const res = await fetch(
    'https://api.spotify.com/v1/recommendations/?seed_tracks=' +
      songId +
      '&seed_artists=' +
      artists,
    {
      headers: {
        Authorization: `Bearer ${window.creds.access_token}`
      }
    }
  )
  if (res.status !== 200) {
    throw new Error(`${res.status} Failed request... recommendations - ${songId}\n${await res.text()}`)
  }
  const data = await res.json()
  return data
}

export const getSpotifyResults = async (q: string): Promise<SearchContent> => {
  const res = await fetch(
    `https://api.spotify.com/v1/search/?q=${encodeURIComponent(q)}&type=track`,
    {
      headers: {
        Authorization: `Bearer ${window.creds.access_token}`
      }
    }
  )
  if (res.status !== 200) {
    throw new Error(`${res.status} Failed request... search - ${q}\n${await res.text()}`)
  }
  const data = await res.json()
  return data
}
