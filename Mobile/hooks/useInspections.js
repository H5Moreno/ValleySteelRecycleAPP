import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const useInspections = (userId, userEmail) => {
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchInspections = useCallback(async (forceRefresh = false) => {
    if (!userId) return;

    // Prevent excessive API calls - only fetch if it's been more than 5 seconds since last fetch
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchTime) < 5000) {
      console.log('Skipping fetch - too soon since last request');
      return;
    }

    try {
      console.log('Fetching inspections for user:', userId);
      setLastFetchTime(now);
      
      // Add userEmail as query parameter if available
      const url = new URL(`${API_URL}/inspections/${userId}`);
      if (userEmail) {
        url.searchParams.append('userEmail', userEmail);
      }
      
      const response = await fetch(url.toString());
      
      if (response.status === 429) {
        console.warn('Rate limited - will retry in a moment');
        Alert.alert(
          "Too Many Requests", 
          "Please wait a moment before refreshing again.",
          [{ text: "OK" }]
        );
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched inspections:', data);
      
      // Handle the case where the response might contain an error message
      if (data.message && data.message.includes("Too many requests")) {
        console.warn('Rate limited in response data');
        return;
      }
      
      // Extract the rows array from the database response
      const inspectionsArray = Array.isArray(data) ? data : (data.rows || []);
      console.log('Inspections array:', inspectionsArray);
      setInspections(inspectionsArray);
    } catch (error) {
      console.error("Error fetching inspections:", error);
      if (!error.message.includes('Too many requests')) {
        Alert.alert("Error", "Failed to load inspections. Please try again later.");
      }
    }
  }, [userId, userEmail, lastFetchTime]);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!userId) return;

    console.log('Loading inspection data for user:', userId);
    setIsLoading(true);
    try {
      await fetchInspections(forceRefresh);
    } catch (error) {
      console.error("Error loading inspection data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchInspections, userId]);

  // Only load data once on mount
  useEffect(() => {
    if (userId && inspections.length === 0) {
      loadData(true);
    }
  }, [userId]); // Remove loadData from dependencies to prevent loops

  const deleteInspection = async (id) => {
    try {
      const response = await fetch(`${API_URL}/inspections/${id}`, { 
        method: "DELETE" 
      });
      
      if (response.status === 429) {
        Alert.alert("Too Many Requests", "Please wait before trying again.");
        return;
      }
      
      if (!response.ok) throw new Error("Failed to delete inspection");

      // Refresh data after deletion
      await loadData(true);
      Alert.alert("Success", "Inspection deleted successfully");
    } catch (error) {
      console.error("Error deleting inspection:", error);
      Alert.alert("Error", error.message);
    }
  };

  return { 
    inspections, 
    isLoading, 
    loadData: (forceRefresh = false) => loadData(forceRefresh), 
    deleteInspection 
  };
};