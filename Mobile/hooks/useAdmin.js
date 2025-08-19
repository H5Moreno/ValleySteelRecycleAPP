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
  const adminDataCache = useRef(null);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const checkAdminStatus = useCallback(async () => {
    if (!userId) return { isAdmin: false, needsBootstrap: false };
    
    try {
      console.log('🔍 Checking admin status for:', userId);
      const response = await fetch(`${API_URL}/admin/check/${userId}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
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


  // OPTIMIZED: Fetch all admin data in parallel
  const fetchAllAdminData = useCallback(async () => {
    if (!userId) return;

    try {
      console.log('📈 Fetching all admin data in parallel...');
      
      // Start all requests simultaneously
      const [inspectionsPromise, statsPromise, defectivePromise] = [
        fetch(`${API_URL}/admin/inspections/${userId}`),
        fetch(`${API_URL}/admin/stats/${userId}`),
        fetch(`${API_URL}/admin/defective-items-stats/${userId}`)
      ];

      // Wait for all to complete
      const [inspectionsResponse, statsResponse, defectiveResponse] = await Promise.all([
        inspectionsPromise,
        statsPromise,
        defectivePromise
      ]);

      // Process results
      if (inspectionsResponse.ok) {
        const inspectionsData = await inspectionsResponse.json();
        setAllInspections(Array.isArray(inspectionsData) ? inspectionsData : []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (defectiveResponse.ok) {
        const defectiveData = await defectiveResponse.json();
        setDefectiveItemsStats(Array.isArray(defectiveData) ? defectiveData : []);
      }

      // Cache the data with timestamp
      adminDataCache.current = {
        timestamp: Date.now(),
        inspections: allInspections,
        stats,
        defectiveItemsStats
      };

    } catch (error) {
      console.error("❌ Error fetching admin data:", error);
    }
  }, [userId]);

  // OPTIMIZED: Main data loading function with caching
  const refreshAllData = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      console.log('⏸️ No user ID, skipping admin check');
      return;
    }
    
    if (isCurrentlyLoading.current && !forceRefresh) {
      console.log('⏸️ Already loading, skipping...');
      return;
    }

    // Check cache first (cache for 30 seconds)
    const now = Date.now();
    if (!forceRefresh && adminDataCache.current && (now - adminDataCache.current.timestamp < 30000)) {
      console.log('💾 Using cached admin data');
      return;
    }
    
    // Prevent excessive refreshes
    if (!forceRefresh && (now - lastFetchTime) < 5000) {
      console.log('Skipping refresh - too soon since last refresh');
      return;
    }
    
    isCurrentlyLoading.current = true;
    setLastFetchTime(now);
    
    try {
      console.log('🔄 Starting admin data refresh...');
      const adminStatus = await checkAdminStatus();
      if (adminStatus && adminStatus.isAdmin) {
        await fetchAllAdminData();
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
  }, [userId, checkAdminStatus, fetchAllAdminData, lastFetchTime]);

  const updateInspection = useCallback(async (inspectionId, updateData) => {
    if (!userId) return false;
    try {
      console.log('Updating inspection:', inspectionId, updateData);
      
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
        return false;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update inspection");
      }

      console.log('Inspection updated successfully');
      // Update local state immediately for better UX
      setAllInspections(prev => prev.map(inspection => 
        inspection.id === inspectionId 
          ? { ...inspection, ...updateData, adminUserId: userId }
          : inspection
      ));
      
      // Refresh data in background
      setTimeout(() => refreshAllData(true), 100);
      Alert.alert("Success", "Inspection updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating inspection:", error);
      Alert.alert("Error", error.message);
      return false;
    }
  }, [userId, refreshAllData]);

  const deleteInspection = useCallback(async (inspectionId) => {
    if (!userId) return false;
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
        return false;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete inspection");
      }

      // Update local state immediately
      setAllInspections(prev => prev.filter(inspection => inspection.id !== inspectionId));
      
      // Refresh stats in background
      setTimeout(() => refreshAllData(true), 100);
      Alert.alert("Success", "Inspection deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting inspection:", error);
      Alert.alert("Error", error.message);
      return false;
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
      // Check admin status first
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
  }, [userId, checkAdminStatus, fetchAllAdminData]);

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