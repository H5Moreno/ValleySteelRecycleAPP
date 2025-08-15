import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { useAdmin } from "../../hooks/useAdmin";
import PageLoader from "../../components/PageLoader";
import DefectiveItemsChart from "../../components/DefectiveItemsChart";
import UserManagement from "../../components/UserManagement";
import { formatDate } from "../../lib/utils";

export default function AdminPage() {
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAllInspections, setShowAllInspections] = useState(false);

  const { 
    isAdmin, 
    allInspections, 
    stats, 
    defectiveItemsStats,
    isLoading, 
    loadAdminData,
    deleteInspection 
  } = useAdmin(user?.id);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered');
      await loadAdminData();
    } catch (error) {
      console.error('Error refreshing admin data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadAdminData();
      }
    }, [user?.id])
  );

  const handleDelete = (id) => {
    Alert.alert("Delete Inspection", "Are you sure you want to delete this inspection?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteInspection(id) },
    ]);
  };

  const getStatusColor = (inspection) => {
    if (!inspection.condition_satisfactory) return COLORS.expense;
    if (inspection.defects_need_correction) return "#FF9500"; // Orange for needs attention
    return COLORS.income; // Green for satisfactory
  };

  const getStatusText = (inspection) => {
    if (!inspection.condition_satisfactory) return "Unsatisfactory";
    if (inspection.defects_need_correction) return "Needs Correction";
    return "Satisfactory";
  };

  if (isLoading) return <PageLoader />;

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
        <View style={styles.centeredContainer}>
          <Ionicons name="shield-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.noAccessText}>Access Denied</Text>
          <Text style={styles.noAccessSubtext}>You don't have admin privileges</Text>
        </View>
      </View>
    );
  }

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
        onPress={() => setActiveTab('dashboard')}
      >
        <Ionicons 
          name="analytics-outline" 
          size={20} 
          color={activeTab === 'dashboard' ? COLORS.primary : COLORS.textLight} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'dashboard' && styles.activeTabText
        ]}>Dashboard</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'users' && styles.activeTab]}
        onPress={() => setActiveTab('users')}
      >
        <Ionicons 
          name="people-outline" 
          size={20} 
          color={activeTab === 'users' ? COLORS.primary : COLORS.textLight} 
        />
        <Text style={[
          styles.tabText, 
          activeTab === 'users' && styles.activeTabText
        ]}>Users</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInspectionItem = (inspection) => (
    <View style={styles.inspectionCard} key={inspection.id}>
      {/* Main inspection info */}
      <View style={styles.inspectionMainContent}>
        <View style={styles.inspectionIconContainer}>
          <Ionicons name="car-outline" size={20} color={getStatusColor(inspection)} />
        </View>
        
        <View style={styles.inspectionDetails}>
          <Text style={styles.inspectionVehicle} numberOfLines={1}>
            {inspection.vehicle || "Vehicle Inspection"}
          </Text>
          <Text style={styles.inspectionLocation} numberOfLines={1}>
            {inspection.location || "No location"}
          </Text>
          <Text style={styles.inspectionUser} numberOfLines={1}>
            {inspection.user_email || "Unknown user"}
          </Text>
        </View>
        
        <View style={styles.inspectionStatusContainer}>
          <Text style={[styles.inspectionStatus, { color: getStatusColor(inspection) }]} numberOfLines={1}>
            {getStatusText(inspection)}
          </Text>
          <Text style={styles.inspectionDate}>
            {formatDate(inspection.created_at)}
          </Text>
        </View>
      </View>
      
      {/* Action Buttons Row */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => router.push(`/view/${inspection.id}`)}
        >
          <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
          <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => router.push(`/admin/edit/${inspection.id}`)}
        >
          <Ionicons name="create-outline" size={16} color={COLORS.secondary} />
          <Text style={[styles.actionButtonText, { color: COLORS.secondary }]}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(inspection.id)}
        >
          <Ionicons name="trash-outline" size={16} color={COLORS.expense} />
          <Text style={[styles.actionButtonText, { color: COLORS.expense }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDashboard = () => (
    <ScrollView 
      style={styles.scrollView}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Horizontal Statistics Cards - 3 cards in a row */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.horizontalCard]}>
          <View style={styles.statRow}>
            <Ionicons name="clipboard-outline" size={20} color={COLORS.primary} />
            <Text style={styles.compactStatNumber}>{stats?.total_inspections || 0}</Text>
          </View>
          <Text style={styles.compactStatLabel}>Total Inspections</Text>
        </View>
        
        <View style={[styles.statCard, styles.horizontalCard]}>
          <View style={styles.statRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
            <Text style={styles.compactStatNumber}>{stats?.satisfactory_count || 0}</Text>
          </View>
          <Text style={styles.compactStatLabel}>Satisfactory</Text>
        </View>
        
        <View style={[styles.statCard, styles.horizontalCard]}>
          <View style={styles.statRow}>
            <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
            <Text style={styles.compactStatNumber}>{stats?.unsatisfactory_count || 0}</Text>
          </View>
          <Text style={styles.compactStatLabel}>Need Attention</Text>
        </View>
      </View>

      {/* Defective Items Chart */}
      <View style={styles.chartContainer}>
        <DefectiveItemsChart data={defectiveItemsStats} />
      </View>

      {/* Recent Inspections - UPDATED TO MATCH CHART CONTAINER RATIO */}
      <View style={styles.inspectionsContainer}>
        <Text style={styles.inspectionsTitle}>
          {showAllInspections ? 'All Inspections' : 'Recent Inspections'}
        </Text>
        <Text style={styles.inspectionsSubtitle}>
          {showAllInspections 
            ? `Showing all ${allInspections.length} inspections`
            : `Latest ${Math.min(allInspections.length, 5)} of ${allInspections.length} inspections`
          }
        </Text>
        
        {/* Inspections List */}
        <View style={styles.inspectionsList}>
          {(showAllInspections ? allInspections : allInspections.slice(0, 5))
            .map((inspection) => renderInspectionItem(inspection))}
        </View>
        
        {/* Toggle button */}
        {allInspections.length > 5 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => setShowAllInspections(!showAllInspections)}
          >
            <Text style={styles.viewAllText}>
              {showAllInspections 
                ? `Show Less` 
                : `View All ${allInspections.length} Inspections`
              }
            </Text>
            <Ionicons 
              name={showAllInspections ? "chevron-up" : "arrow-forward"} 
              size={14} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );

  const renderUsers = () => (
    <UserManagement adminUserId={user?.id} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      {renderTabBar()}

      {/* Content */}
      {activeTab === 'dashboard' ? renderDashboard() : renderUsers()}
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  refreshButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textLight,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccessText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  noAccessSubtext: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 8,
  },
  // Statistics layout
  statsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  horizontalCard: {
    flex: 1,
    padding: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  compactStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  compactStatLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'left',
  },
  // Chart container
  chartContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  // UPDATED: Inspections container to match chart ratio
  inspectionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inspectionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  inspectionsSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  inspectionsList: {
    // Container for the list of inspections
  },
  // Inspection card styles remain the same
  inspectionCard: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inspectionMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inspectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inspectionDetails: {
    flex: 1,
    marginRight: 8,
  },
  inspectionVehicle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  inspectionLocation: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 1,
  },
  inspectionUser: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  inspectionStatusContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  inspectionStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'right',
  },
  inspectionDate: {
    fontSize: 10,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewButton: {
    borderColor: COLORS.primary,
  },
  editButton: {
    borderColor: COLORS.secondary,
  },
  deleteButton: {
    borderColor: COLORS.expense,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewAllText: {
    fontSize: 13,
    color: COLORS.primary,
    marginRight: 4,
  },
};