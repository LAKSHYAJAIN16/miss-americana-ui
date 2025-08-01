import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import * as WebBrowser from 'expo-web-browser';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Extract the authorization code from URL parameters
        const code = params.code as string;
        
        if (code) {
          console.log('Authorization code received:', code);
          
          // Close the WebBrowser window immediately
          WebBrowser.dismissBrowser();
          
          // Wait a bit for the browser to close, then navigate
          setTimeout(() => {
            router.replace('/');
          }, 100);
        } else {
          console.error('No authorization code received');
          WebBrowser.dismissBrowser();
          setTimeout(() => {
            router.replace('/');
          }, 100);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        WebBrowser.dismissBrowser();
        setTimeout(() => {
          router.replace('/');
        }, 100);
      }
    };

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      handleAuthCallback();
    }, 100);

    return () => clearTimeout(timer);
  }, [params, router]);

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Authenticating...</ThemedText>
      <ThemedText style={styles.subtitle}>Please wait while we complete your login.</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
}); 