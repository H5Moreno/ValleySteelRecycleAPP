import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";
import { Ionicons } from "@expo/vector-icons";

export const BalanceCard = ({ onAddPress }) => {
  return (
    <View style={styles.balanceCard}>
      <TouchableOpacity style={styles.addTransactionButton} onPress={onAddPress}>
        <Ionicons name="clipboard-outline" size={32} color={COLORS.primary} />
        <Text style={styles.addTransactionButtonText}>New Vehicle Inspection</Text>
      </TouchableOpacity>
    </View>
  );
};