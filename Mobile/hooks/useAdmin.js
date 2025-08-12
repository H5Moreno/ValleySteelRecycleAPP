import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, AppState } from "react-native";
import { API_URL } from "../constants/api";

export const useAdmin = (userId) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [allInspections, setAllInspections] = useState([]);
  const [stats, setStats] = useState(null);
  const [defectiveItemsStats, setDefectiveItemsStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastInspectionCount, setLastInspectionCount] = useState(0);
  
  // Refs for managing intervals and app state
  const pollingInterval = useRef(null);
  const appState = useRef(AppState.currentState);

  const checkAdminStatus = useCallback(async () => {
    if (!userId) return false;
    try {
      const response = await fetch(`${API_URL}/admin/check/${userId}`);
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
      const response = await fetch(`${API_URL}/admin/inspections/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setAllInspections(data);
        
        // Check if new inspections were added
        if (data.length > lastInspectionCount && lastInspectionCount > 0) {
          console.log('🔄 New inspection(s) detected! Refreshing dashboard...');
        }
        setLastInspectionCount(data.length);
      } else {
        throw new Error(data.error || "Failed to fetch inspections");
      }
    } catch (error) {
      console.error("Error fetching all inspections:", error);
    }
  }, [userId, lastInspectionCount]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/admin/stats/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      } else {
        throw new Error(data.error || "Failed to fetch stats");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [userId]);

  const fetchDefectiveItemsStats = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${API_URL}/admin/defective-items-stats/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setDefectiveItemsStats(data);
      } else {
        throw new Error(data.error || "Failed to fetch defective items stats");
      }
    } catch (error) {
      console.error("Error fetching defective items stats:", error);
    }
  }, [userId]);

  // Polling function to refresh data
  const pollForUpdates = useCallback(async () => {
    if (!userId || !isAdmin) return;
    
    try {
      await fetchAllInspections();
    } catch (error) {
      console.error("Error during polling:", error);
    }
  }, [userId, isAdmin, fetchAllInspections]);

  // Full data refresh function
  const refreshAllData = useCallback(async () => {
    if (!userId || !isAdmin) return;
    
    try {
      await Promise.all([
        fetchAllInspections(),
        fetchStats(),
        fetchDefectiveItemsStats()
      ]);
    } catch (error) {
      console.error("Error refreshing all data:", error);
    }
  }, [userId, isAdmin, fetchAllInspections, fetchStats, fetchDefectiveItemsStats]);

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update inspection");
      }

      // Refresh all data after update
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete inspection");
      }

      // Refresh all data after deletion
      await refreshAllData();
      Alert.alert("Success", "Inspection deleted successfully");
    } catch (error) {
      console.error("Error deleting inspection:", error);
      Alert.alert("Error", error.message);
    }
  }, [userId, refreshAllData]);

  const loadAdminData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const adminStatus = await checkAdminStatus();
      if (adminStatus) {
        await refreshAllData();
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [checkAdminStatus, refreshAllData, userId]);

  // Start/stop polling based on admin status and app state
  const startPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    if (isAdmin && userId) {
      console.log('🚀 Starting admin dashboard polling...');
      pollingInterval.current = setInterval(() => {
        pollForUpdates();
      }, 30000); // Poll every 30 seconds
    }
  }, [isAdmin, userId, pollForUpdates]);

  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      console.log('⏹️ Stopping admin dashboard polling...');
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App came to foreground - refreshing admin data...');
        if (isAdmin && userId) {
          refreshAllData();
          startPolling();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('📱 App went to background - stopping polling...');
        stopPolling();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAdmin, userId, refreshAllData, startPolling, stopPolling]);

  // Initial load and start polling
  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Start/stop polling when admin status changes
  useEffect(() => {
    if (isAdmin && userId && !isLoading) {
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [isAdmin, userId, isLoading, startPolling, stopPolling]);

  return { 
    isAdmin, 
    allInspections, 
    stats, 
    defectiveItemsStats,
    isLoading, 
    loadAdminData: refreshAllData,
    updateInspection, 
    deleteInspection
  };
};

// Also export as default for flexibility
export default useAdmin;