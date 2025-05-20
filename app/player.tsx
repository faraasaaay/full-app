import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

const { width } = Dimensions.get('window');

export default function PlayerScreen() {
  const {
    currentSong,
    isPlaying,
    duration,
    position,
    pauseSong,
    resumeSong,
    seekTo,
    playNextSong,
    playPreviousSong,
  } = useAudioPlayer();
  const router = useRouter();
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const spinValue = new Animated.Value(0);

  // Rotate animation for the album cover
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation;
    
    if (isPlaying) {
      spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 30000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    }

    return () => {
      if (spinAnimation) {
        spinAnimation.stop();
      }
    };
  }, [isPlaying, currentSong]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatTime = (milliseconds: number) => {
    if (!milliseconds) return '0:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await pauseSong();
      } else {
        await resumeSong();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    setSeekPosition(position);
  };

  const handleSeekChange = (value: number) => {
    setSeekPosition(value);
  };

  const handleSeekComplete = async () => {
    await seekTo(seekPosition);
    setIsSeeking(false);
  };

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={64} color={Colors.dark.secondary} />
          <Text style={styles.emptyText}>No song is currently playing</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.push('/library')}
          >
            <Text style={styles.browseButtonText}>Browse Library</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {/* Album Cover */}
        <Animated.View 
          style={[styles.coverContainer, { transform: [{ rotate: spin }] }]}
        >
          <Image 
            source={{ uri: currentSong.coverImage }} 
            style={styles.coverImage}
            contentFit="cover"
          />
        </Animated.View>

        {/* Song Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.songTitle} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{currentSong.artist}</Text>
          <Text style={styles.albumName} numberOfLines={1}>{currentSong.album}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(isSeeking ? seekPosition : position)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={isSeeking ? seekPosition : position}
            minimumTrackTintColor={Colors.dark.primary}
            maximumTrackTintColor={Colors.dark.secondary}
            thumbTintColor={Colors.dark.primary}
            onSlidingStart={handleSeekStart}
            onValueChange={handleSeekChange}
            onSlidingComplete={handleSeekComplete}
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={playPreviousSong}>
            <Ionicons name="play-skip-back" size={32} color={Colors.dark.text} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
            <Ionicons 
              name={isPlaying ? 'pause' : 'play'} 
              size={40} 
              color={Colors.dark.background} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={playNextSong}>
            <Ionicons name="play-skip-forward" size={32} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  coverContainer: {
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: width * 0.375,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    marginBottom: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.375,
  },
  infoContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(30,30,30,0.5)',
    padding: 16,
    borderRadius: 16,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  artistName: {
    fontSize: 18,
    color: Colors.dark.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  albumName: {
    fontSize: 14,
    color: Colors.dark.subText,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    fontSize: 12,
    color: Colors.dark.subText,
    width: 45,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'rgba(30,30,30,0.5)',
    padding: 16,
    borderRadius: 30,
    marginTop: 10,
  },
  controlButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  browseButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  browseButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});