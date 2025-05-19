import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MiniPlayer from '../components/MiniPlayer';
import Colors from '../constants/Colors';
import { AudioPlayerProvider, useAudioPlayer } from '../contexts/AudioPlayerContext';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const MINI_PLAYER_HEIGHT = 67; // Define MiniPlayer height (65 for player + 2 for progress bar)
const TAB_BAR_HEIGHT = 60; // Defined in tabBarStyle

function TabsLayout() {
  const { currentSong } = useAudioPlayer();
  
  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}> 
      <Tabs
        sceneContainerStyle={{
          // Add padding to the bottom of screen content if MiniPlayer is visible
          paddingBottom: currentSong ? MINI_PLAYER_HEIGHT : 0,
        }}
          screenOptions={{
            tabBarStyle: {
              backgroundColor: Colors.dark.background,
              borderTopColor: Colors.dark.border,
              borderTopWidth: 1,
              height: 60, // Standard height for the tab bar
              paddingBottom: 6,
              paddingTop: 6,
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
            },
          tabBarActiveTintColor: Colors.dark.primary,
          tabBarInactiveTintColor: Colors.dark.subText,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: Colors.dark.background,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            height: 60,
          },
          headerTintColor: Colors.dark.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Search',
            headerShown: false, // Hide default header for Search screen
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="library" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="player"
          options={{
            title: 'Now Playing',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="musical-notes" size={size} color={color} />
            ),
            href: null, // Only accessible through the mini player
          }}
        />
        </Tabs>
      {/* MiniPlayer is rendered here, on top of Tabs, positioned above the TabBar */}
      {currentSong && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: TAB_BAR_HEIGHT, // Position MiniPlayer's container above the tab bar
            height: MINI_PLAYER_HEIGHT,
          }}
        >
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen when app is ready
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AudioPlayerProvider>
        <StatusBar style="light" />
        <TabsLayout />
      </AudioPlayerProvider>
    </SafeAreaProvider>
  );
}
