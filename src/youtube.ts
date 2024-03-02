import { SearchResults, Video } from './types';

export const getYouTubeResults = async (d: any): Promise<SearchResults> => {
  const res = await fetch(
    `https://corsproxy.io/?https://invidious.lunar.icu/api/v1/search?q=${encodeURIComponent(
      d.name
    )} ${encodeURIComponent(d.artists[0].name)} - Topic`
  );
  const data = await res.json();
  return data;
};

export const getYouTubeVideo = async (videoId: string): Promise<Video> => {
  const res = await fetch(`https://corsproxy.io/?https://invidious.lunar.icu/api/v1/videos/${videoId}`);
  const videoData = await res.json();
  return videoData;
};
