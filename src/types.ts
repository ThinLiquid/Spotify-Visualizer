export interface BaseImage {
  url: string
  width: number
  height: number
}

export interface VideoThumbnail extends BaseImage {
  quality: string
}

export interface AuthorThumbnail extends BaseImage {}
export interface AuthorBanner extends BaseImage {}

export interface AdaptiveFormat {
  index: string
  bitrate: string
  init: string
  url: string
  itag: string
  type: string
  clen: string
  lmt: string
  projectionType: number
  container: string
  encoding: string
  qualityLabel?: string
  resolution: string
}

export interface FormatStream {
  url: string
  itag: string
  type: string
  quality: string
  container: string
  encoding: string
  qualityLabel: string
  resolution: string
  size: string
}

export interface Caption {
  label: string
  languageCode: string
  url: string
}

export interface BaseVideo {
  title: string
  videoId: string
  videoThumbnails: VideoThumbnail[]
  lengthSeconds: number
}

export interface RecommendedVideo extends BaseVideo {
  author: string
  viewCountText: string
}

export interface SearchVideo extends BaseVideo {
  type: 'video'
  author: string
  authorId: string
  authorUrl: string
  description: string
  descriptionHtml: string
  viewCount: number
  published: string
  publishedText: string
  liveNow: boolean
  paid: boolean
  premium: boolean
}

export interface BasePlaylistVideo extends BaseVideo {}

export interface PlaylistVideo extends BasePlaylistVideo {
  author: string
  authorId: string
  authorUrl: string

  index: number
}

export interface Video extends BaseVideo {
  author: string

  description: string
  descriptionHtml: string
  published: number
  publishedText: string

  keywords: string[]
  viewCount: number
  likeCount: number
  dislikeCount: number

  paid: boolean
  premium: boolean
  isFamilyFriendly: boolean
  allowedRegions: string[]
  genre: string
  genreUrl: string

  authorId: string
  authorUrl: string
  authorThumbnails: AuthorThumbnail[]

  subCountText: string
  allowRatings: boolean
  rating: number
  isListed: boolean
  liveNow: boolean
  isUpcoming: boolean
  premiereTimestamp: number

  hlsUrl?: string
  adaptiveFormats: AdaptiveFormat[]
  formatStreams: FormatStream[]
  captions: Caption[]
  recommendedVideos: RecommendedVideo[]
}

export interface BasePlaylist {
  title: string
  playlistId: string
  author: string
  authorId: string
  authorUrl: string

  videoCount: number
  videos: BasePlaylistVideo[]
}

export interface SearchPlaylist {
  type: 'playlist'
}

export interface Playlist extends BasePlaylist {
  authorThumbnails: AuthorThumbnail[]
  description: string
  descriptionHtml: string

  viewCount: number
  updated: number

  videos: PlaylistVideo[]
}

export interface BaseMix {
  title: string
  mixId: string
  videos: PlaylistVideo[]
}

export interface BaseSearchSuggestion {
  query: string
  suggestions: string[]
}

export interface BaseChannel {
  author: string
  authorId: string
  authorUrl: string

  authorThumbnails: AuthorThumbnail[]
  subCount: number
  videoCount: number
  description: string
  descriptionHtml: string
}

export interface SearchChannel extends BaseChannel {
  type: 'channel'
}

export interface Channel extends BaseChannel {
  authorVerified: boolean
  authorBanners: AuthorBanner[]

  totalViews: number
  joined: number

  autoGenerated: boolean
  isFamilyFriendly: boolean

  allowedRegions: string[]

  tabs: string[]

  lastestVideos: SearchVideo[]
  relatedChannels: SearchChannel[]
}

export type SearchResults = Array<SearchVideo | SearchChannel | SearchPlaylist>
