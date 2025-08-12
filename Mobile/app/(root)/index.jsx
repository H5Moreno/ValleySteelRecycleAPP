import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Add this import
import { COLORS } from "../../constants/colors"; // Add this import
import { SignOutButton } from "@/components/SignOutButton";
import { useInspections } from "../../hooks/useInspections";
import { useCallback, useState } from "react";
import PageLoader from "../../components/PageLoader";
import { styles } from "../../assets/styles/home.styles";
import { BalanceCard } from "../../components/BalanceCard";
import { InspectionItem } from "../../components/InspectionItem";
import NoInspectionsFound from "../../components/NoInspectionsFound"; 
import { useAdmin } from "../../hooks/useAdmin";
import { styles as adminStyles } from "../../assets/styles/admin.styles";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { isAdmin } = useAdmin(user.id);

  const { inspections, isLoading, loadData, deleteInspection } = useInspections(user.id);
  

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Fetch data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = (id) => {
    Alert.alert("Delete Inspection", "Are you sure you want to delete this inspection?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteInspection(id) },
    ]);
  };

  if (isLoading) return <PageLoader />;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* LEFT */}
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/VSRLogo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.usernameText}>
                {user?.emailAddresses[0]?.emailAddress.split("@")[0]}
              </Text>
            </View>
          </View>
          {/* RIGHT */}
          <View style={styles.headerRight}>
            {isAdmin && (
              <TouchableOpacity 
                style={styles.adminButton}
                onPress={() => router.push("/admin")}
              >
                <Ionicons name="clipboard-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            <SignOutButton />
          </View>
        </View>

        <BalanceCard onAddPress={() => router.push("/create")} />

        <View style={styles.transactionsHeaderContainer}>
          <Text style={styles.sectionTitle}>Recent Inspections</Text>
        </View>
      </View>

      <FlatList
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsListContent}
        data={inspections}
        renderItem={({ item }) => <InspectionItem item={item} />}
        ListEmptyComponent={<NoInspectionsFound />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}