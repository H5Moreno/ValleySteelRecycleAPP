import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "../hooks/useTranslation";

const NoInspectionsFound = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={64} color={COLORS.textLight} style={styles.emptyStateIcon} />
      <Text style={styles.emptyStateTitle}>{t('noInspectionsYet')}</Text>
      <Text style={styles.emptyStateText}>
        {t('noInspectionsText')}
      </Text>
      <TouchableOpacity 
        style={styles.emptyStateButton}
        onPress={() => router.push("/create")}
      >
        <Ionicons name="add" size={20} color={COLORS.white} />
        <Text style={styles.emptyStateButtonText}>{t('createInspection')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NoInspectionsFound;