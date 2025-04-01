import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from "react-native"
import { signOut } from "@firebase/auth"
import { auth } from "../firebaseConfig"
import BottomNav from "../assets/BottomNav"
import { useEffect, useState } from "react"
import { crearProyecto, obtenerProyectos, actualizarProyecto, eliminarProyecto } from "../proyectosService"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"

export default function HomeScreen({ navigation }) {
  const [proyectos, setProyectos] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [nuevoProyecto, setNuevoProyecto] = useState({
    nombre: "",
    ubicacion: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "En Progreso",
    cliente: "",
    descripcion: "",
  })

  useEffect(() => {
    cargarProyectos()
  }, [])

  const cargarProyectos = async () => {
    try {
      const datos = await obtenerProyectos()
      setProyectos(datos)
    } catch (error) {
      alert("Error al cargar proyectos: " + error.message)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigation.replace("Login")
    } catch (error) {
      console.error("Logout error:", error)
      alert("Error al cerrar sesión: " + error.message)
    }
  }

  const manejarAgregarProyecto = async () => {
    // Validate all required fields
    if (
      !nuevoProyecto.nombre.trim() ||
      !nuevoProyecto.ubicacion.trim() ||
      !nuevoProyecto.fechaFin.trim() ||
      !nuevoProyecto.cliente.trim() ||
      !nuevoProyecto.descripcion.trim()
    ) {
      alert("Es necesario rellenar los campos.")
      return
    }

    try {
      // Set the current date as the start date
      const proyectoCompleto = {
        ...nuevoProyecto,
        fechaInicio: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
      }

      await crearProyecto(proyectoCompleto)
      setModalVisible(false)
      setNuevoProyecto({
        nombre: "",
        ubicacion: "",
        fechaInicio: "",
        fechaFin: "",
        estado: "En Progreso",
        cliente: "",
        descripcion: "",
      })
      cargarProyectos()
    } catch (error) {
      alert("Error al crear el proyecto: " + error.message)
    }
  }

  const manejarActualizarProyecto = async (id) => {
    try {
      await actualizarProyecto(id, { estado: "Finalizado" })
      cargarProyectos()
    } catch (error) {
      alert("Error al actualizar el proyecto: " + error.message)
    }
  }

  const manejarEliminarProyecto = async (id) => {
    try {
      await eliminarProyecto(id)
      cargarProyectos()
    } catch (error) {
      alert("Error al eliminar el proyecto: " + error.message)
    }
  }

  const verDetallesProyecto = (proyecto) => {
    navigation.navigate("InfoProyectos", { proyecto })
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Mis Proyectos</Text>
        <View style={styles.header}>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.addButtonText}>+ Nuevo Proyecto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        {proyectos.map((proyecto) => (
          <View key={proyecto.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{proyecto.nombre}</Text>
              <Text
                style={[
                  styles.statusBadge,
                  { backgroundColor: proyecto.estado === "Finalizado" ? "#4caf50" : "#ff9800" },
                ]}
              >
                {proyecto.estado}
              </Text>
            </View>
            <Text style={styles.text}>Cliente: {proyecto.cliente}</Text>
            <Text style={styles.text}>Ubicación: {proyecto.ubicacion}</Text>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.button, styles.detailsButton]}
                onPress={() => verDetallesProyecto(proyecto)}
              >
                <Text style={styles.buttonText}>Ver Detalles</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAwareScrollView>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Proyecto</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del proyecto"
              placeholderTextColor="#999"
              value={nuevoProyecto.nombre}
              onChangeText={(text) => setNuevoProyecto({ ...nuevoProyecto, nombre: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Ubicación"
              placeholderTextColor="#999"
              value={nuevoProyecto.ubicacion}
              onChangeText={(text) => setNuevoProyecto({ ...nuevoProyecto, ubicacion: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Fecha de fin (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={nuevoProyecto.fechaFin}
              onChangeText={(text) => setNuevoProyecto({ ...nuevoProyecto, fechaFin: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Cliente"
              placeholderTextColor="#999"
              value={nuevoProyecto.cliente}
              onChangeText={(text) => setNuevoProyecto({ ...nuevoProyecto, cliente: text })}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={nuevoProyecto.descripcion}
              onChangeText={(text) => setNuevoProyecto({ ...nuevoProyecto, descripcion: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={manejarAgregarProyecto}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAwareScrollView>
      </Modal>

      <BottomNav />
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FFFFFF", // Blanco como fondo principal
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#171321", // Púrpura oscuro para el título del encabezado
    marginTop: 40,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#F2F2F2", // Gris claro para las tarjetas
    padding: 16,
    marginVertical: 10,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#171321", // Púrpura oscuro para los títulos de las tarjetas
  },
  text: {
    fontSize: 16,
    color: "#333", // Gris oscuro para el texto
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
    color: "#fff",
    backgroundColor: "#171321", // Púrpura oscuro para la insignia de estado
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    minWidth: 80,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
  },
  detailsButton: {
    backgroundColor: "#2E2A3A", // Un tono más claro del púrpura para los botones
  },
  updateButton: {
    backgroundColor: "#2E2A3A",
  },
  deleteButton: {
    backgroundColor: "#2E2A3A",
  },
  addButton: {
    backgroundColor: "#171321", // Púrpura oscuro para el botón de agregar
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: "#4A4656", // Un tono aún más claro para el botón de cerrar sesión
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: 800,
  },
  modalContent: {
    backgroundColor: "#dedede", // Gris claro para el contenido modal
    padding: 20,
    borderRadius: 8,
    width: "90%",
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#171321", // Púrpura oscuro para el título modal
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F5F5F5", // Gris muy claro para los inputs
    color: "#171321", // Púrpura oscuro para el texto de los inputs
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#4A4656", // Un tono claro del púrpura para el botón de cancelar
  },
  saveButton: {
    backgroundColor: "#171321", // Púrpura oscuro para el botón de guardar
  },
});

