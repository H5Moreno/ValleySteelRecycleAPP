import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const useAdmin = (userId) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [allInspections, setAllInspections] = useState([]);
  const [stats, setStats] = useState(null);
  const [defectiveItemsStats, setDefectiveItemsStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  // Add ref to track if initial load has been done
  const hasInitiallyLoaded = useRef(false);
  const isCurrentlyLoading = useRef(false);

  // Add delay utility
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const checkAdminStatus = useCallback(async () => {
    if (!userId) return false;
    try {
      console.log('Checking admin status for:', userId);
      const response = await fetch(`${API_URL}/admin/check/${userId}`);
      
      if (response.status === 429) {
        console.warn('Admin check rate limited');
        return false;
      }
      
      if (!response.ok) {
        console.error('Admin check response not OK:', response.status);
        return false;
      }
      
      const data = await response.json();
      setIsAdmin(data.isAdmin);
      return data.isAdmin;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }, [userId]);

  const fetchAllInspections = useCallback(async () => {
    if (!userId) return;
    try {
      console.log('Fetching all inspections for:', userId);
      await delay(200); // Small delay between requests
      
      const response = await fetch(`${API_URL}/admin/inspections/${userId}`);
      
      if (response.status === 429) {
        console.warn('Inspections fetch rate limited');
        throw new Error('Rate limited - please wait');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Inspections response error:', response.status, errorText);
        throw new Error(`Failed to fetch inspections`);
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        console.log('Fetched inspections count:', data.length);
        setAllInspections(data);
      }
    } catch (error) {
      console.error("Error fetching all inspections:", error);
      if (!error.message.includes('Rate limited')) {
        throw error;
      }
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      await delay(400); // Stagger requests
      
      const response = await fetch(`${API_URL}/admin/stats/${userId}`);
      
      if (response.status === 429) {
        console.warn('Stats fetch rate limited');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stats response error:', response.status, errorText);
        throw new Error(`Failed to fetch stats`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      if (!error.message.includes('Rate limited')) {
        throw error;
      }
    }
  }, [userId]);

  const fetchDefectiveItemsStats = useCallback(async () => {
    if (!userId) return;
    try {
      await delay(600); // Further stagger requests
      
      const response = await fetch(`${API_URL}/admin/defective-items-stats/${userId}`);
      
      if (response.status === 429) {
        console.warn('Defective items stats rate limited');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Defective items stats response error:', response.status, errorText);
        throw new Error(`Failed to fetch defective items stats`);
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setDefectiveItemsStats(data);
      }
    } catch (error) {
      console.error("Error fetching defective items stats:", error);
      if (!error.message.includes('Rate limited')) {
        throw error;
      }
    }
  }, [userId]);

  const refreshAllData = useCallback(async () => {
    if (!userId || isCurrentlyLoading.current) {
      console.log('Skipping refresh - no userId or already loading');
      return;
    }
    
    // Prevent excessive refreshes
    const now = Date.now();
    if ((now - lastFetchTime) < 5000) { // 5 second minimum between full refreshes
      console.log('Skipping refresh - too soon since last refresh');
      return;
    }
    
    isCurrentlyLoading.current = true;
    setLastFetchTime(now);
    
    try {
      console.log('🔄 Starting admin data refresh...');
      const adminStatus = await checkAdminStatus();
      if (adminStatus) {
        // Sequential requests to avoid overwhelming the server
        await fetchAllInspections();
        await fetchStats();
        await fetchDefectiveItemsStats();
      }
      console.log('✅ Admin data refresh completed');
    } catch (error) {
      console.error("❌ Error refreshing all data:", error);
      if (error.message.includes('Rate limited')) {
        Alert.alert(
          "Rate Limited", 
          "Too many requests. Please wait a moment before refreshing.",
          [{ text: "OK" }]
        );
      }
    } finally {
      isCurrentlyLoading.current = false;
    }
  }, [userId, checkAdminStatus, fetchAllInspections, fetchStats, fetchDefectiveItemsStats, lastFetchTime]);

  const updateInspection = useCallback(async (inspectionId, updateData) => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/admin/inspections/${inspectionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...updateData,
          adminUserId: userId
        }),
      });

      if (response.status === 429) {
        Alert.alert("Rate Limited", "Please wait before trying again.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update inspection");
      }

      // Refresh data after update with delay
      await delay(1000);
      await refreshAllData();
      Alert.alert("Success", "Inspection updated successfully");
    } catch (error) {
      console.error("Error updating inspection:", error);
      Alert.alert("Error", error.message);
    }
  }, [userId, refreshAllData]);

  const deleteInspection = useCallback(async (inspectionId) => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/admin/inspections/${inspectionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminUserId: userId
        }),
      });

      if (response.status === 429) {
        Alert.alert("Rate Limited", "Please wait before trying again.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete inspection");
      }

      // Refresh data after deletion with delay
      await delay(1000);
      await refreshAllData();
      Alert.alert("Success", "Inspection deleted successfully");
    } catch (error) {
      console.error("Error deleting inspection:", error);
      Alert.alert("Error", error.message);
    }
  }, [userId, refreshAllData]);

  const loadAdminData = useCallback(async () => {
    if (!userId || hasInitiallyLoaded.current) {
      console.log('Skipping initial load - no userId or already loaded');
      return;
    }

    console.log('🚀 Starting initial admin data load...');
    hasInitiallyLoaded.current = true;
    setIsLoading(true);
    
    try {
      await refreshAllData();
    } catch (error) {
      console.error("Error loading admin data:", error);
      hasInitiallyLoaded.current = false; // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [refreshAllData, userId]);

  // FIXED: Only load once on mount with proper dependency control
  useEffect(() => {
    if (userId && !hasInitiallyLoaded.current) {
      loadAdminData();
    }
  }, [userId, loadAdminData]);

  return { 
    isAdmin, 
    allInspections, 
    stats, 
    defectiveItemsStats,
    isLoading, 
    loadAdminData: refreshAllData, // This is for manual refresh only
    updateInspection, 
    deleteInspection
  };
};

export default useAdmin;