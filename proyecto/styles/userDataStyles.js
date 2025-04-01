import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
    },
    content: {
      padding: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#171321",
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: "#666",
      marginBottom: 32,
      textAlign: "center",
    },
    profileImageContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    profileImageWrapper: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "#F2F2F2",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
      overflow: "hidden",
      position: "relative",
    },
    profileImage: {
      width: "100%",
      height: "100%",
      borderRadius: 60,
    },
    profileImagePlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F2F2F2",
    },
    uploadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    imageButtonsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 16,
    },
    imageButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F2F2F2",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#E0E0E0",
    },
    imageButtonText: {
      color: "#171321",
      marginLeft: 8,
      fontSize: 14,
    },
    input: {
      backgroundColor: "#F2F2F2",
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      fontSize: 16,
      color: "#171321",
      borderWidth: 1,
      borderColor: "#E0E0E0",
    },
    button: {
      backgroundColor: "#171321",
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 16,
      height: 56,
      justifyContent: "center",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  })
  
  