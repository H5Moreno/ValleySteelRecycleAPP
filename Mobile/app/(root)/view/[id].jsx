import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { styles } from "../../../assets/styles/view.styles";
import { COLORS } from "../../../constants/colors";
import { DEFECTIVE_ITEMS, TRUCK_TRAILER_ITEMS } from "../../../constants/inspectionItems";
import { API_URL } from "../../../constants/api";
import PageLoader from "../../../components/PageLoader";
import { formatDate } from "../../../lib/utils";

export default function ViewInspection() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const [inspection, setInspection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        setIsLoading(true);
        
        // Include userId and userEmail in query params for auto-user creation
        const url = new URL(`${API_URL}/inspections/single/${id}`);
        if (user?.id) {
          url.searchParams.append('userId', user.id);
        }
        if (user?.emailAddresses?.[0]?.emailAddress) {
          url.searchParams.append('userEmail', user.emailAddresses[0].emailAddress);
        }
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error("Inspection not found");
        }
        
        const data = await response.json();
        setInspection(data);
      } catch (error) {
        console.error("Error fetching inspection:", error);
        setError(error.message);
        Alert.alert("Error", "Failed to load inspection details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchInspection();
    }
  }, [id, user?.id]);

  // Helper function to get item name with asterisk if needed
  const getItemDisplayName = (itemId, itemsArray) => {
    const item = itemsArray.find(item => item.id === itemId);
    if (!item) return itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const baseName = item.name;
    return item.asterisk ? `*${baseName}` : baseName;
  };

  const renderDefectiveItems = () => {
    if (!inspection?.defective_items) return null;

    let defectiveItems;
    try {
      defectiveItems = typeof inspection.defective_items === 'string' 
        ? JSON.parse(inspection.defective_items) 
        : inspection.defective_items;
    } catch (error) {
      console.error("Error parsing defective items:", error);
      return null;
    }

    const selectedItems = Object.entries(defectiveItems)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);

    if (selectedItems.length === 0) {
      return (
        <Text style={styles.noItemsText}>No defective items reported</Text>
      );
    }

    return selectedItems.map((itemId, index) => {
      const displayName = getItemDisplayName(itemId, DEFECTIVE_ITEMS);
      const hasAsterisk = displayName.startsWith('*');
      
      return (
        <View key={index} style={styles.itemRow}>
          <Ionicons name="close-circle" size={16} color={COLORS.expense} />
          <Text style={[
            styles.itemText,
            hasAsterisk && styles.itemTextAsterisk
          ]}>
            {displayName}
          </Text>
        </View>
      );
    });
  };

  const renderTruckTrailerItems = () => {
    if (!inspection?.truck_trailer_items) return null;

    let truckTrailerItems;
    try {
      truckTrailerItems = typeof inspection.truck_trailer_items === 'string' 
        ? JSON.parse(inspection.truck_trailer_items) 
        : inspection.truck_trailer_items;
    } catch (error) {
      console.error("Error parsing truck trailer items:", error);
      return null;
    }

    const selectedItems = Object.entries(truckTrailerItems)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);

    if (selectedItems.length === 0) {
      return (
        <Text style={styles.noItemsText}>No truck/trailer defects reported</Text>
      );
    }

    return selectedItems.map((itemId, index) => {
      const displayName = getItemDisplayName(itemId, TRUCK_TRAILER_ITEMS);
      
      return (
        <View key={index} style={styles.itemRow}>
          <Ionicons name="close-circle" size={16} color={COLORS.expense} />
          <Text style={styles.itemText}>
            {displayName}
          </Text>
        </View>
      );
    });
  };

  if (isLoading) return <PageLoader />;

  if (error || !inspection) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Inspection not found"}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspection Details</Text>
      </View>

      <View style={styles.content}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Vehicle:</Text>
            <Text style={styles.value}>{inspection.vehicle}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{inspection.location || "Not specified"}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{formatDate(inspection.created_at)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{inspection.time || "Not specified"}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Speedometer Reading:</Text>
            <Text style={styles.value}>{inspection.speedometer_reading || "Not recorded"}</Text>
          </View>

          {inspection.trailer_number && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Trailer Number:</Text>
              <Text style={styles.value}>{inspection.trailer_number}</Text>
            </View>
          )}
        </View>

        {/* Condition Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition Status</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: inspection.condition_satisfactory ? COLORS.income : COLORS.expense }
            ]}>
              <Ionicons 
                name={inspection.condition_satisfactory ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={COLORS.white} 
              />
              <Text style={styles.statusText}>
                {inspection.condition_satisfactory ? "Satisfactory" : "Unsatisfactory"}
              </Text>
            </View>
          </View>
        </View>

        {/* Defective Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Defective Items</Text>
          <Text style={styles.asteriskNote}>
            *Items marked with asterisk are critical safety components
          </Text>
          <View style={styles.itemsContainer}>
            {renderDefectiveItems()}
          </View>
        </View>

        {/* Truck/Trailer Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Truck/Trailer Defects</Text>
          <View style={styles.itemsContainer}>
            {renderTruckTrailerItems()}
          </View>
        </View>

        {/* Remarks */}
        {inspection.remarks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Remarks</Text>
            <Text style={styles.remarksText}>{inspection.remarks}</Text>
          </View>
        )}

        {/* Correction Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Correction Status</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Defects Corrected:</Text>
            <Text style={[
              styles.value,
              { color: inspection.defects_corrected ? COLORS.income : COLORS.expense }
            ]}>
              {inspection.defects_corrected ? "Yes" : "No"}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Needs Correction for Safe Operation:</Text>
            <Text style={[
              styles.value,
              { color: inspection.defects_need_correction ? COLORS.expense : COLORS.income }
            ]}>
              {inspection.defects_need_correction ? "Yes" : "No"}
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          
          {/* Driver Signature */}
          <View style={styles.signatureRow}>
            <Text style={styles.label}>Driver Signature:</Text>
            <View style={styles.signatureContainer}>
              {inspection.driver_signature && inspection.driver_signature.trim() ? (
                <>
                  <Text style={styles.signatureText}>{inspection.driver_signature}</Text>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.income} style={styles.signatureCheck} />
                </>
              ) : (
                <>
                  <Text style={[styles.signatureText, styles.signatureEmpty]}>Not signed</Text>
                  <Ionicons name="close-circle" size={20} color={COLORS.expense} style={styles.signatureCheck} />
                </>
              )}
            </View>
          </View>
          
          {/* Mechanic Signature */}
          <View style={styles.signatureRow}>
            <Text style={styles.label}>Mechanic Signature:</Text>
            <View style={styles.signatureContainer}>
              {inspection.mechanic_signature && inspection.mechanic_signature.trim() ? (
                <>
                  <Text style={styles.signatureText}>{inspection.mechanic_signature}</Text>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.income} style={styles.signatureCheck} />
                </>
              ) : (
                <>
                  <Text style={[styles.signatureText, styles.signatureEmpty]}>Not signed</Text>
                  <Ionicons name="close-circle" size={20} color={COLORS.expense} style={styles.signatureCheck} />
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}