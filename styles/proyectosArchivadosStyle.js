import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F5F7FA",
    },
    header: {
      backgroundColor: "#1E5F74",
      paddingTop: 50,
      paddingBottom: 15,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      elevation: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#FFFFFF",
      marginTop: 10,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    backButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      marginLeft: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      marginLeft: 8,
    },
    proyectoCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    proyectoNombre: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#333",
      flex: 1,
      marginRight: 8,
    },
    estadoBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    estadoTexto: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "bold",
    },
    proyectoDescripcion: {
      color: "#555",
      fontSize: 14,
      marginBottom: 16,
      lineHeight: 20,
    },
    proyectoFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
    },
    footerItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
      marginBottom: 4,
    },
    proyectoFecha: {
      color: "#666",
      fontSize: 14,
      marginLeft: 6,
    },
    proyectoCliente: {
      color: "#666",
      fontSize: 14,
      marginLeft: 6,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F5F7FA",
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    emptyStateText: {
      color: "#666",
      fontSize: 16,
      marginTop: 12,
    },
  });