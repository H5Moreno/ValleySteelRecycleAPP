import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const useAdmin = (userId) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [allInspections, setAllInspections] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } else {
        throw new Error(data.error || "Failed to fetch inspections");
      }
    } catch (error) {
      console.error("Error fetching all inspections:", error);
      Alert.alert("Error", error.message);
    }
  }, [userId]);

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

      // Refresh data
      await fetchAllInspections();
      Alert.alert("Success", "Inspection updated successfully");
    } catch (error) {
      console.error("Error updating inspection:", error);
      Alert.alert("Error", error.message);
    }
  }, [userId, fetchAllInspections]);

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

      // Refresh data
      await fetchAllInspections();
      Alert.alert("Success", "Inspection deleted successfully");
    } catch (error) {
      console.error("Error deleting inspection:", error);
      Alert.alert("Error", error.message);
    }
  }, [userId, fetchAllInspections]);

  const loadAdminData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const adminStatus = await checkAdminStatus();
      if (adminStatus) {
        await Promise.all([
          fetchAllInspections(),
          fetchStats()
        ]);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [checkAdminStatus, fetchAllInspections, fetchStats, userId]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  return { 
    isAdmin, 
    allInspections, 
    stats, 
    isLoading, 
    loadAdminData, 
    updateInspection, 
    deleteInspection
  };
};