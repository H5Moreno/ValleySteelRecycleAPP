import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../hooks/useTranslation";

export const BalanceCard = ({ onAddPress }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.balanceCard}>
      <TouchableOpacity style={styles.addTransactionButton} onPress={onAddPress}>
        <Ionicons name="clipboard-outline" size={32} color={COLORS.primary} />
        <Text style={styles.addTransactionButtonText}>{t('newVehicleInspection')}</Text>
      </TouchableOpacity>
    </View>
  );
};