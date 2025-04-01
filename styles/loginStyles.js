import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF", // Blanco como fondo principal
      justifyContent: "center",
    },
    content: {
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#171321", // Púrpura oscuro para el título
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: "#333", // Gris oscuro para el subtítulo
      marginBottom: 32,
      textAlign: "center",
    },
    input: {
      backgroundColor: "#F2F2F2", // Gris claro para el fondo del input
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      fontSize: 16,
      color: "#171321", // Púrpura oscuro para el texto del input
    },
    button: {
      backgroundColor: "#171321", // Púrpura oscuro para el botón
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 16,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "500",
    },
    linkButton: {
      marginTop: 16,
      alignItems: "center",
    },
    linkText: {
      color: "#171321", // Púrpura oscuro para el texto del enlace
      fontSize: 16,
    },
  });