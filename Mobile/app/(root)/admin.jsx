import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../assets/styles/admin.styles";
import { COLORS } from "../../constants/colors";
import { useAdmin } from "../../hooks/useAdmin";
import PageLoader from "../../components/PageLoader";
import { formatDate } from "../../lib/utils";

const AdminDashboard = () => {
  const router = useRouter();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    isAdmin, 
    allInspections, 
    stats, 
    isLoading, 
    loadAdminData, 
    deleteInspection 
  } = useAdmin(user.id);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdminData();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Inspection",
      "Are you sure you want to permanently delete this inspection?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteInspection(id) },
      ]
    );
  };

  const handleEdit = (inspection) => {
    router.push(`/admin/edit/${inspection.id}`);
  };

  const renderInspectionItem = ({ item }) => (
    <View style={styles.inspectionCard}>
      <View style={styles.inspectionHeader}>
        <Text style={styles.vehicleText}>{item.vehicle}</Text>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>
      
      <View style={styles.inspectionDetails}>
        <Text style={styles.locationText}>{item.location || "No location"}</Text>
        <Text style={styles.userText}>User: {item.user_email || item.user_id}</Text>
        
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            { color: item.condition_satisfactory ? COLORS.income : COLORS.expense }
          ]}>
            {item.condition_satisfactory ? "Satisfactory" : "Unsatisfactory"}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => router.push(`/view/${item.id}`)}
        >
          <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
          <Text style={[styles.actionButtonText, { color: COLORS.expense }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) return <PageLoader />;

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Access Denied</Text>
        </View>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="shield-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.accessDeniedText}>
            You don't have admin privileges to access this page.
          </Text>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => router.push("/")}
          >
            <Text style={styles.backToHomeText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total_inspections}</Text>
            <Text style={styles.statLabel}>Total Inspections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.income }]}>
              {stats.satisfactory_count}
            </Text>
            <Text style={styles.statLabel}>Satisfactory</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: COLORS.expense }]}>
              {stats.unsatisfactory_count}
            </Text>
            <Text style={styles.statLabel}>Unsatisfactory</Text>
          </View>
        </View>
      )}

      <FlatList
        data={allInspections}
        renderItem={renderInspectionItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

export default AdminDashboard;