import { useState, useEffect } from "react"
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback, Keyboard
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { db, auth } from "../firebaseConfig"
import * as ImagePicker from "expo-image-picker"
import Modal from "react-native-modal"
import BottomNav from "../assets/BottomNav"
import styles from "../styles/perfilStyle"

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null)
  const [username, setUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [profileImage, setProfileImage] = useState(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [imageOptionsVisible, setImageOptionsVisible] = useState(false)

  const [error, setError] = useState(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const userId = auth.currentUser.uid
      const userDoc = await getDoc(doc(db, "usuarios", userId))

      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserData(data)
        setUsername(data.username || "")
        setPhone(data.phone || "")
        setProfileImage(data.profileImage || null)
      }
    } catch (error) {
      console.error("Error cargando informacion del usuario:", error)
      setError("No se pudo cargar la información del usuario")
    } finally {
      setLoading(false)
    }
  }

  // Pedir permisos para image picker
  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (cameraStatus !== "granted" || libraryStatus !== "granted") {
        Alert.alert("Se necesitan permisos para acceder a la cámara y la galería")
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
        setImageOptionsVisible(false)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("No se pudo seleccionar la imagen")
    }
  }

  // Tomar foto de galeria
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
        setImageOptionsVisible(false)
      }
    } catch (error) {
      console.error("Error taking photo:", error)
      Alert.alert("No se pudo tomar la foto")
    }
  }

  // Subir imagen a Cloudinary
  const uploadImageToCloudinary = async (uri) => {
    try {
      setUploadingImage(true)

      const formData = new FormData()

      const uriParts = uri.split(".")
      const fileType = uriParts[uriParts.length - 1]

      // Agregar imagen
      formData.append("file", {
        uri,
        name: `profile_${auth.currentUser.uid}_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      })

      // Agregar info de api de cloudinary
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
      console.error("Error uploading image:", error)
      throw error
    } finally {
      setUploadingImage(false)
    }
  }

  // Guardar cambios del perfil
  const handleSaveProfile = async () => {
    if (!username.trim()) {
      Alert.alert("Error", "El nombre de usuario es obligatorio")
      return
    }

    try {
      setSaving(true)
      const userId = auth.currentUser.uid

      let profileImageUrl = profileImage
      if (profileImage && profileImage.startsWith("file://")) {
        profileImageUrl = await uploadImageToCloudinary(profileImage)
      }

      // Subir info de usuario a firestore
      await updateDoc(doc(db, "usuarios", userId), {
        username,
        phone,
        profileImage: profileImageUrl,
        updatedAt: new Date().toISOString(),
      })

      Alert.alert("Éxito", "Perfil actualizado correctamente")

      setUserData({
        ...userData,
        username,
        phone,
        profileImage: profileImageUrl,
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert("Error", "No se pudo actualizar el perfil: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  // manejar el cambio de contrasena
  const handleChangePassword = async () => {
    // Validar password
    if (!currentPassword) {
      Alert.alert("Error", "Debes ingresar tu contraseña actual")
      return
    }

    if (!newPassword) {
      Alert.alert("Error", "Debes ingresar una nueva contraseña")
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden")
      return
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres")
      return
    }

    try {
      setChangingPassword(true)

      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)

      await reauthenticateWithCredential(auth.currentUser, credential)

      // Cambiar contrasena
      await updatePassword(auth.currentUser, newPassword)

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordModalVisible(false)

      Alert.alert("Éxito", "Contraseña actualizada correctamente")
    } catch (error) {
      console.error("Error changing password:", error)

      if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "La contraseña actual es incorrecta")
      } else {
        Alert.alert("Error", "No se pudo actualizar la contraseña: " + error.message)
      }
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar sesión",
        onPress: async () => {
          try {
            await signOut(auth)
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            })
          } catch (error) {
            console.error("Error signing out:", error)
            Alert.alert("Error", "No se pudo cerrar sesión: " + error.message)
          }
        },
        style: "destructive",
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#171321" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>


          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImageWrapper}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Feather name="user" size={50} color="#999" />
                  </View>
                )}
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.editImageButton}
                onPress={() => setImageOptionsVisible(true)}
                disabled={uploadingImage}
              >
                <Feather name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Información Personal</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre de usuario</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Ingresa tu teléfono"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSaveProfile}
              disabled={saving || uploadingImage}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="save" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.securitySection}>
            <Text style={styles.sectionTitle}>Seguridad</Text>

            <TouchableOpacity style={styles.securityButton} onPress={() => setPasswordModalVisible(true)}>
              <Feather name="lock" size={18} color="#171321" style={styles.buttonIcon} />
              <Text style={styles.securityButtonText}>Cambiar Contraseña</Text>
              <Feather name="chevron-right" size={18} color="#171321" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Feather name="log-out" size={18} color="#FF3B30" style={styles.buttonIcon} />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Modal  para cambiar contrasena*/}
        <Modal
          isVisible={passwordModalVisible}
          onBackdropPress={() => setPasswordModalVisible(false)}
          backdropOpacity={0.5}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={styles.modal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
                    <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                      <Feather name="x" size={24} color="#171321" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Contraseña actual</Text>
                    <TextInput
                      style={styles.input}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Ingresa tu contraseña actual"
                      placeholderTextColor="#999"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nueva contraseña</Text>
                    <TextInput
                      style={styles.input}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Ingresa tu nueva contraseña"
                      placeholderTextColor="#999"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirma tu nueva contraseña"
                      placeholderTextColor="#999"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setPasswordModalVisible(false)}
                      disabled={changingPassword}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.changePasswordButton, changingPassword && styles.buttonDisabled]}
                      onPress={handleChangePassword}
                      disabled={changingPassword}
                    >
                      {changingPassword ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.changePasswordButtonText}>Cambiar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal para elegir opciones de foto */}
        <Modal
          isVisible={imageOptionsVisible}
          onBackdropPress={() => setImageOptionsVisible(false)}
          backdropOpacity={0.5}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={styles.modal}
        >
          <View style={styles.imageOptionsContent}>
            <Text style={styles.imageOptionsTitle}>Foto de perfil</Text>

            <TouchableOpacity style={styles.imageOption} onPress={takePhoto}>
              <Feather name="camera" size={20} color="#171321" style={styles.imageOptionIcon} />
              <Text style={styles.imageOptionText}>Tomar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.imageOption} onPress={pickImage}>
              <Feather name="image" size={20} color="#171321" style={styles.imageOptionIcon} />
              <Text style={styles.imageOptionText}>Elegir de la galería</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelImageOption} onPress={() => setImageOptionsVisible(false)}>
              <Text style={styles.cancelImageOptionText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </KeyboardAvoidingView>

      <BottomNav />
    </View>
  )
}
