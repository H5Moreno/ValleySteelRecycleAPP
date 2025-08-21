import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router'; // Add this import
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { API_URL } from '../constants/api';

const AdminBootstrap = ({ onSuccess }) => {
  const { user } = useUser();
  const router = useRouter(); // Add this
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBootstrap = async () => {
  if (!secretKey.trim()) {
    Alert.alert('Error', 'Please enter the bootstrap secret key');
    return;
  }

  if (!user?.id || !user?.emailAddresses?.[0]?.emailAddress) {
    Alert.alert('Error', 'User information not available');
    return;
  }

  setIsLoading(true);

  try {
    console.log('🔐 Attempting admin bootstrap...');
    console.log('🌐 API_URL:', API_URL);
    console.log('👤 User ID:', user.id);
    console.log('📧 Email:', user.emailAddresses[0].emailAddress);
    console.log('🔑 Secret being sent:', `"${secretKey.trim()}"`);
    
    const fullURL = `${API_URL}/admin/bootstrap-first-admin`;
    console.log('🎯 Full URL:', fullURL);
    
    const requestBody = {
      userId: user.id,
      userEmail: user.emailAddresses[0].emailAddress,
      secretKey: secretKey.trim()
    };
    console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
    
    console.log('🚀 Making fetch request...');
    
    const response = await fetch(fullURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📨 Response received!');
    console.log('📊 Response status:', response.status);
    console.log('✅ Response ok:', response.ok);
    console.log('🔧 Response headers:', Object.fromEntries(response.headers.entries()));

    let data;
    try {
      data = await response.json();
      console.log('📄 Response data:', JSON.stringify(data, null, 2));
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', jsonError);
      const textResponse = await response.text();
      console.log('📝 Raw response text:', textResponse);
      throw new Error(`Server returned non-JSON response: ${textResponse}`);
    }

    if (response.ok) {
      Alert.alert(
        'Success!', 
        'You have been set as the first admin!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              if (onSuccess) onSuccess();
            }
          }
        ]
      );
    } else {
      console.error('❌ Bootstrap failed with response:', data);
      Alert.alert(
        'Bootstrap Failed', 
        `${data.error || 'Unknown error'}\n\nStatus: ${response.status}\n\nURL: ${fullURL}`
      );
    }

  } catch (error) {
    console.error('🚨 BOOTSTRAP ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Check if it's a network error
    if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      Alert.alert(
        'Connection Error', 
        `Cannot connect to server.\n\nMake sure your backend is running on localhost:5001\n\nError: ${error.message}\n\nAPI URL: ${API_URL}`
      );
    } else {
      Alert.alert(
        'Error', 
        `${error.message}\n\nAPI URL: ${API_URL}`
      );
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <View style={styles.container}>
      {/* ADD HEADER WITH BACK BUTTON ONLY */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Setup</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Ionicons name="shield-outline" size={64} color={COLORS.primary} style={styles.icon} />
          
          <Text style={styles.title}>Admin Bootstrap</Text>
          <Text style={styles.subtitle}>
            No admins exist yet. Enter the bootstrap secret to become the first admin.
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Enter bootstrap secret key"
            value={secretKey}
            onChangeText={setSecretKey}
            secureTextEntry
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleBootstrap}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="key-outline" size={20} color={COLORS.white} />
                <Text style={styles.buttonText}>Bootstrap Admin</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.helpText}>
            Contact your system administrator for the bootstrap secret key.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // HEADER WITH BACK BUTTON
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '100%',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  input: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: COLORS.background,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
};

export default AdminBootstrap;