import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

const BASE_URL = 'https://api.spotify.com/v1';

export interface Track {
  album: string;
  artists: string[];
  cover_image: string;
  external_urls: string;
  name: string;
  uri: string;
}

export interface SearchResponse {
  tracks: Track[];
}

export interface DownloadResponse {
  data: {
    message: string;
    track_info: {
      album: string;
      artist: string;
      title: string;
    };
    upload_url: string;
  };
  status: string;
}

export interface DownloadedSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverImage: string;
  filePath: string;
  downloadDate: string;
}

// Mock data for testing
const mockTracks: Track[] = [
  {
    name: "Shape of You",
    artists: ["Ed Sheeran"],
    album: "÷ (Divide)",
    cover_image: "https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg",
    external_urls: "spotify:track:7qiZfU4dY1lWllzX7mPBI3",
    uri: "spotify:track:7qiZfU4dY1lWllzX7mPBI3"
  },
  {
    name: "Blinding Lights",
    artists: ["The Weeknd"],
    album: "After Hours",
    cover_image: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg",
    external_urls: "spotify:track:0VjIjW4GlUZAMYd2vXMi3b",
    uri: "spotify:track:0VjIjW4GlUZAMYd2vXMi3b"
  },
  {
    name: "Stay",
    artists: ["The Kid LAROI", "Justin Bieber"],
    album: "F*CK LOVE 3: OVER YOU",
    cover_image: "https://images.pexels.com/photos/1699161/pexels-photo-1699161.jpeg",
    external_urls: "spotify:track:5PjdY0CKGZdEuoNab3yDmX",
    uri: "spotify:track:5PjdY0CKGZdEuoNab3yDmX"
  }
];

// Search for songs
export const searchSongs = async (songName: string): Promise<Track[]> => {
  try {
    // For now, return mock data filtered by the search term
    return mockTracks.filter(track => 
      track.name.toLowerCase().includes(songName.toLowerCase()) ||
      track.artists.some(artist => artist.toLowerCase().includes(songName.toLowerCase())) ||
      track.album.toLowerCase().includes(songName.toLowerCase())
    );
  } catch (error) {
    console.error('Error searching songs:', error);
    Alert.alert('Error', 'Failed to search songs. Please try again.');
    return [];
  }
};

// Download a song
export const downloadSong = async (track: Track): Promise<DownloadedSong | null> => {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedTitle = track.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedTitle}_${timestamp}.mp3`;
    const fileUri = `${FileSystem.documentDirectory}songs/${fileName}`;
    
    // Ensure directory exists
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}songs/`, {
      intermediates: true
    });

    // For demo purposes, we'll just create a downloaded song object without actual file
    const downloadedSong: DownloadedSong = {
      id: `${track.uri}-${timestamp}`,
      title: track.name,
      artist: track.artists.join(', '),
      album: track.album,
      coverImage: track.cover_image,
      filePath: fileUri,
      downloadDate: new Date().toISOString(),
    };

    return downloadedSong;
  } catch (error) {
    console.error('Error downloading song:', error);
    Alert.alert('Error', 'Failed to download song. Please try again.');
    return null;
  }
};