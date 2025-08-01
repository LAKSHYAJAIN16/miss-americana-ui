import { Image } from 'expo-image';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { spotifyAuth } from '@/lib/spotifyAuth';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSpotifyLogin = async () => {
    setIsLoading(true);
    try {
      const authResult = await spotifyAuth.authenticate();
      
      if (authResult) {
        // Navigate directly to dashboard after successful authentication
        console.log('Access token:', authResult.access_token);
        router.push('/dashboard');
      } else {
        Alert.alert(
          'Authentication Failed',
          'Failed to authenticate with Spotify. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert(
        'Error',
        'An error occurred during authentication. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main Content - Branding and Buttons */}
      <View style={styles.mainSection}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/crown.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {/* Headline */}
        <View style={styles.headlineContainer}>
          <ThemedText style={styles.headline}>Screw you, Spotify.</ThemedText>
          <ThemedText style={styles.subHeadline}>Ad-free listening. Free downloads. Join the revolution.</ThemedText>
        </View>

        {/* Continue with Spotify Button */}
        <TouchableOpacity 
          style={[styles.spotifyButton, isLoading && styles.spotifyButtonDisabled]}
          onPress={handleSpotifyLogin}
          disabled={isLoading}
        >
          <Ionicons name="musical-notes" size={20} color="#FF69B4" />
          <ThemedText style={styles.spotifyButtonText}>
            {isLoading ? 'Connecting...' : 'Continue with Spotify'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  mainSection: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 100,
    paddingBottom: 50,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 80,
    height: 80,
    tintColor: '#FF69B4',
  },
  headlineContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  headline: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  subHeadline:{
    fontSize: 23,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  spotifyButton: {
    backgroundColor: '#191414',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  spotifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  spotifyButtonDisabled: {
    opacity: 0.6,
  },
}); 