import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform } from "react-native"
import { doc, setDoc } from "firebase/firestore"
import { db, auth } from "../firebaseConfig"
import * as ImagePicker from "expo-image-picker"
import { Feather } from "@expo/vector-icons"
import styles from "../styles/userDataStyles"

export default function UserDataScreen({ navigation }) {
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Pedir permisos para image picker
  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        alert("Se necesitan permisos para acceder a la cámara y la galería")
        return false
      }
      return true
    }
    return true
  }

  // Elegir imagen de galeria
  const pickImage = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error al elegir imagen:", error)
      alert("No se pudo seleccionar la imagen")
    }
  }

  // Tomar foto con camara
  const takePhoto = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error tomando foto:", error)
      alert("No se pudo tomar la foto")
    }
  }

  // Subir imagen a Cloudinary
  const uploadImageToCloudinary = async (uri) => {
    try {
      setUploadingImage(true)

      // Crear formularo para subir
      const formData = new FormData()
      const uriParts = uri.split(".")
      const fileType = uriParts[uriParts.length - 1]

      // Anadir imagen al formulario
      formData.append("file", {
        uri,
        name: `profile_${auth.currentUser.uid}_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      })

      // Datos propios para la api
      formData.append("upload_preset", "datosproyecto")
      formData.append("folder", "proyecto4d/usuarios")

      // Subir a Cloudinary
      const response = await fetch("https://api.cloudinary.com/v1_1/doze2qu0s/image/upload", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      })

      const data = await response.json()

      if (response.ok) {
        return data.secure_url
      } else {
        throw new Error(data.error?.message || "Error al subir imagen a Cloudinary")
      }
    } catch (error) {
      console.error("Error subiendo imagen:", error)
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    if (!username.trim() || !phone.trim()) {
      alert("Por favor completa todos los campos")
      return
    }

    setLoading(true)
    try {
      const userId = auth.currentUser.uid

      // Subir foto de perfil
      let profileImageUrl = null
      if (profileImage) {
        profileImageUrl = await uploadImageToCloudinary(profileImage)
      }

      // Guardar datos adicionales del usuario en Firestore
      await setDoc(doc(db, "usuarios", userId), {
        username,
        phone,
        email: auth.currentUser.email,
        profileImage: profileImageUrl,
        createdAt: new Date().toISOString(),
      })

      navigation.replace("Home") // Navegar a la app home una vez registrado
    } catch (error) {
      console.error("Error al guardar datos de usuario:", error)
      alert("Error al guardar los datos: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Completa tu perfil</Text>
        <Text style={styles.subtitle}>Solo unos datos más para comenzar</Text>

        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Feather name="user" size={40} color="#999" />
              </View>
            )}
            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto} disabled={loading || uploadingImage}>
              <Feather name="camera" size={20} color="#171321" />
              <Text style={styles.imageButtonText}>Cámara</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.imageButton} onPress={pickImage} disabled={loading || uploadingImage}>
              <Feather name="image" size={20} color="#171321" />
              <Text style={styles.imageButtonText}>Galería</Text>
            </TouchableOpacity>
          </View>
        </View>

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
          style={[styles.button, (loading || uploadingImage) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploadingImage}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Continuar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}
