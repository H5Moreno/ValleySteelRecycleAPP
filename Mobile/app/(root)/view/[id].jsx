import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../../assets/styles/view.styles";
import { COLORS } from "../../../constants/colors";
import { formatDate } from "../../../lib/utils";
import PageLoader from "../../../components/PageLoader";
import { useInspections } from "../../../hooks/useInspections";
import { useAdmin } from "../../../hooks/useAdmin";
import { useUser } from "@clerk/clerk-expo";
import { DEFECTIVE_ITEMS, TRUCK_TRAILER_ITEMS } from "../../../constants/inspectionItems";
import { API_URL } from "../../../constants/api";

export default function ViewInspection() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useUser();
  const { inspections, isLoading: inspectionsLoading } = useInspections(user.id);
  const { isAdmin } = useAdmin(user.id);
  const [inspection, setInspection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchInspection = async () => {
      if (!id || !user?.id) {
        console.log('Missing required data - id:', id, 'userId:', user?.id);
        return;
      }
      
      console.log('=== STARTING FETCH ===');
      console.log('Inspection ID:', id);
      console.log('User ID:', user.id);
      console.log('Is Admin:', isAdmin);
      console.log('Inspections Loading:', inspectionsLoading);
      console.log('User Inspections Count:', inspections?.length || 0);

      setIsLoading(true);
      setError(null);

      try {
        // First try to find in user's own inspections
        if (!inspectionsLoading && inspections && inspections.length > 0) {
          console.log('Searching in user inspections...');
          const foundInspection = inspections.find(inspection => 
            inspection.id.toString() === id.toString()
          );
          
          if (foundInspection) {
            console.log('✅ Found inspection in user inspections:', foundInspection.id);
            if (isMounted) {
              setInspection(foundInspection);
              setIsLoading(false);
            }
            return;
          } else {
            console.log('❌ Inspection not found in user inspections');
          }
        }

        // If not found in user's inspections and user is admin, try admin fetch
        if (isAdmin && !inspectionsLoading) {
          console.log('🔑 Attempting admin fetch...');
          console.log('API URL:', `${API_URL}/admin/single-inspection/${id}`);
          
          try {
            const requestBody = { adminUserId: user.id };
            console.log('Request body:', requestBody);

            const response = await fetch(`${API_URL}/admin/single-inspection/${id}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ Response error:', errorText);
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const adminInspection = await response.json();
            console.log('✅ Admin fetch successful:', adminInspection);
            
            if (isMounted) {
              setInspection(adminInspection);
              setIsLoading(false);
            }
          } catch (adminError) {
            console.error('❌ Admin fetch failed:', adminError);
            if (isMounted) {
              setError(`Admin fetch failed: ${adminError.message}`);
              setInspection(null);
              setIsLoading(false);
            }
          }
        } else if (!inspectionsLoading && !isAdmin) {
          console.log('❌ Not admin and inspection not found in user inspections');
          if (isMounted) {
            setError('Inspection not found or access denied');
            setInspection(null);
            setIsLoading(false);
          }
        } else if (inspectionsLoading) {
          console.log('⏳ Still loading user inspections...');
          // Don't set loading to false yet, wait for inspections to load
        } else {
          console.log('⏳ Waiting for admin status...');
          // Don't set loading to false yet, wait for admin status
        }
      } catch (error) {
        console.error('❌ General error fetching inspection:', error);
        if (isMounted) {
          setError(`Error: ${error.message}`);
          setInspection(null);
          setIsLoading(false);
        }
      }
    };

    fetchInspection();

    return () => {
      isMounted = false;
    };
  }, [id, inspections, inspectionsLoading, isAdmin, user?.id]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <PageLoader />
        {/* Debug info */}
        <View style={{ padding: 20 }}>
          <Text style={{ color: COLORS.textLight, fontSize: 12 }}>
            Debug: ID={id}, Admin={String(isAdmin)}, InspectionsLoading={String(inspectionsLoading)}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.expense} />
          <Text style={styles.title}>Error Loading Inspection</Text>
          <Text style={{ color: COLORS.textLight, textAlign: 'center', marginBottom: 20 }}>
            {error}
          </Text>
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
          <Ionicons name="document-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.title}>Inspection Not Found</Text>
          <Text style={{ color: COLORS.textLight, textAlign: 'center', marginBottom: 20 }}>
            This inspection could not be found or you don't have permission to view it.
          </Text>
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

        {/* Show user info if admin is viewing someone else's inspection */}
        {isAdmin && inspection.user_email && (
          <View style={styles.adminInfoSection}>
            <View style={styles.adminInfoBadge}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
              <Text style={styles.adminInfoText}>
                Inspector: {inspection.user_email}
              </Text>
            </View>
          </View>
        )}

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