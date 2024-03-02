import './style.css';
import eruda from 'eruda';
import ColorThief from 'colorthief';
import HTML from '@datkat21/html';
import {
  getAudioFeatures,
  getCredentials,
  getLyrics,
  getRecommendations,
  getSongData,
  getSpotifyResults,
} from './spotify';
import { getYouTubeResults, getYouTubeVideo } from './youtube';
import { AdaptiveFormat, SearchVideo } from './types';
import { audioUrlToDataUrl, decimalToRGB, getContrastColor } from './utils';
import {
  handleAnimations,
  handleLyrics,
  handleMetadata,
  handleProgressBar,
  handleVisualizer,
} from './handlers';

const colorThief = new ColorThief();

eruda.init();

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET;

(window as any).creds = await getCredentials(CLIENT_ID, CLIENT_SECRET);

const overlay = new HTML('div')
  .styleJs({
    position: 'fixed',
    width: '100%',
    height: '100%',
    top: '0',
    left: '0',
    background: 'white',
    opacity: '0',
  })
  .appendTo(document.body);

const progress = new HTML('div').styleJs({
  width: '100%',
  height: '100%',
  backgroundColor: 'rgb(0, 0, 0, 0.5)',
  transformOrigin: '0% 50%',
});

new HTML('div')
  .styleJs({
    height: '4px',
    width: '100%',
    overflow: 'hidden',
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '300',
  })
  .append(progress)
  .appendTo(document.body);

new HTML('canvas')
  .styleJs({
    position: 'fixed',
    width: '100%',
    height: '100%',
    top: '0',
    left: '0',
    zIndex: '10',
    opacity: '0.1',
  })
  .appendTo(document.body);
const canvas = document.querySelector('canvas')!;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d')!;

const container = new HTML('div')
  .styleJs({
    position: 'fixed',
    top: '50%',
    padding: '150px',
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    transform: 'translateY(-50%)',
    zIndex: '20',
  })
  .appendTo(document.body);

let songId: string | undefined | null;
const audio = new Audio();
let queue: string[] = [];
(window as any).prev = '';
let i = 0;

const load = async (songId: string) => {
  (window as any).prev = songId;
  container.html('');
  progress.styleJs({
    animation: 'loading 1s infinite linear',
    width: '100%',
  });

  const lyricsData = await getLyrics(songId);
  const songData = await getSongData(songId);
  const audioFeatures = await getAudioFeatures(songId);
  const recommended = await getRecommendations(
    songId,
    songData.artists.map((x) => x.id).join(',')
  );

  const searchData = await getYouTubeResults(songData);
  let videoData;

  progress.styleJs({
    animation: 'loading 1s infinite linear',
    width: '100%',
  });

  for (let v = 0; 'videoId' in searchData[v]; v++) {
    console.log(searchData[v]);
    videoData = await getYouTubeVideo((searchData[v] as SearchVideo).videoId);
    break;
  }

  let bgColor, textColor: any;

  if (lyricsData !== null) {
    bgColor = decimalToRGB(lyricsData.colors.background);
    textColor = decimalToRGB(lyricsData.colors.text);

    document.body.style.background = `rgb(${bgColor.red}, ${bgColor.green}, ${bgColor.blue})`;
  }

  new HTML('div')
    .styleJs({
      display: 'flex',
      gap: '10px',
      height: '35px',
      alignItems: 'center',
    })
    .appendMany(
      new HTML('img')
        .attr({
          crossOrigin: 'anonymous',
          src: songData.album.images[0].url,
        })
        .styleJs({
          aspectRatio: '1 / 1',
          height: '35px',
        })
        .on('load', (e) => {
          if (textColor == null) {
            const [r, g, b] = colorThief.getColor(e.target as HTMLImageElement);
            bgColor = `rgb(${r}, ${g}, ${b})`;
            document.body.style.background = `rgb(${r}, ${g}, ${b})`;
          }
        }),
      new HTML('div')
        .styleJs({
          fontFamily: 'Satoshi, monospace',
          color:
            textColor == null
              ? getContrastColor()
              : `rgb(${textColor?.red}, ${textColor?.green}, ${textColor?.blue})`,
        })
        .text(
          `${songData.name}\n${songData.artists
            .map((e: any) => e.name)
            .join(', ')}`
        )
    )
    .appendTo(container);

  const url = videoData?.adaptiveFormats.find(
    (x: AdaptiveFormat) => x.itag === '251'
  )?.url;

  audio.src = await audioUrlToDataUrl(
    `https://corsproxy.org/?${encodeURIComponent(
      `https://invidious.lunar.icu/videoplayback${
        url?.split('/videoplayback')[1]
      }`
    )}`
  );
  const metadata = new MediaMetadata({
    title: songData.name,
    artist: songData.artists.map((x) => x.name).join(', '),
    album: songData.album.name,
    artwork: [
      {
        src: songData.album.images[0].url,
        sizes: `${songData.album.images[0].width}x${songData.album.images[0].height}`,
        type: 'image/jpeg',
      },
    ],
  });

  const run = async () => {
    audio.play();

    handleProgressBar(progress, overlay, songId, audio);
    handleAnimations(container, overlay, songId, audioFeatures);

    if (lyricsData !== null) {
      await handleLyrics(container, audio, lyricsData, songId);
    } else {
      new HTML('h1').text("Can't find lyrics...").appendTo(container);
    }
  };

  audio.oncanplay = () => {
    run();
  };

  if (queue.length === i) {
    recommended.tracks.forEach((track: any) => {
      queue.push(track.id);
    });
  }
  queue.push(songId);

  audio.onended = async () => {
    load(queue[i + 1]);
    i++;
  };

  handleMetadata(metadata, i, load, queue, audio);

  new HTML('div').attr({ id: 'player' }).appendTo(container);
};

let done = false;
audio.ondurationchange = () => {
  if (done === true) return;
  handleVisualizer(ctx, canvas, audio);
  done = true;
};

const results = new HTML('div');

new HTML('div')
  .styleJs({
    position: 'fixed',
    top: '5px',
    left: '0',
    zIndex: '1000',
    padding: '5px',
  })
  .appendTo(document.body)
  .appendMany(
    new HTML('input')
      .attr({
        placeholder: 'Search for a song',
      })
      .on('keydown', async (e: any) => {
        e = e as KeyboardEvent;
        if (e.key === 'Enter') {
          const r = await getSpotifyResults(
            (e.target as HTMLInputElement).value
          );
          results.html('');
          r.tracks?.items.forEach((track) => {
            results.append(
              new HTML('div')
                .text(
                  `${track.name} - ${track.artists
                    .map((x) => x.name)
                    .join(', ')}`
                )
                .on('mouseup', () => {
                  songId = track.id;
                  if (songId == (window as any).prev) return;

                  queue = [];
                  i = 0;
                  load(songId);
                })
                .styleJs({
                  padding: '2.5px 0',
                })
            );
          });
        }
      }),
    results
  );
