import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { styles } from '../assets/styles/admin.styles';

const AdminSkeleton = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <View style={[styles.skeletonBox, { width: 40, height: 40, borderRadius: 20 }]} />
      </View>
      
      {/* Stats Container Skeleton */}
      <View style={styles.statsContainer}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={styles.skeletonStatCard}>
            <View style={[styles.skeletonBox, { width: 60, height: 60, borderRadius: 30, marginBottom: 12 }]} />
            <View style={[styles.skeletonBox, { width: 40, height: 24, marginBottom: 8 }]} />
            <View style={[styles.skeletonBox, { width: 80, height: 16 }]} />
          </View>
        ))}
      </View>
      
      {/* Tab Container Skeleton */}
      <View style={styles.tabBar}>
        {['Dashboard', 'Inspections', 'Users'].map((tab, i) => (
          <View key={i} style={[styles.skeletonBox, { flex: 1, height: 40, margin: 5, borderRadius: 20 }]} />
        ))}
      </View>

      {/* Content Area Skeleton */}
      <View style={{ flex: 1, padding: 20 }}>
        <View style={styles.card}>
          <View style={[styles.skeletonBox, { width: 150, height: 20, marginBottom: 16 }]} />
          
          {/* Chart area skeleton */}
          <View style={[styles.skeletonBox, { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 }]} />
          
          {/* List items skeleton */}
          {[1, 2, 3].map(i => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={[styles.skeletonBox, { width: 40, height: 40, borderRadius: 20, marginRight: 12 }]} />
              <View style={{ flex: 1 }}>
                <View style={[styles.skeletonBox, { width: '70%', height: 16, marginBottom: 6 }]} />
                <View style={[styles.skeletonBox, { width: '50%', height: 14 }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default AdminSkeleton;
