import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DownloadedSong } from '../services/api';

interface AudioPlayerContextType {
  currentSong: DownloadedSong | null;
  isPlaying: boolean;
  duration: number;
  position: number;
  playbackInstance: Audio.Sound | null;
  playSong: (song: DownloadedSong) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  playNextSong: () => Promise<void>;
  playPreviousSong: () => Promise<void>;
  playlist: DownloadedSong[];
  setPlaylist: (songs: DownloadedSong[]) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSong, setCurrentSong] = useState<DownloadedSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackInstance, setPlaybackInstance] = useState<Audio.Sound | null>(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [playlist, setPlaylist] = useState<DownloadedSong[]>([]);

  // Initialize audio
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initAudio();

    // Cleanup
    return () => {
      if (playbackInstance) {
        playbackInstance.unloadAsync();
      }
    };
  }, []);

  // Update position every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(async () => {
        if (playbackInstance) {
          const status = await playbackInstance.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis);
          }
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPlaying, playbackInstance]);

  const updatePlaybackStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    setIsPlaying(status.isPlaying);
    setDuration(status.durationMillis || 0);
    setPosition(status.positionMillis);

    // Auto-play next song when current one ends
    if (status.didJustFinish) {
      playNextSong();
    }
  };

  // Listen for playback status changes to ensure auto-play works
  useEffect(() => {
    if (playbackInstance) {
      const subscription = playbackInstance.setOnPlaybackStatusUpdate(updatePlaybackStatus);
      return () => {
        if (subscription) {
          playbackInstance.setOnPlaybackStatusUpdate(null);
        }
      };
    }
  }, [playbackInstance]);

  const playSong = async (song: DownloadedSong) => {
    try {
      // Unload previous song if exists
      if (playbackInstance) {
        await playbackInstance.unloadAsync();
      }

      // Load and play new song
      const { sound } = await Audio.Sound.createAsync(
        { uri: song.filePath },
        { shouldPlay: true },
        updatePlaybackStatus
      );

      setPlaybackInstance(sound);
      setCurrentSong(song);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing song:', error);
    }
  };

  const pauseSong = async () => {
    if (playbackInstance) {
      await playbackInstance.pauseAsync();
    }
  };

  const resumeSong = async () => {
    if (playbackInstance) {
      await playbackInstance.playAsync();
    }
  };

  const seekTo = async (position: number) => {
    if (playbackInstance) {
      await playbackInstance.setPositionAsync(position);
    }
  };

  const getCurrentSongIndex = () => {
    if (!currentSong || playlist.length === 0) return -1;
    return playlist.findIndex(song => song.id === currentSong.id);
  };

  const playNextSong = async () => {
    if (playlist.length === 0) return;
    
    const currentIndex = getCurrentSongIndex();
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    await playSong(playlist[nextIndex]);
  };

  const playPreviousSong = async () => {
    if (playlist.length === 0) return;
    
    const currentIndex = getCurrentSongIndex();
    if (currentIndex === -1) return;
    
    const previousIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    await playSong(playlist[previousIndex]);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        duration,
        position,
        playbackInstance,
        playSong,
        pauseSong,
        resumeSong,
        seekTo,
        playNextSong,
        playPreviousSong,
        playlist,
        setPlaylist,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};