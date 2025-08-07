import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../../assets/styles/view.styles";
import { COLORS } from "../../../constants/colors";
import { formatDate } from "../../../lib/utils";
import PageLoader from "../../../components/PageLoader";
import { useInspections } from "../../../hooks/useInspections";
import { useUser } from "@clerk/clerk-expo";
import { DEFECTIVE_ITEMS, TRUCK_TRAILER_ITEMS } from "../../../constants/inspectionItems";

export default function ViewInspection() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const { inspections, isLoading: inspectionsLoading } = useInspections(user.id);
  const [inspection, setInspection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('View component mounted with ID:', id);
    console.log('Inspections loaded:', inspections.length);
    
    if (!inspectionsLoading && inspections.length > 0) {
      const foundInspection = inspections.find(inspection => 
        inspection.id.toString() === id.toString()
      );
      console.log('Looking for inspection with ID:', id);
      console.log('Found inspection:', foundInspection);
      setInspection(foundInspection);
      setIsLoading(false);
    } else if (!inspectionsLoading) {
      setIsLoading(false);
    }
  }, [id, inspections, inspectionsLoading]);

  if (isLoading || inspectionsLoading) return <PageLoader />;

  if (!inspection) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inspection Not Found</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>This inspection could not be found.</Text>
          <TouchableOpacity 
            style={{
              backgroundColor: COLORS.primary,
              padding: 12,
              borderRadius: 8,
              marginTop: 20
            }}
            onPress={() => router.back()}
          >
            <Text style={{ color: COLORS.white, fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusColor = () => {
    if (!inspection.condition_satisfactory) return COLORS.expense;
    if (inspection.defects_need_correction) return "#FF9500";
    return COLORS.income;
  };

  const getStatusText = () => {
    if (!inspection.condition_satisfactory) return "Unsatisfactory";
    if (inspection.defects_need_correction) return "Needs Correction";
    return "Satisfactory";
  };

  const getSelectedItems = (items, selectedObj) => {
    if (!selectedObj) return [];
    return items.filter(item => selectedObj[item.id]).map(item => item.name);
  };

  const selectedDefectiveItems = getSelectedItems(DEFECTIVE_ITEMS, inspection.defective_items);
  const selectedTruckTrailerItems = getSelectedItems(TRUCK_TRAILER_ITEMS, inspection.truck_trailer_items);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inspection Details</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="car-outline" size={48} color={getStatusColor()} />
        </View>

        <Text style={styles.title}>{inspection.vehicle}</Text>
        
        <View style={styles.statusContainer}>
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{inspection.location || "Not specified"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(inspection.date || inspection.created_at)}</Text>
          </View>

          {inspection.time && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{inspection.time}</Text>
            </View>
          )}

          {inspection.speedometer_reading && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Speedometer</Text>
              <Text style={styles.detailValue}>{inspection.speedometer_reading}</Text>
            </View>
          )}

          {inspection.trailer_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trailer Number</Text>
              <Text style={styles.detailValue}>{inspection.trailer_number}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Inspection ID</Text>
            <Text style={styles.detailValue}>#{inspection.id}</Text>
          </View>
        </View>

        {selectedDefectiveItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Defective Items</Text>
            <View style={styles.itemsList}>
              {selectedDefectiveItems.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="warning-outline" size={16} color={COLORS.expense} />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedTruckTrailerItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Truck/Trailer Issues</Text>
            <View style={styles.itemsList}>
              {selectedTruckTrailerItems.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="warning-outline" size={16} color={COLORS.expense} />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {inspection.remarks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Remarks</Text>
            <Text style={styles.remarksText}>{inspection.remarks}</Text>
          </View>
        )}

        {(inspection.driver_signature || inspection.mechanic_signature) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Signatures</Text>
            {inspection.driver_signature && (
              <View style={styles.signatureRow}>
                <Text style={styles.signatureLabel}>Driver:</Text>
                <Text style={styles.signatureText}>{inspection.driver_signature}</Text>
              </View>
            )}
            {inspection.mechanic_signature && (
              <View style={styles.signatureRow}>
                <Text style={styles.signatureLabel}>Mechanic:</Text>
                <Text style={styles.signatureText}>{inspection.mechanic_signature}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}