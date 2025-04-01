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
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 100,
    },
    notificacionCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
    },
    notificacionNoLeida: {
      borderLeftWidth: 4,
      borderLeftColor: "#1E5F74",
    },
    notificacionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    tipoContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconoTipo: {
      marginRight: 6,
    },
    notificacionTipo: {
      color: "#1E5F74",
      fontSize: 14,
      fontWeight: "500",
    },
    cambioFechaTipo: {
      color: "#FF9800",
    },
    notificacionFecha: {
      color: "#666",
      fontSize: 12,
    },
    notificacionTitulo: {
      color: "#333",
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
    },
    notificacionMensaje: {
      color: "#555",
      fontSize: 14,
      marginBottom: 12,
      lineHeight: 20,
    },
    notificacionDetalles: {
      marginTop: 8,
    },
    detalleItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    notificacionProyecto: {
      color: "#555",
      fontSize: 14,
      marginLeft: 8,
    },
    notificacionEstado: {
      color: "#555",
      fontSize: 14,
      marginLeft: 8,
    },
    botonesContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 16,
      gap: 8,
    },
    boton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    botonAceptar: {
      backgroundColor: "#1E5F74",
    },
    botonRechazar: {
      backgroundColor: "#FF6B6B",
    },
    botonTexto: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      marginTop: 60,
      padding: 20,
    },
    noNotificaciones: {
      color: "#666",
      textAlign: "center",
      marginTop: 12,
      fontSize: 16,
    },
    verMasContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 12,
    },
    verMasTexto: {
      color: "#1E5F74",
      fontSize: 14,
      fontWeight: "500",
      marginRight: 4,
    },
  });