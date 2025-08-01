import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spotifyAuth } from '@/lib/spotifyAuth';

export default function Dashboard() {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const userData = await spotifyAuth.getUserDetails();
      if (userData) {
        setUserDetails(userData);
      } else {
        setUserDetails({ error: 'Failed to fetch user details' });
      }
    } catch (error) {
      setUserDetails({ error: 'Error fetching user details' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <ThemedText style={styles.backButtonText}>Back</ThemedText>
        </TouchableOpacity>
        
        <ThemedText style={styles.title}>Dashboard</ThemedText>
        <ThemedText style={styles.subtitle}>Welcome to Miss Americana</ThemedText>
        
        <View style={styles.jsonContainer}>
          <ThemedText style={styles.jsonLabel}>User Details (JSON):</ThemedText>
          <View style={styles.jsonBox}>
            <ThemedText style={styles.jsonText}>
              {loading ? 'Loading...' : JSON.stringify(userDetails, null, 2)}
            </ThemedText>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            spotifyAuth.logout();
            router.replace('/');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF69B4" />
          <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 50,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  jsonContainer: {
    marginTop: 20,
  },
  jsonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  jsonBox: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 15,
    minHeight: 200,
  },
  jsonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#191414',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
}); 