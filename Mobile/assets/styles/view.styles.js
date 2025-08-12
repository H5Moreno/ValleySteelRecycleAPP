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
  },
  card: {
    backgroundColor: COLORS.card,
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 16,
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  amount: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  detailsContainer: {
    width: "100%",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    marginRight: 6,
  },
  adminInfoSection: {
    marginBottom: 16,
  },
  adminInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "center",
  },
  adminInfoText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
  },
  status: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  statusContainer: {
    marginBottom: 20,
  },
  section: {
    width: "100%",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  itemsList: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  listItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  remarksText: {
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 6,
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  signatureText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});