import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, StatusBar } from "react-native"
import { signOut } from "@firebase/auth"
import { auth } from "../firebaseConfig"
import BottomNav from "../assets/BottomNav"
import { useEffect, useState } from "react"
import { crearProyecto, obtenerProyectos, actualizarProyecto, eliminarProyecto } from "../proyectosService"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { Feather, FontAwesome5 } from "@expo/vector-icons"
import styles from "../styles/homeStyles"

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

  // Estado para manejar errores de fecha
  const [fechaError, setFechaError] = useState("")

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

  const formatearFecha = (fecha) => {
    if (!fecha) return ""
    const partes = fecha.split("-")
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1]}-${partes[0]}`
    }
    return fecha
  }

  // Función para validar si un año es bisiesto
  const esBisiesto = (anio) => {
    return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0
  }

  // Función para obtener el número máximo de días en un mes
  const diasEnMes = (mes, anio) => {
    mes = Number.parseInt(mes)
    anio = Number.parseInt(anio)

    if (mes === 2) {
      return esBisiesto(anio) ? 29 : 28
    }

    // Meses con 30 días: Abril (4), Junio (6), Septiembre (9) y Noviembre (11)
    if ([4, 6, 9, 11].includes(mes)) {
      return 30
    }

    // El resto de meses tienen 31 días
    return 31
  }

  // Función para validar si una fecha es válida
  const esFechaValida = (dia, mes, anio) => {
    dia = Number.parseInt(dia)
    mes = Number.parseInt(mes)
    anio = Number.parseInt(anio)

    // Validar rangos básicos
    if (mes < 1 || mes > 12) {
      setFechaError("El mes debe estar entre 1 y 12")
      return false
    }

    const maxDias = diasEnMes(mes, anio)
    if (dia < 1 || dia > maxDias) {
      setFechaError(`El mes ${mes} solo tiene ${maxDias} días`)
      return false
    }

    return true
  }

  const handleFechaInput = (text) => {
    const cleaned = text.replace(/[^0-9]/g, "")
    setFechaError("")

    // Aplicar formato automático
    if (cleaned.length <= 2) {
      setNuevoProyecto({ ...nuevoProyecto, fechaFin: cleaned })
    } else if (cleaned.length <= 4) {
      const dia = cleaned.substring(0, 2)
      const mes = cleaned.substring(2)

      // Validar día y mes mientras se escribe
      if (Number.parseInt(dia) > 31) {
        setFechaError("El día no puede ser mayor a 31")
      } else if (mes.length === 2 && Number.parseInt(mes) > 12) {
        setFechaError("El mes no puede ser mayor a 12")
      }

      setNuevoProyecto({
        ...nuevoProyecto,
        fechaFin: dia + "-" + mes,
      })
    } else {
      const dia = cleaned.substring(0, 2)
      const mes = cleaned.substring(2, 4)
      const anio = cleaned.substring(4, 8)

      // Validar la fecha completa si ya se ingresaron todos los componentes
      if (dia && mes && anio.length === 4) {
        esFechaValida(dia, mes, anio)
      }

      setNuevoProyecto({
        ...nuevoProyecto,
        fechaFin: dia + "-" + mes + "-" + anio,
      })
    }
  }

  const esFechaMayorAHoy = (fechaStr) => {
    if (!fechaStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return false
    }

    const partes = fechaStr.split("-")
    const dia = Number.parseInt(partes[0])
    const mes = Number.parseInt(partes[1])
    const anio = Number.parseInt(partes[2])

    // Validar que la fecha sea válida antes de compararla
    if (!esFechaValida(dia, mes, anio)) {
      return false
    }

    const fecha = new Date(anio, mes - 1, dia)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    return fecha > hoy
  }

  const manejarAgregarProyecto = async () => {
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

    // Validar formato de fecha
    if (!nuevoProyecto.fechaFin.match(/^\d{2}-\d{2}-\d{4}$/)) {
      setFechaError("El formato de fecha debe ser DD-MM-YYYY")
      return
    }

    const partes = nuevoProyecto.fechaFin.split("-")
    const dia = Number.parseInt(partes[0])
    const mes = Number.parseInt(partes[1])
    const anio = Number.parseInt(partes[2])

    // Validar que la fecha sea válida
    if (!esFechaValida(dia, mes, anio)) {
      return // El mensaje de error ya se establece en esFechaValida
    }

    // Validar que la fecha sea mayor a hoy
    if (!esFechaMayorAHoy(nuevoProyecto.fechaFin)) {
      setFechaError("La fecha de finalización debe ser posterior a la fecha actual.")
      return
    }

    try {
      let fechaFinFormateada = nuevoProyecto.fechaFin
      if (fechaFinFormateada.includes("-")) {
        const partes = fechaFinFormateada.split("-")
        if (partes.length === 3) {
          fechaFinFormateada = `${partes[2]}-${partes[1]}-${partes[0]}`
        }
      }

      const hoy = new Date()
      const fechaInicioFormateada = `${hoy.getDate().toString().padStart(2, "0")}-${(hoy.getMonth() + 1).toString().padStart(2, "0")}-${hoy.getFullYear()}`

      const fechaInicioDB = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, "0")}-${hoy.getDate().toString().padStart(2, "0")}`

      const proyectoCompleto = {
        ...nuevoProyecto,
        fechaInicio: fechaInicioDB,
        fechaFin: fechaFinFormateada,
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
      setFechaError("")
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
      <StatusBar backgroundColor="#1E5F74" barStyle="light-content" />

      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mis Proyectos</Text>
        </View>
      </View>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Nuevo Proyecto</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {proyectos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="clipboard-list" size={60} color="#BBBBBB" />
            <Text style={styles.emptyText}>No hay proyectos disponibles</Text>
            <Text style={styles.emptySubText}>Crea tu primer proyecto usando el botón "Nuevo Proyecto"</Text>
          </View>
        ) : (
          proyectos.map((proyecto) => (
            <TouchableOpacity
              key={proyecto.id}
              style={styles.card}
              onPress={() => verDetallesProyecto(proyecto)}
              activeOpacity={0.9}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{proyecto.nombre}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: proyecto.estado === "Finalizado" ? "#4CAF50" : "#FF9800" },
                  ]}
                >
                  <Text style={styles.statusText}>{proyecto.estado}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Feather name="user" size={16} color="#1E5F74" />
                  <Text style={styles.infoText}>{proyecto.cliente}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={16} color="#1E5F74" />
                  <Text style={styles.infoText}>{proyecto.ubicacion}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Feather name="calendar" size={16} color="#1E5F74" />
                  <Text style={styles.infoText}>Finaliza: {formatearFecha(proyecto.fechaFin)}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.viewDetailsText}>Ver detalles</Text>
                <Feather name="chevron-right" size={18} color="#1E5F74" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAwareScrollView contentContainerStyle={styles.modalScrollContainer}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo Proyecto</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del proyecto</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Construcción Residencial Torres del Valle"
                  placeholderTextColor="#999"
                  value={nuevoProyecto.nombre}
                  onChangeText={(text) => setNuevoProyecto({ ...nuevoProyecto, nombre: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ubicación</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Av. Principal #123, Ciudad"
                  placeholderTextColor="#999"
                  value={nuevoProyecto.ubicacion}
                  onChangeText={(text) => setNuevoProyecto({ ...nuevoProyecto, ubicacion: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fecha de finalización (DD-MM-YYYY)</Text>
                <TextInput
                  style={[styles.input, fechaError ? styles.inputError : null]}
                  placeholder="DD-MM-YYYY"
                  placeholderTextColor="#999"
                  value={nuevoProyecto.fechaFin}
                  onChangeText={handleFechaInput}
                  keyboardType="numeric"
                  maxLength={10}
                />
                {fechaError ? (
                  <Text style={styles.errorText}>{fechaError}</Text>
                ) : (
                  <Text style={styles.helperText}>La fecha debe ser posterior a hoy</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cliente</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Inmobiliaria Moderna S.A."
                  placeholderTextColor="#999"
                  value={nuevoProyecto.cliente}
                  onChangeText={(text) => setNuevoProyecto({ ...nuevoProyecto, cliente: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe los detalles importantes del proyecto..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={nuevoProyecto.descripcion}
                  onChangeText={(text) => setNuevoProyecto({ ...nuevoProyecto, descripcion: text })}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={manejarAgregarProyecto}>
                  <Text style={styles.saveButtonText}>Guardar Proyecto</Text>
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
