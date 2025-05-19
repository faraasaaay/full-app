import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors'; // Assuming this path is correct
import { useAudioPlayer } from '../contexts/AudioPlayerContext'; // Assuming this path is correct
import { downloadSong, searchSongs, Track } from '../services/api'; // Assuming this path is correct
import { clearRecentSearches, getRecentSearches, saveRecentSearch, saveSong } from '../services/storage'; // Assuming this path is correct

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { playSong, setPlaylist } = useAudioPlayer();

  const fetchRecentSearches = async () => {
    const searches = await getRecentSearches();
    setRecentSearches(searches);
  };

  // Load recent searches when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchRecentSearches();
    }, [])
  );

  const handleSearch = async (query?: string) => {
    const currentQuery = query || searchQuery;
    if (!currentQuery.trim()) return;

    setIsLoading(true);
    setSearchResults([]); // Clear previous results immediately
    try {
      const results = await searchSongs(currentQuery);
      setSearchResults(results);
      if (results.length > 0) {
        await saveRecentSearch(currentQuery); // Save successful search term
        fetchRecentSearches(); // Refresh recent searches list
      }
      if (!query) { // Only clear input if it wasn't a tap from recent searches
        // setSearchQuery(''); // Optional: clear search input after search
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search songs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (track: Track) => {
    setDownloading(track.uri);
    try {
      const downloadedSong = await downloadSong(track);
      if (downloadedSong) {
        await saveSong(downloadedSong);
        Alert.alert('Success', `${track.name} has been downloaded`);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download song');
    } finally {
      setDownloading(null);
    }
  };

  const renderTrackItem = ({ item }: { item: Track }) => {
    const artistsText = item.artists.join(', ');
    const isDownloading = downloading === item.uri;

    return (
      <View style={styles.trackItem}>
        <View style={styles.coverContainer}>
          <Image source={{ uri: item.cover_image }} style={styles.coverImage} />
          <View style={styles.playIconOverlay}>
            {/* Consider adding an onPress handler here if you want to play the song */}
            <Ionicons name="musical-note" size={24} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.artistName} numberOfLines={1}>{artistsText}</Text>
          <Text style={styles.albumName} numberOfLines={1}>{item.album}</Text>
        </View>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownload(item)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <ActivityIndicator color={Colors.dark.primary} size="small" />
          ) : (
            <View style={styles.downloadButtonInner}>
              <Ionicons name="download" size={24} color={Colors.dark.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }; // Corrected: Removed extra closing brace here

  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.recentSearchChip}
      onPress={() => {
        setSearchQuery(item); // Update the input field
        handleSearch(item);   // Perform the search with the selected term
      }}
    >
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for songs..."
          placeholderTextColor={Colors.dark.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch} // Triggers search on keyboard submit
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>

      {/* Recent Searches Section */}
      {searchResults.length === 0 && recentSearches.length > 0 && !isLoading && (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentSearchesHeader}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={async () => { await clearRecentSearches(); fetchRecentSearches(); }}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearchItem}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentSearchesList}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderTrackItem}
          keyExtractor={(item) => item.uri}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes" size={64} color={Colors.dark.secondary} />
          <Text style={styles.emptyText}>
            {searchResults.length === 0 && searchQuery && !isLoading ? 'No results found' : 'Search for your favorite songs'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
} // End of SearchScreen component

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  recentSearchesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  clearButtonText: {
    fontSize: 14,
    color: Colors.dark.primary,
  },
  recentSearchesList: {
    paddingRight: 16, // Ensure last item has padding if list scrolls
  },
  recentSearchChip: {
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  recentSearchText: {
    color: Colors.dark.text,
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48, // Increased height for better touch target
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    color: Colors.dark.text,
    marginRight: 10,
    fontSize: 15,
  },
  searchButton: {
    width: 48, // Increased size for better touch target
    height: 48,
    backgroundColor: Colors.dark.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16, // Added padding at the bottom of the list
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12, // Adjusted padding
    marginHorizontal: 16,
    marginVertical: 6, // Adjusted margin
    backgroundColor: Colors.dark.card,
    borderRadius: 10, // Adjusted border radius
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  coverContainer: {
    position: 'relative',
    width: 60, // Adjusted size
    height: 60, // Adjusted size
    borderRadius: 8,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    // borderRadius: 8, // Not strictly necessary if overflow: 'hidden' is on parent
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7, // Default opacity, could be changed on hover/press
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    marginRight: 8, // Add some space before download button
  },
  trackName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: Colors.dark.subText,
    marginBottom: 2,
  },
  albumName: {
    fontSize: 12,
    color: Colors.dark.subText,
  },
  downloadButton: {
    padding: 8,
    marginLeft: 'auto', // Push to the far right
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  downloadButtonInner: { // Visual styling for the button icon area
    width: 40,
    height: 40,
    borderRadius: 20, // Makes it circular
    backgroundColor: 'rgba(29,185,84,0.1)', // Example: subtle background
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24, // Add some padding
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.dark.subText,
    textAlign: 'center',
  },
});
