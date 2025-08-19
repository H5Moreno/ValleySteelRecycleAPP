import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const useAdmin = (userId) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [allInspections, setAllInspections] = useState([]);
  const [stats, setStats] = useState(null);
  const [defectiveItemsStats, setDefectiveItemsStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  const isCurrentlyLoading = useRef(false);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const checkAdminStatus = useCallback(async () => {
    if (!userId) return { isAdmin: false, needsBootstrap: false };
    
    try {
      console.log('🔍 Checking admin status for:', userId);
      const response = await fetch(`${API_URL}/admin/check/${userId}`);
      
      if (response.status === 429) {
        console.warn('Admin check rate limited');
        return { isAdmin: false, needsBootstrap: false };
      }
      
      if (!response.ok) {
        console.error('Admin check response not OK:', response.status);
        return { isAdmin: false, needsBootstrap: false };
      }
      
      const data = await response.json();
      console.log('🔍 Admin status response:', data);
      return { 
        isAdmin: data.isAdmin, 
        needsBootstrap: data.needsBootstrap || false 
      };
      
    } catch (error) {
      console.error("Error checking admin status:", error);
      return { isAdmin: false, needsBootstrap: false };
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
    if (!userId) {
      console.log('⏸️ No user ID, skipping admin check');
      setIsLoading(false);
      return;
    }
    
    if (isCurrentlyLoading.current) {
      console.log('⏸️ Already loading, skipping...');
      return;
    }

    console.log('🚀 Loading admin data for user:', userId);
    isCurrentlyLoading.current = true;
    setIsLoading(true);
    
    try {
      // Always check admin status first
      const adminStatus = await checkAdminStatus();
      console.log('📊 Admin status result:', adminStatus);
      
      setIsAdmin(adminStatus.isAdmin);
      setNeedsBootstrap(adminStatus.needsBootstrap);
      
      // Only fetch admin data if user is actually an admin
      if (adminStatus.isAdmin) {
        console.log('👑 User is admin, fetching admin data...');
        await fetchAllAdminData();
      } else if (adminStatus.needsBootstrap) {
        console.log('🔐 Bootstrap needed - no admins exist');
      } else {
        console.log('👤 User is not admin');
      }
      
    } catch (error) {
      console.error("❌ Error loading admin data:", error);
    } finally {
      setIsLoading(false);
      isCurrentlyLoading.current = false;
    }
  }, [userId, checkAdminStatus]);

  const fetchAllAdminData = useCallback(async () => {
    try {
      console.log('📈 Fetching all admin data...');
      
      // Fetch inspections
      const inspectionsResponse = await fetch(`${API_URL}/admin/inspections/${userId}`);
      if (inspectionsResponse.ok) {
        const inspectionsData = await inspectionsResponse.json();
        setAllInspections(Array.isArray(inspectionsData) ? inspectionsData : []);
      }
      
      await delay(200);
      
      // Fetch stats
      const statsResponse = await fetch(`${API_URL}/admin/stats/${userId}`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
      
      await delay(200);
      
      // Fetch defective items stats
      const defectiveResponse = await fetch(`${API_URL}/admin/defective-items-stats/${userId}`);
      if (defectiveResponse.ok) {
        const defectiveData = await defectiveResponse.json();
        setDefectiveItemsStats(Array.isArray(defectiveData) ? defectiveData : []);
      }
      
    } catch (error) {
      console.error("❌ Error fetching admin data:", error);
    }
  }, [userId]);

  // FIXED: Effect that runs whenever userId changes (like on login)
  useEffect(() => {
    console.log('🔄 useEffect triggered, userId:', userId);
    loadAdminData();
  }, [userId]); // Only depend on userId

  useEffect(() => {
    // This effect now correctly triggers whenever the userId changes (e.g., on login).
    loadAdminData();
  }, [userId]); // The dependency is just on userId.

  return { 
    isAdmin, 
    needsBootstrap,
    allInspections, 
    stats, 
    defectiveItemsStats,
    isLoading, 
    loadAdminData: refreshAllData,
    updateInspection, 
    deleteInspection
  };
};

export default useAdmin;