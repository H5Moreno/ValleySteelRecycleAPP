import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const NoInspectionsFound = () => {
  const router = useRouter();

  return (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={64} color={COLORS.textLight} style={styles.emptyStateIcon} />
      <Text style={styles.emptyStateTitle}>No Inspections Yet</Text>
      <Text style={styles.emptyStateText}>
        Start by creating your first vehicle daily inspection report. Track vehicle conditions and ensure safety compliance.
      </Text>
      <TouchableOpacity 
        style={styles.emptyStateButton}
        onPress={() => router.push("/create")}
      >
        <Ionicons name="add" size={20} color={COLORS.white} />
        <Text style={styles.emptyStateButtonText}>Create Inspection</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NoInspectionsFound;