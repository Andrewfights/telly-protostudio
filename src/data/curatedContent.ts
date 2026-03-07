import type { CuratedContent } from '../types';

// Curated streaming content for Telly ProtoStudio
// Includes classic TV shows, ambient streams, and live channels

export const CURATED_CONTENT: CuratedContent[] = [
  // Classic TV Shows
  {
    id: 'hart-to-hart-intro',
    name: 'Hart to Hart - Opening Theme',
    description: 'Classic 80s detective show opening',
    type: 'youtube',
    videoId: 'cSUvKfeKTsE',
    category: 'classic-tv',
    thumbnail: 'https://img.youtube.com/vi/cSUvKfeKTsE/hqdefault.jpg',
  },
  {
    id: 'mission-impossible-theme',
    name: 'Mission: Impossible Theme (1966)',
    description: 'Original TV series theme by Lalo Schifrin',
    type: 'youtube',
    videoId: 'XAYhNHhxN0A',
    category: 'classic-tv',
    thumbnail: 'https://img.youtube.com/vi/XAYhNHhxN0A/hqdefault.jpg',
  },
  {
    id: 'twilight-zone',
    name: 'The Twilight Zone Marathon',
    description: 'Classic sci-fi anthology series',
    type: 'youtube',
    videoId: 'NzlG28B-R8Y',
    category: 'classic-tv',
    thumbnail: 'https://img.youtube.com/vi/NzlG28B-R8Y/hqdefault.jpg',
  },
  {
    id: 'columbo-full',
    name: 'Columbo - Full Episode',
    description: 'Classic detective series with Peter Falk',
    type: 'youtube',
    videoId: 'mh2SscVTgCE',
    category: 'classic-tv',
    thumbnail: 'https://img.youtube.com/vi/mh2SscVTgCE/hqdefault.jpg',
  },
  {
    id: 'alfred-hitchcock',
    name: 'Alfred Hitchcock Presents',
    description: 'Classic suspense anthology',
    type: 'youtube',
    videoId: 'FYnQhgBuHXw',
    category: 'classic-tv',
    thumbnail: 'https://img.youtube.com/vi/FYnQhgBuHXw/hqdefault.jpg',
  },

  // Ambient / Background Streams
  {
    id: 'lofi-girl',
    name: 'Lofi Girl - 24/7 Beats',
    description: 'Relaxing beats to study/chill to',
    type: 'youtube',
    videoId: 'jfKfPfyJRdk',
    category: 'ambient',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
  },
  {
    id: 'jazz-cafe',
    name: 'Jazz Cafe Radio',
    description: 'Smooth jazz 24/7 stream',
    type: 'youtube',
    videoId: 'Dx5qFachd3A',
    category: 'ambient',
    thumbnail: 'https://img.youtube.com/vi/Dx5qFachd3A/hqdefault.jpg',
  },
  {
    id: 'fireplace',
    name: 'Cozy Fireplace',
    description: '4K fireplace with crackling sounds',
    type: 'youtube',
    videoId: 'L_LUpnjgPso',
    category: 'ambient',
    thumbnail: 'https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg',
  },
  {
    id: 'rain-window',
    name: 'Rain on Window',
    description: 'Relaxing rain sounds for sleep',
    type: 'youtube',
    videoId: 'mPZkdNFkNps',
    category: 'ambient',
    thumbnail: 'https://img.youtube.com/vi/mPZkdNFkNps/hqdefault.jpg',
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    description: 'Peaceful beach scenery',
    type: 'youtube',
    videoId: 'WHPEKLQID4U',
    category: 'ambient',
    thumbnail: 'https://img.youtube.com/vi/WHPEKLQID4U/hqdefault.jpg',
  },

  // Live News / Information
  {
    id: 'nasa-live',
    name: 'NASA Live - Earth from Space',
    description: 'ISS live feed of Earth',
    type: 'youtube',
    videoId: 'P9C25Un7xaM',
    category: 'live',
    thumbnail: 'https://img.youtube.com/vi/P9C25Un7xaM/hqdefault.jpg',
  },

  // Pluto TV Channels - Movies
  {
    id: 'pluto-movies',
    name: 'Pluto TV Movies',
    description: 'Free movies 24/7',
    type: 'plutotv',
    channelSlug: 'pluto-tv-movies',
    category: 'pluto-movies',
  },
  {
    id: 'pluto-action',
    name: 'Pluto TV Action',
    description: 'Action movies non-stop',
    type: 'plutotv',
    channelSlug: 'pluto-tv-action',
    category: 'pluto-movies',
  },
  {
    id: 'pluto-comedy',
    name: 'Pluto TV Comedy',
    description: 'Comedy movies and shows',
    type: 'plutotv',
    channelSlug: 'pluto-tv-comedy',
    category: 'pluto-movies',
  },
  {
    id: 'pluto-drama',
    name: 'Pluto TV Drama',
    description: 'Drama series and films',
    type: 'plutotv',
    channelSlug: 'pluto-tv-drama',
    category: 'pluto-movies',
  },
  {
    id: 'pluto-horror',
    name: 'Pluto TV Horror',
    description: 'Scary movies 24/7',
    type: 'plutotv',
    channelSlug: 'pluto-tv-horror',
    category: 'pluto-movies',
  },
  {
    id: 'pluto-romance',
    name: 'Pluto TV Romance',
    description: 'Romantic movies and series',
    type: 'plutotv',
    channelSlug: 'pluto-tv-romance',
    category: 'pluto-movies',
  },
  {
    id: 'pluto-thriller',
    name: 'Pluto TV Thriller',
    description: 'Suspense and thriller films',
    type: 'plutotv',
    channelSlug: 'pluto-tv-thrillers',
    category: 'pluto-movies',
  },
  {
    id: 'pluto-scifi',
    name: 'Pluto TV Sci-Fi',
    description: 'Science fiction movies',
    type: 'plutotv',
    channelSlug: 'pluto-tv-sci-fi',
    category: 'pluto-movies',
  },

  // Pluto TV Channels - Entertainment
  {
    id: 'pluto-classic-tv',
    name: 'Pluto TV Classic TV',
    description: 'Classic television shows',
    type: 'plutotv',
    channelSlug: 'classic-tv',
    category: 'pluto-entertainment',
  },
  {
    id: 'pluto-reality',
    name: 'Pluto TV Reality',
    description: 'Reality TV shows',
    type: 'plutotv',
    channelSlug: 'pluto-tv-reality',
    category: 'pluto-entertainment',
  },
  {
    id: 'pluto-competition',
    name: 'Pluto TV Competition',
    description: 'Competition and game shows',
    type: 'plutotv',
    channelSlug: 'pluto-tv-competition',
    category: 'pluto-entertainment',
  },
  {
    id: 'pluto-game-shows',
    name: 'Game Show Central',
    description: 'Classic game shows',
    type: 'plutotv',
    channelSlug: 'game-show-central',
    category: 'pluto-entertainment',
  },
  {
    id: 'pluto-tv-land',
    name: 'TV Land Drama',
    description: 'Classic TV dramas',
    type: 'plutotv',
    channelSlug: 'tv-land-drama',
    category: 'pluto-entertainment',
  },
  {
    id: 'pluto-mtv',
    name: 'MTV Pluto TV',
    description: 'MTV music and shows',
    type: 'plutotv',
    channelSlug: 'mtv-pluto-tv',
    category: 'pluto-entertainment',
  },
  {
    id: 'pluto-bet',
    name: 'BET Pluto TV',
    description: 'BET entertainment',
    type: 'plutotv',
    channelSlug: 'bet-pluto-tv',
    category: 'pluto-entertainment',
  },
  {
    id: 'pluto-comedy-central',
    name: 'Comedy Central',
    description: 'Stand-up and comedy shows',
    type: 'plutotv',
    channelSlug: 'comedy-central',
    category: 'pluto-entertainment',
  },

  // Pluto TV Channels - News & Information
  {
    id: 'pluto-cbs-news',
    name: 'CBS News',
    description: '24/7 news coverage',
    type: 'plutotv',
    channelSlug: 'cbs-news',
    category: 'pluto-news',
  },
  {
    id: 'pluto-cheddar',
    name: 'Cheddar News',
    description: 'Business and tech news',
    type: 'plutotv',
    channelSlug: 'cheddar-news',
    category: 'pluto-news',
  },
  {
    id: 'pluto-bloomberg',
    name: 'Bloomberg TV',
    description: 'Financial news',
    type: 'plutotv',
    channelSlug: 'bloomberg-television',
    category: 'pluto-news',
  },
  {
    id: 'pluto-newsy',
    name: 'Newsy',
    description: 'Unbiased news coverage',
    type: 'plutotv',
    channelSlug: 'newsy',
    category: 'pluto-news',
  },

  // Pluto TV Channels - Sports
  {
    id: 'pluto-sports',
    name: 'Pluto TV Sports',
    description: 'Sports highlights and events',
    type: 'plutotv',
    channelSlug: 'pluto-tv-sports',
    category: 'pluto-sports',
  },
  {
    id: 'pluto-fight',
    name: 'Fight',
    description: 'Combat sports and MMA',
    type: 'plutotv',
    channelSlug: 'fight',
    category: 'pluto-sports',
  },
  {
    id: 'pluto-nfl',
    name: 'NFL Channel',
    description: 'NFL highlights and shows',
    type: 'plutotv',
    channelSlug: 'nfl-channel',
    category: 'pluto-sports',
  },
  {
    id: 'pluto-mls',
    name: 'MLS',
    description: 'Major League Soccer',
    type: 'plutotv',
    channelSlug: 'mls',
    category: 'pluto-sports',
  },
  {
    id: 'pluto-impact-wrestling',
    name: 'Impact Wrestling',
    description: 'Wrestling entertainment',
    type: 'plutotv',
    channelSlug: 'impact-wrestling',
    category: 'pluto-sports',
  },

  // Pluto TV Channels - Kids & Family
  {
    id: 'pluto-nick',
    name: 'Nick Pluto TV',
    description: 'Nickelodeon shows',
    type: 'plutotv',
    channelSlug: 'nick-pluto-tv',
    category: 'pluto-kids',
  },
  {
    id: 'pluto-nick-jr',
    name: 'Nick Jr',
    description: 'Shows for little ones',
    type: 'plutotv',
    channelSlug: 'nick-jr-pluto-tv',
    category: 'pluto-kids',
  },
  {
    id: 'pluto-ryan-world',
    name: "Ryan's World",
    description: "Ryan's World channel",
    type: 'plutotv',
    channelSlug: 'ryans-world',
    category: 'pluto-kids',
  },
  {
    id: 'pluto-spongebob',
    name: 'SpongeBob SquarePants',
    description: 'SpongeBob 24/7',
    type: 'plutotv',
    channelSlug: 'spongebob',
    category: 'pluto-kids',
  },
  {
    id: 'pluto-paw-patrol',
    name: 'PAW Patrol',
    description: 'PAW Patrol adventures',
    type: 'plutotv',
    channelSlug: 'paw-patrol',
    category: 'pluto-kids',
  },
  {
    id: 'pluto-dora',
    name: 'Dora TV',
    description: 'Dora the Explorer',
    type: 'plutotv',
    channelSlug: 'dora-tv',
    category: 'pluto-kids',
  },

  // Pluto TV Channels - Music
  {
    id: 'pluto-mtv-hits',
    name: 'MTV Hits',
    description: 'Music videos and hits',
    type: 'plutotv',
    channelSlug: 'mtv-hits',
    category: 'pluto-music',
  },
  {
    id: 'pluto-mtv-blocks',
    name: 'MTV Block Party',
    description: 'Hip-hop and R&B',
    type: 'plutotv',
    channelSlug: 'mtv-block-party',
    category: 'pluto-music',
  },
  {
    id: 'pluto-vh1-plus',
    name: 'VH1 Plus',
    description: 'Classic music videos',
    type: 'plutotv',
    channelSlug: 'vh1-plus',
    category: 'pluto-music',
  },
  {
    id: 'pluto-cmt',
    name: 'CMT Equal Play',
    description: 'Country music',
    type: 'plutotv',
    channelSlug: 'cmt-equal-play',
    category: 'pluto-music',
  },

  // Pluto TV Channels - Crime & Investigation
  {
    id: 'pluto-crime-network',
    name: 'Crime Network',
    description: 'True crime shows',
    type: 'plutotv',
    channelSlug: 'crime-network',
    category: 'pluto-crime',
  },
  {
    id: 'pluto-unsolved-mysteries',
    name: 'Unsolved Mysteries',
    description: 'Classic mystery show',
    type: 'plutotv',
    channelSlug: 'unsolved-mysteries',
    category: 'pluto-crime',
  },
  {
    id: 'pluto-forensic-files',
    name: 'Forensic Files',
    description: 'Crime investigation',
    type: 'plutotv',
    channelSlug: 'forensic-files',
    category: 'pluto-crime',
  },
  {
    id: 'pluto-cold-case-files',
    name: 'Cold Case Files',
    description: 'Cold case investigations',
    type: 'plutotv',
    channelSlug: 'cold-case-files',
    category: 'pluto-crime',
  },

  // Pluto TV Channels - Lifestyle
  {
    id: 'pluto-home-design',
    name: 'Home + Design',
    description: 'Home improvement shows',
    type: 'plutotv',
    channelSlug: 'home-design',
    category: 'pluto-lifestyle',
  },
  {
    id: 'pluto-food-tv',
    name: 'Food TV',
    description: 'Cooking shows',
    type: 'plutotv',
    channelSlug: 'food-tv',
    category: 'pluto-lifestyle',
  },
  {
    id: 'pluto-travel',
    name: 'Travel + Adventure',
    description: 'Travel documentaries',
    type: 'plutotv',
    channelSlug: 'travel-adventure',
    category: 'pluto-lifestyle',
  },
  {
    id: 'pluto-cars-tv',
    name: 'Cars TV',
    description: 'Automotive shows',
    type: 'plutotv',
    channelSlug: 'cars-tv',
    category: 'pluto-lifestyle',
  },
];

export const CONTENT_CATEGORIES = [
  { id: 'classic-tv', name: 'Classic TV', icon: '📺' },
  { id: 'ambient', name: 'Ambient', icon: '🌙' },
  { id: 'live', name: 'Live Streams', icon: '🔴' },
  { id: 'pluto-movies', name: 'Pluto Movies', icon: '🎬' },
  { id: 'pluto-entertainment', name: 'Pluto Entertainment', icon: '🎭' },
  { id: 'pluto-news', name: 'Pluto News', icon: '📰' },
  { id: 'pluto-sports', name: 'Pluto Sports', icon: '⚽' },
  { id: 'pluto-kids', name: 'Pluto Kids', icon: '🧸' },
  { id: 'pluto-music', name: 'Pluto Music', icon: '🎵' },
  { id: 'pluto-crime', name: 'Pluto Crime', icon: '🔍' },
  { id: 'pluto-lifestyle', name: 'Pluto Lifestyle', icon: '🏠' },
];

export function getCuratedByCategory(category: string): CuratedContent[] {
  return CURATED_CONTENT.filter(item => item.category === category);
}

export function searchCurated(query: string): CuratedContent[] {
  const lowerQuery = query.toLowerCase();
  return CURATED_CONTENT.filter(
    item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
  );
}
