import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { SignOutButton } from "@/components/SignOutButton";
import { useInspections } from "../../hooks/useInspections";
import { useCallback, useState, useEffect } from "react";
import PageLoader from "../../components/PageLoader";
import { styles } from "../../assets/styles/home.styles";
import { BalanceCard } from "../../components/BalanceCard";
import { InspectionItem } from "../../components/InspectionItem";
import NoInspectionsFound from "../../components/NoInspectionsFound"; 
import { useAdmin } from "../../hooks/useAdmin";
import { API_URL } from "../../constants/api";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { isAdmin, needsBootstrap } = useAdmin(user?.id, user?.emailAddresses?.[0]?.emailAddress); // ADD needsBootstrap here

  const { inspections, isLoading, loadData, deleteInspection } = useInspections(
    user?.id, 
    user?.emailAddresses?.[0]?.emailAddress
  );
  
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData(true);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id && inspections.length === 0) {
        loadData(false);
      }
    }, [user?.id, inspections.length])
  );

  const handleDelete = (id) => {
    Alert.alert("Delete Inspection", "Are you sure you want to delete this inspection?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteInspection(id) },
    ]);
  };

  if (isLoading && inspections.length === 0) return <PageLoader />;

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
            {/* FIXED: Show admin button if user is admin OR if bootstrap is needed */}
            {(isAdmin || needsBootstrap) && (
              <TouchableOpacity 
                style={[
                  styles.adminButton,
                  needsBootstrap && styles.bootstrapButton // Add special styling for bootstrap
                ]}
                onPress={() => router.push("/admin")}
              >
                <Ionicons 
                  name={needsBootstrap ? "key-outline" : "clipboard-outline"} 
                  size={24} 
                  color={needsBootstrap ? COLORS.expense : COLORS.primary} 
                />
                {needsBootstrap && (
                  <Text style={styles.bootstrapText}>Setup</Text>
                )}
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