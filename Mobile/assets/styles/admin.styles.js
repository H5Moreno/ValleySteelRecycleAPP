import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  
  // Stats Section
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
  },

  // List Section
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  inspectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inspectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  inspectionDetails: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  userText: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  statusContainer: {
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
  },

  // Access Denied
  accessDeniedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  accessDeniedText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 24,
  },
  backToHomeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToHomeText: {
    color: COLORS.white,
    fontWeight: "600",
  },

  // Admin button for home screen
  adminButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});