import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../../../assets/styles/view.styles";
import { COLORS } from "../../../constants/colors";
import { API_URL } from "../../../constants/api";
import { formatDate } from "../../../lib/utils";
import PageLoader from "../../../components/PageLoader";

const CATEGORY_ICONS = {
  "Food & Drinks": "fast-food",
  Shopping: "cart",
  Transportation: "car",
  Entertainment: "film",
  Bills: "receipt",
  Income: "cash",
  Other: "ellipsis-horizontal",
};

export default function ViewPaperwork() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [paperwork, setPaperwork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPaperwork();
    }
  }, [id]);

  const fetchPaperwork = async () => {
    try {
      console.log('Fetching paperwork with ID:', id);
      // Use the new single transaction endpoint
      const response = await fetch(`${API_URL}/transactions/single/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched paperwork:', data);
        setPaperwork(data);
      } else {
        console.error('Failed to fetch paperwork:', response.status);
      }
    } catch (error) {
      console.error("Error fetching paperwork:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <PageLoader />;

  if (!paperwork) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paperwork Not Found</Text>
        </View>
      </View>
    );
  }

  const isIncome = parseFloat(paperwork.amount) > 0;
  const iconName = CATEGORY_ICONS[paperwork.category] || "pricetag-outline";

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paperwork Details</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={iconName} 
            size={48} 
            color={isIncome ? COLORS.income : COLORS.expense} 
          />
        </View>

        <Text style={styles.title}>{paperwork.title}</Text>
        
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, { color: isIncome ? COLORS.income : COLORS.expense }]}>
            {isIncome ? "+" : "-"}${Math.abs(parseFloat(paperwork.amount)).toFixed(2)}
          </Text>
          <Text style={styles.amountLabel}>
            {isIncome ? "Income" : "Expense"}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <View style={styles.categoryContainer}>
              <Ionicons 
                name={iconName} 
                size={16} 
                color={COLORS.textLight} 
                style={styles.categoryIcon}
              />
              <Text style={styles.detailValue}>{paperwork.category}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(paperwork.created_at)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>#{paperwork.id}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}