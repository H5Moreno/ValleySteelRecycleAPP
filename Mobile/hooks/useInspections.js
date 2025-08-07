import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { API_URL } from "../constants/api";

export const useInspections = (userId) => {
  const [inspections, setInspections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInspections = useCallback(async () => {
    try {
      console.log('Fetching inspections for user:', userId);
      const response = await fetch(`${API_URL}/inspections/${userId}`);
      const data = await response.json();
      console.log('Fetched inspections:', data);
      
      // Extract the rows array from the database response
      const inspectionsArray = data.rows || data;
      console.log('Inspections array:', inspectionsArray);
      setInspections(inspectionsArray);
    } catch (error) {
      console.error("Error fetching inspections:", error);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;

    console.log('Loading inspection data for user:', userId);
    setIsLoading(true);
    try {
      await fetchInspections();
    } catch (error) {
      console.error("Error loading inspection data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchInspections, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteInspection = async (id) => {
    try {
      const response = await fetch(`${API_URL}/inspections/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete inspection");

      // Refresh data after deletion
      loadData();
      Alert.alert("Success", "Inspection deleted successfully");
    } catch (error) {
      console.error("Error deleting inspection:", error);
      Alert.alert("Error", error.message);
    }
  };

  return { inspections, isLoading, loadData, deleteInspection };
};