import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { doc, setDoc } from "firebase/firestore"
import { db, auth } from "../firebaseConfig"

export default function UserDataScreen({ navigation }) {
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!username.trim() || !phone.trim()) {
      alert("Por favor completa todos los campos")
      return
    }

    setLoading(true)
    try {
      const userId = auth.currentUser.uid
      // Guardar datos adicionales del usuario en Firestore
      await setDoc(doc(db, "usuarios", userId), {
        username,
        phone,
        email: auth.currentUser.email,
        createdAt: new Date().toISOString()
      })

      navigation.replace("Home")
    } catch (error) {
      console.error("Error saving user data:", error)
      alert("Error al guardar los datos: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Completa tu perfil</Text>
        <Text style={styles.subtitle}>
          Solo unos datos más para comenzar
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Número de teléfono"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Guardando..." : "Continuar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
});