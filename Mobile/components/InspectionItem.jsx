import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";
import { formatDate } from "../lib/utils";
import { useRouter } from "expo-router";

export const InspectionItem = ({ item }) => {
  const router = useRouter();

  const handleViewPress = () => {
    console.log('Navigating to view inspection with ID:', item.id);
    router.push(`/view/${item.id}`);
  };

  const getStatusColor = () => {
    if (!item.condition_satisfactory) return COLORS.expense;
    if (item.defects_need_correction) return "#FF9500"; // Orange for needs attention
    return COLORS.income; // Green for satisfactory
  };

  const getStatusText = () => {
    if (!item.condition_satisfactory) return "Unsatisfactory";
    if (item.defects_need_correction) return "Needs Correction";
    return "Satisfactory";
  };

  return (
    <View style={styles.transactionCard} key={item.id}>
      <TouchableOpacity style={styles.transactionContent} onPress={handleViewPress}>
        <View style={styles.categoryIconContainer}>
          <Ionicons name="car-outline" size={22} color={getStatusColor()} />
        </View>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionTitle}>{item.vehicle || "Vehicle Inspection"}</Text>
          <Text style={styles.transactionCategory}>{item.location || "No location"}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.viewButton} onPress={handleViewPress}>
        <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};