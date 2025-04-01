import { useState, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  FlatList,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native"
import {crearTarea,
  obtenerEstadisticasTareas,
  obtenerMiembrosProyecto,
  invitarUsuario,
  eliminarMiembro,
  verificarPermisos,
  obtenerTareasProyecto,
  finalizarProyecto,
  obtenerMaterialesProyecto,
  crearMaterial,
  actualizarStockMaterial,
  eliminarMaterial,
} from "../proyectosService"
import { auth } from "../firebaseConfig"
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"
import { Feather } from "@expo/vector-icons"
import styles from "../styles/infoStyles"

const PRIORIDADES = [
  { id: "alta", label: "Alta", color: "#FF6B6B" },
  { id: "media", label: "Media", color: "#FF9800" },
  { id: "baja", label: "Baja", color: "#4CAF50" },
]

// API Key para OpenWeatherMap
const OPENWEATHER_API_KEY = "a0f5bd80eb0721fc5a00c7d70a6ad99d"
const TIJUANA_LAT = "32.5027"
const TIJUANA_LON = "-117.0037"

export default function InfoProyectosScreen({ route, navigation }) {
  const { proyecto } = route.params
  const [activeTab, setActiveTab] = useState("resumen")
  const [modalVisible, setModalVisible] = useState(false)
  const [modalInvitarVisible, setModalInvitarVisible] = useState(false)

  const [materiales, setMateriales] = useState([])
  const [modalMaterialesVisible, setModalMaterialesVisible] = useState(false)
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: "",
    cantidad: "",
    unidad: "",
    descripcion: "",
  })
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState([])
  const [busquedaMaterial, setBusquedaMaterial] = useState("")
  const [materialesFiltrados, setMaterialesFiltrados] = useState([])

  // Modificar el estado para controlar las pestañas del modal de materiales
  const [materialTab, setMaterialTab] = useState("inventario") //

  // Estado para manejar errores de fecha
  const [fechaError, setFechaError] = useState("")

  const [emailInvitacion, setEmailInvitacion] = useState("")
  const [rolSeleccionado, setRolSeleccionado] = useState("Empleado")
  const [miembros, setMiembros] = useState([])
  const [tareas, setTareas] = useState([])
  const [busquedaMiembro, setBusquedaMiembro] = useState("")
  const [miembrosFiltrados, setMiembrosFiltrados] = useState([])
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: "",
    descripcion: "",
    asignadoA: "",
    asignadoANombre: "",
    asignadoProfileImage: "",
    fechaVencimiento: "",
    prioridad: "media",
    estado: "En Progreso",
    comentarios: [],
  })
  const [estadisticas, setEstadisticas] = useState({
    completadas: 0,
    total: 0,
    vencidas: 0,
    actualizadas: 0,
  })
  const [permisos, setPermisos] = useState({
    puedeInvitar: false,
    puedeEliminarMiembros: false,
    puedeCrearTareas: false,
    puedeFinalizarProyecto: false,
  })

  // Estados para el clima
  const [weatherData, setWeatherData] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError] = useState(null)

  useEffect(() => {
    cargarDatos()
    fetchWeatherData()
  }, [])

  useEffect(() => {
    cargarMateriales()
  }, [])

  // Filtrar materiales
  useEffect(() => {
    if (materiales.length > 0) {
      const filtrados = materiales.filter((material) =>
        material.nombre.toLowerCase().includes(busquedaMaterial.toLowerCase()),
      )
      setMaterialesFiltrados(filtrados)
    }
  }, [busquedaMaterial, materiales])

  useEffect(() => {
    if (miembros.length > 0) {
      const filtrados = miembros.filter(
        (miembro) =>
          miembro.username.toLowerCase().includes(busquedaMiembro.toLowerCase()) ||
          miembro.email.toLowerCase().includes(busquedaMiembro.toLowerCase()),
      )
      setMiembrosFiltrados(filtrados)
    }
  }, [busquedaMiembro, miembros])

  // Función para obtener datos del clima de Tijuana
  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true)
      setWeatherError(null)

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${TIJUANA_LAT}&lon=${TIJUANA_LON}&units=metric&appid=${OPENWEATHER_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error("Error al obtener datos del clima")
      }

      const data = await response.json()
      setWeatherData(data)
    } catch (error) {
      console.error("Error fetching weather data:", error)
      setWeatherError("No se pudo cargar la información del clima")
    } finally {
      setWeatherLoading(false)
    }
  }

  // Función para determinar si las condiciones climáticas son óptimas para construcción
  const isWeatherOptimalForConstruction = () => {
    if (!weatherData) return false

    const temp = weatherData.main.temp
    const windSpeed = weatherData.wind.speed
    const weatherCondition = weatherData.weather[0].main.toLowerCase()

    // Condiciones no óptimas:
    // - Temperatura < 5°C o > 35°C
    // - Viento > 30 km/h (8.33 m/s)
    // - Lluvia, tormenta, nieve
    const badConditions = ["rain", "thunderstorm", "snow", "tornado", "hurricane", "storm"]

    if (temp < 5 || temp > 35) return false
    if (windSpeed > 8.33) return false
    if (badConditions.some((condition) => weatherCondition.includes(condition))) return false

    return true
  }

  // Función para calcular el porcentaje de cumplimiento de tareas
  const calcularPorcentajeCumplimiento = () => {
    if (estadisticas.total === 0) return 0
    return Math.round((estadisticas.completadas / estadisticas.total) * 100)
  }

  const cargarDatos = async () => {
    try {
      await Promise.all([cargarEstadisticas(), cargarMiembros(), cargarTareas(), verificarPermisosUsuario()])
    } catch (error) {
      console.error("Error al cargar datos:", error)
      Alert.alert("Error", "No se pudieron cargar los datos del proyecto")
    }
  }

  const verificarPermisosUsuario = async () => {
    try {
      const [puedeInvitar, puedeEliminarMiembros, puedeCrearTareas, puedeFinalizarProyecto] = await Promise.all([
        verificarPermisos(proyecto.id, "invitar"),
        verificarPermisos(proyecto.id, "eliminar_miembro"),
        verificarPermisos(proyecto.id, "crear_tarea"),
        verificarPermisos(proyecto.id, "finalizar_proyecto"),
      ])

      setPermisos({
        puedeInvitar,
        puedeEliminarMiembros,
        puedeCrearTareas,
        puedeFinalizarProyecto,
      })
    } catch (error) {
      console.error("Error al verificar permisos:", error)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const stats = await obtenerEstadisticasTareas(proyecto.id)
      setEstadisticas(stats)
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
      throw error
    }
  }

  const cargarMiembros = async () => {
    try {
      const miembrosData = await obtenerMiembrosProyecto(proyecto.id)
      console.log("Miembros cargados:", JSON.stringify(miembrosData, null, 2))
      setMiembros(miembrosData)
    } catch (error) {
      console.error("Error al cargar miembros:", error)
      throw error
    }
  }

  const cargarTareas = async () => {
    try {
      const tareasData = await obtenerTareasProyecto(proyecto.id)
      setTareas(tareasData)
    } catch (error) {
      console.error("Error al cargar tareas:", error)
      throw error
    }
  }

  // Función para cargar materiales
  const cargarMateriales = async () => {
    try {
      const materialesData = await obtenerMaterialesProyecto(proyecto.id)
      setMateriales(materialesData)
    } catch (error) {
      console.error("Error al cargar materiales:", error)
    }
  }

  // Función para crear material
  const handleCrearMaterial = async () => {
    try {
      if (!nuevoMaterial.nombre || !nuevoMaterial.cantidad || !nuevoMaterial.unidad) {
        Alert.alert("Error", "Completa los campos requeridos")
        return
      }

      await crearMaterial({
        ...nuevoMaterial,
        proyectoId: proyecto.id,
        cantidad: Number(nuevoMaterial.cantidad),
        fechaCreacion: new Date().toISOString(),
      })

      setNuevoMaterial({
        nombre: "",
        cantidad: "",
        unidad: "",
        descripcion: "",
      })

      await cargarMateriales()
      Alert.alert("Éxito", "Material agregado correctamente")
    } catch (error) {
      console.error("Error al crear material:", error)
      Alert.alert("Error", error.message)
    }
  }

  

  // Función para seleccionar material
  const seleccionarMaterial = (material) => {
    const yaSeleccionado = materialesSeleccionados.some((m) => m.id === material.id)

    if (yaSeleccionado) {
      setMaterialesSeleccionados(materialesSeleccionados.filter((m) => m.id !== material.id))
    } else {
      if (material.cantidad > 0) {
        setMaterialesSeleccionados([...materialesSeleccionados, { ...material, cantidadAsignada: 1 }])
      } else {
        Alert.alert("Sin stock", `No hay unidades disponibles de ${material.nombre}`)
      }
    }

    setBusquedaMaterial("")
  }

  const actualizarCantidadMaterial = (materialId, cantidad) => {
    const material = materiales.find((m) => m.id === materialId)

    if (cantidad > material.cantidad) {
      Alert.alert("Error", `Solo hay ${material.cantidad} unidades disponibles de ${material.nombre}`)
      return
    }

    setMaterialesSeleccionados(
      materialesSeleccionados.map((m) => (m.id === materialId ? { ...m, cantidadAsignada: cantidad } : m)),
    )
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ""

    if (fecha.includes("T")) {
      const date = new Date(fecha)
      const dia = date.getDate().toString().padStart(2, "0")
      const mes = (date.getMonth() + 1).toString().padStart(2, "0")
      const anio = date.getFullYear()
      return `${dia}-${mes}-${anio}`
    }

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

    if (cleaned.length <= 2) {
      setNuevaTarea({ ...nuevaTarea, fechaVencimiento: cleaned })
    } else if (cleaned.length <= 4) {
      const dia = cleaned.substring(0, 2)
      const mes = cleaned.substring(2)

      // Validar día y mes mientras se escribe
      if (Number.parseInt(dia) > 31) {
        setFechaError("El día no puede ser mayor a 31")
      } else if (mes.length === 2 && Number.parseInt(mes) > 12) {
        setFechaError("El mes no puede ser mayor a 12")
      }

      setNuevaTarea({
        ...nuevaTarea,
        fechaVencimiento: dia + "-" + mes,
      })
    } else {
      const dia = cleaned.substring(0, 2)
      const mes = cleaned.substring(2, 4)
      const anio = cleaned.substring(4, 8)

      // Validar la fecha completa si ya se ingresaron todos los componentes
      if (dia && mes && anio.length === 4) {
        esFechaValida(dia, mes, anio)
      }

      setNuevaTarea({
        ...nuevaTarea,
        fechaVencimiento: dia + "-" + mes + "-" + anio,
      })
    }
  }

  // Función para validar si una fecha es mayor a la fecha actual
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

    // Obtener fecha actual sin horas/minutos/segundos
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    return fecha > hoy
  }

  const esFechaMenorAFinProyecto = (fechaStr) => {
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

    const fechaTarea = new Date(anio, mes - 1, dia)

    let fechaFinProyecto

    if (proyecto.fechaFin instanceof Date) {
      fechaFinProyecto = proyecto.fechaFin
    } else if (typeof proyecto.fechaFin === "string") {
      if (proyecto.fechaFin.includes("T")) {
        fechaFinProyecto = new Date(proyecto.fechaFin)
      } else if (proyecto.fechaFin.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = proyecto.fechaFin.split("-").map(Number)
        fechaFinProyecto = new Date(year, month - 1, day)
      } else if (proyecto.fechaFin.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = proyecto.fechaFin.split("-").map(Number)
        fechaFinProyecto = new Date(year, month - 1, day)
      }
    }

    if (!fechaFinProyecto || isNaN(fechaFinProyecto.getTime())) {
      return true
    }

    return fechaTarea <= fechaFinProyecto
  }

  const handleCrearTarea = async () => {
    try {
      if (!nuevaTarea.titulo || !nuevaTarea.asignadoA || !nuevaTarea.fechaVencimiento || !nuevaTarea.prioridad) {
        Alert.alert("Error", "Completa todos los campos requeridos")
        return
      }

      // Validar formato de fecha
      if (!nuevaTarea.fechaVencimiento.match(/^\d{2}-\d{2}-\d{4}$/)) {
        setFechaError("El formato de fecha debe ser DD-MM-YYYY")
        return
      }

      const partes = nuevaTarea.fechaVencimiento.split("-")
      const dia = Number.parseInt(partes[0])
      const mes = Number.parseInt(partes[1])
      const anio = Number.parseInt(partes[2])

      // Validar que la fecha sea válida
      if (!esFechaValida(dia, mes, anio)) {
        return // El mensaje de error ya se establece en esFechaValida
      }

      if (!esFechaMayorAHoy(nuevaTarea.fechaVencimiento)) {
        setFechaError("La fecha de vencimiento debe ser posterior a la fecha actual")
        return
      }

      if (!esFechaMenorAFinProyecto(nuevaTarea.fechaVencimiento)) {
        setFechaError("La fecha de vencimiento no puede ser posterior a la fecha de fin del proyecto")
        return
      }

      let fechaVencimientoFormateada = nuevaTarea.fechaVencimiento
      if (fechaVencimientoFormateada.includes("-")) {
        const partes = fechaVencimientoFormateada.split("-")
        if (partes.length === 3) {
          fechaVencimientoFormateada = `${partes[2]}-${partes[1]}-${partes[0]}`
        }
      }

      await crearTarea({
        ...nuevaTarea,
        proyectoId: proyecto.id,
        fechaEstimadaFinalizacion: fechaVencimientoFormateada,
        materiales: materialesSeleccionados.map((m) => ({
          id: m.id,
          nombre: m.nombre,
          cantidad: m.cantidadAsignada,
        })),
      })

      for (const material of materialesSeleccionados) {
        await actualizarStockMaterial(proyecto.id, material.id, material.cantidad - material.cantidadAsignada)
      }

      setModalVisible(false)
      setNuevaTarea({
        titulo: "",
        descripcion: "",
        asignadoA: "",
        asignadoANombre: "",
        asignadoProfileImage: "",
        fechaVencimiento: "",
        prioridad: "media",
        estado: "En Progreso",
        comentarios: [],
      })
      setMaterialesSeleccionados([])
      setFechaError("")

      await cargarDatos()
      await cargarMateriales()
      Alert.alert("Éxito", "Tarea creada correctamente")
    } catch (error) {
      console.error("Error al crear tarea:", error)
      Alert.alert("Error", error.message)
    }
  }

  const handleInvitarMiembro = async () => {
    try {
      if (!emailInvitacion) {
        Alert.alert("Error", "Por favor ingresa un correo electrónico")
        return
      }

      await invitarUsuario(proyecto.id, emailInvitacion, rolSeleccionado)
      setModalInvitarVisible(false)
      setEmailInvitacion("")
      setRolSeleccionado("Empleado")
      await cargarMiembros()
      Alert.alert("Éxito", "Invitación enviada correctamente")
    } catch (error) {
      console.error("Error al invitar miembro:", error)
      Alert.alert("Error", error.message)
    }
  }

  const handleEliminarMiembro = async (miembroId) => {
    try {
      await eliminarMiembro(proyecto.id, miembroId)
      await cargarMiembros()
      Alert.alert("Éxito", "Miembro eliminado correctamente")
    } catch (error) {
      console.error("Error al eliminar miembro:", error)
      Alert.alert("Error", error.message)
    }
  }

  const handleFinalizarProyecto = async () => {
    try {
      Alert.alert(
        "Finalizar Proyecto",
        "¿Estás seguro que deseas finalizar este proyecto? Esta acción no se puede deshacer.",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Finalizar",
            style: "destructive",
            onPress: async () => {
              try {
                await finalizarProyecto(proyecto.id)
                await cargarDatos()
                Alert.alert("Éxito", "El proyecto ha sido finalizado")
                navigation.goBack()
              } catch (error) {
                console.error("Error al finalizar proyecto:", error)
                Alert.alert("Error", error.message)
              }
            },
          },
        ],
      )
    } catch (error) {
      console.error("Error al finalizar proyecto:", error)
      Alert.alert("Error", error.message)
    }
  }

  const seleccionarMiembro = (miembro) => {
    setNuevaTarea({
      ...nuevaTarea,
      asignadoA: miembro.userId,
      asignadoANombre: miembro.username,
      asignadoProfileImage: miembro.profileImage,
    })
    setBusquedaMiembro("")
  }

  // Agrupar miembros por rol
  const miembrosAgrupados = () => {
    const gerentes = miembros.filter((m) => m.rol === "Gerente")
    const supervisores = miembros.filter((m) => m.rol === "Supervisor")
    const empleados = miembros.filter((m) => m.rol === "Empleado")

    return [...gerentes, ...supervisores, ...empleados]
  }

  const CompletionPercentage = () => {
   
  }

  // Componente para mostrar el clima
  const WeatherInfo = () => {
    if (weatherLoading) {
      return (
        <View style={styles.weatherCard}>
          <ActivityIndicator size="small" color="#1E5F74" />
          <Text style={styles.weatherLoadingText}>Cargando información del clima...</Text>
        </View>
      )
    }

    if (weatherError) {
      return (
        <View style={styles.weatherCard}>
          <Feather name="alert-circle" size={24} color="#FF6B6B" />
          <Text style={styles.weatherErrorText}>{weatherError}</Text>
        </View>
      )
    }

    if (!weatherData) return null

    const isOptimal = isWeatherOptimalForConstruction()
    const weatherIcon = weatherData.weather[0].icon
    const iconUrl = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`

    return (
      <View style={styles.weatherCard}>
        <View style={styles.weatherHeader}>
          <Text style={styles.weatherTitle}>Clima en Tijuana</Text>
          <Image source={{ uri: iconUrl }} style={styles.weatherIcon} />
        </View>

        <View style={styles.weatherDetails}>
          <View style={styles.weatherDetail}>
            <Feather name="thermometer" size={18} color="#1E5F74" />
            <Text style={styles.weatherDetailText}>{Math.round(weatherData.main.temp)}°C</Text>
          </View>

          <View style={styles.weatherDetail}>
            <Feather name="wind" size={18} color="#1E5F74" />
            <Text style={styles.weatherDetailText}>{Math.round(weatherData.wind.speed * 3.6)} km/h</Text>
          </View>

          <View style={styles.weatherDetail}>
            <Feather name="droplet" size={18} color="#1E5F74" />
            <Text style={styles.weatherDetailText}>{weatherData.main.humidity}%</Text>
          </View>
        </View>

        <View style={[styles.constructionStatus, { backgroundColor: isOptimal ? "#1E5F74" : "#FF6B6B" }]}>
          <Feather name={isOptimal ? "check-circle" : "alert-triangle"} size={18} color="#FFFFFF" />
          <Text style={styles.constructionStatusText}>
            {isOptimal ? "Condiciones óptimas para construcción" : "Condiciones no óptimas para construcción"}
          </Text>
        </View>
      </View>
    )
  }

  const ResumenContent = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{estadisticas.completadas}</Text>
          <Text style={styles.statsLabel}>Tareas Completadas</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{estadisticas.total}</Text>
          <Text style={styles.statsLabel}>Tareas Totales</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{estadisticas.vencidas}</Text>
          <Text style={styles.statsLabel}>Tareas Vencidas</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.statsNumber}>{calcularPorcentajeCumplimiento()}%</Text>
          <Text style={styles.statsLabel}>De cumplimiento</Text>
        </View>
      </View>

      <CompletionPercentage />

      {permisos.puedeCrearTareas && (
        <TouchableOpacity style={styles.addTaskButton} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addTaskButtonText}>Nueva Tarea</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.viewTasksButton}
        onPress={() =>
          navigation.navigate("ListaTareas", {
            proyecto,
            userRole: miembros.find((m) => m.userId === auth.currentUser?.uid)?.rol,
          })
        }
      >
        <Feather name="list" size={18} color="#fff" />
        <Text style={styles.viewTasksButtonText}>Ver Tareas</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.materialsButton} onPress={() => setModalMaterialesVisible(true)}>
        <Text style={styles.materialsButtonText}>Administrar Materiales</Text>
      </TouchableOpacity>

      <WeatherInfo />
    </View>
  )

  const InformacionContent = () => (
    <View style={styles.content}>
      <View style={styles.infoCard}>
        <View style={styles.detailRow}>
          <Feather name="user" size={18} color="#1E5F74" />
          <Text style={styles.detailLabel}>Cliente:</Text>
          <Text style={styles.detailText}>{proyecto.cliente}</Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="map-pin" size={18} color="#1E5F74" />
          <Text style={styles.detailLabel}>Ubicación:</Text>
          <Text style={styles.detailText}>{proyecto.ubicacion}</Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="calendar" size={18} color="#1E5F74" />
          <Text style={styles.detailLabel}>Fecha de inicio:</Text>
          <Text style={styles.detailText}>{formatearFecha(proyecto.fechaInicio)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="calendar" size={18} color="#1E5F74" />
          <Text style={styles.detailLabel}>Fecha de fin:</Text>
          <Text style={styles.detailText}>{formatearFecha(proyecto.fechaFin)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="flag" size={18} color="#1E5F74" />
          <Text style={styles.detailLabel}>Estado:</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: proyecto.estado === "Finalizado" ? "#4CAF50" : "#FF9800" }]}
          >
            <Text style={styles.statusText}>{proyecto.estado}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Feather name="briefcase" size={18} color="#1E5F74" />
          <Text style={styles.detailLabel}>Gerente:</Text>
          <Text style={styles.detailText}>{proyecto.gerenteUsername}</Text>
        </View>
      </View>

      <View style={styles.descriptionCard}>
        <Text style={styles.descriptionLabel}>
          <Feather name="file-text" size={18} color="#1E5F74" /> Descripción:
        </Text>
        <Text style={styles.descriptionText}>{proyecto.descripcion}</Text>
      </View>

      {permisos.puedeFinalizarProyecto && proyecto.estado !== "Finalizado" && (
        <TouchableOpacity style={styles.finalizarButton} onPress={handleFinalizarProyecto}>
          <Feather name="check-circle" size={18} color="#fff" />
          <Text style={styles.finalizarButtonText}>Finalizar Proyecto</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const PersonalContent = () => {
    const miembrosOrdenados = miembrosAgrupados()
    const roles = ["Gerente", "Supervisor", "Empleado"]

    return (
      <View style={styles.content}>
        <View style={styles.personalHeader}>
          <Text style={styles.personalTitle}>Miembros del Proyecto</Text>
          {permisos.puedeInvitar && (
            <TouchableOpacity style={styles.inviteButton} onPress={() => setModalInvitarVisible(true)}>
              <Feather name="user-plus" size={16} color="#fff" />
              <Text style={styles.inviteButtonText}>Invitar</Text>
            </TouchableOpacity>
          )}
        </View>

        {roles.map((rol) => {
          const miembrosDelRol = miembrosOrdenados.filter((m) => m.rol === rol)
          if (miembrosDelRol.length === 0) return null

          return (
            <View key={rol} style={styles.rolSection}>
              <Text style={styles.rolTitle}>{rol}s</Text>

              {miembrosDelRol.map((miembro) => (
                <View key={miembro.id} style={styles.miembroCard}>
                  <View style={styles.miembroInfo}>
                    <View style={styles.miembroAvatar}>
                      {miembro.profileImage ? (
                        <Image
                          source={{ uri: miembro.profileImage }}
                          style={styles.miembroProfileImage}
                          resizeMode="cover"
                          onError={(e) =>
                            console.log("Error cargando imagen:", e.nativeEvent.error, miembro.profileImage)
                          }
                        />
                      ) : (
                        <Text style={styles.miembroAvatarText}>{miembro.username.charAt(0).toUpperCase()}</Text>
                      )}
                    </View>
                    <View style={styles.miembroDetails}>
                      <Text style={styles.miembroNombre}>{miembro.username}</Text>
                      <Text style={styles.miembroEmail}>{miembro.email}</Text>
                    </View>
                  </View>

                  {permisos.puedeEliminarMiembros && miembro.userId !== auth.currentUser?.uid && (
                    <TouchableOpacity style={styles.eliminarButton} onPress={() => handleEliminarMiembro(miembro.id)}>
                      <Feather name="trash-2" size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E5F74" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{proyecto.nombre}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "resumen" && styles.activeTab]}
          onPress={() => setActiveTab("resumen")}
        >
          <Text style={[styles.tabText, activeTab === "resumen" && styles.activeTabText]}>Resumen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "informacion" && styles.activeTab]}
          onPress={() => setActiveTab("informacion")}
        >
          <Text style={[styles.tabText, activeTab === "informacion" && styles.activeTabText]}>Información</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "personal" && styles.activeTab]}
          onPress={() => setActiveTab("personal")}
        >
          <Text style={[styles.tabText, activeTab === "personal" && styles.activeTabText]}>Personal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {activeTab === "resumen" && <ResumenContent />}
        {activeTab === "informacion" && <InformacionContent />}
        {activeTab === "personal" && <PersonalContent />}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.modalContent}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Tarea</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Título de la tarea</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Instalación de ventanas"
                placeholderTextColor="#999"
                value={nuevaTarea.titulo}
                onChangeText={(text) => setNuevaTarea({ ...nuevaTarea, titulo: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe los detalles de la tarea..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={nuevaTarea.descripcion}
                onChangeText={(text) => setNuevaTarea({ ...nuevaTarea, descripcion: text })}
              />
            </View>

            {/* Asignar Miembro */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Asignar a:</Text>
              {nuevaTarea.asignadoANombre ? (
                <View style={styles.selectedMemberContainer}>
                  <View style={styles.selectedMemberAvatar}>
                    {nuevaTarea.asignadoProfileImage ? (
                      <Image
                        source={{ uri: nuevaTarea.asignadoProfileImage }}
                        style={styles.selectedMemberProfileImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.selectedMemberAvatarText}>
                        {nuevaTarea.asignadoANombre.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.selectedMemberText}>{nuevaTarea.asignadoANombre}</Text>
                  <TouchableOpacity
                    style={styles.removeMemberButton}
                    onPress={() =>
                      setNuevaTarea({
                        ...nuevaTarea,
                        asignadoA: "",
                        asignadoANombre: "",
                        asignadoProfileImage: "",
                      })
                    }
                  >
                    <Feather name="x" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Buscar miembro..."
                    placeholderTextColor="#999"
                    value={busquedaMiembro}
                    onChangeText={setBusquedaMiembro}
                  />
                  {busquedaMiembro.length > 0 && (
                    <FlatList
                      data={miembrosFiltrados}
                      keyExtractor={(item) => item.id}
                      style={styles.searchResults}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={styles.searchResultItem} onPress={() => seleccionarMiembro(item)}>
                          <View style={styles.searchResultAvatar}>
                            {item.profileImage ? (
                              <Image
                                source={{ uri: item.profileImage }}
                                style={styles.searchResultProfileImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <Text style={styles.searchResultAvatarText}>{item.username.charAt(0).toUpperCase()}</Text>
                            )}
                          </View>
                          <View style={styles.searchResultInfo}>
                            <Text style={styles.searchResultText}>{item.username}</Text>
                            <Text style={styles.searchResultSubtext}>{item.rol}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    />
                  )}
                </>
              )}
            </View>

            {/* Prioridad */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prioridad:</Text>
              <View style={styles.prioridadContainer}>
                {PRIORIDADES.map((prioridad) => (
                  <TouchableOpacity
                    key={prioridad.id}
                    style={[
                      styles.prioridadOption,
                      {
                        backgroundColor: nuevaTarea.prioridad === prioridad.id ? prioridad.color : "#F9F9F9",
                        borderColor: prioridad.color,
                      },
                    ]}
                    onPress={() => setNuevaTarea({ ...nuevaTarea, prioridad: prioridad.id })}
                  >
                    <Text
                      style={[
                        styles.prioridadText,
                        {
                          color: nuevaTarea.prioridad === prioridad.id ? "#fff" : prioridad.color,
                        },
                      ]}
                    >
                      {prioridad.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fecha */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fecha de vencimiento (DD-MM-YYYY):</Text>
              <TextInput
                style={[styles.input, fechaError ? styles.inputError : null]}
                placeholder="DD-MM-YYYY"
                placeholderTextColor="#999"
                value={nuevaTarea.fechaVencimiento}
                onChangeText={handleFechaInput}
                keyboardType="numeric"
                maxLength={10}
              />
              {fechaError ? (
                <Text style={styles.errorText}>{fechaError}</Text>
              ) : (
                <Text style={styles.helperText}>
                  La fecha no puede ser posterior a la fecha de fin del proyecto: {formatearFecha(proyecto.fechaFin)}
                </Text>
              )}
            </View>

            {/* Materiales */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Materiales necesarios:</Text>
              {materialesSeleccionados.length > 0 ? (
                <View style={styles.selectedMaterialsContainer}>
                  {materialesSeleccionados.map((material) => (
                    <View key={material.id} style={styles.selectedMaterialItem}>
                      <View style={styles.selectedMaterialInfo}>
                        <Text style={styles.selectedMaterialName}>{material.nombre}</Text>
                        <Text style={styles.selectedMaterialStock}>
                          Disponible: {material.cantidad} {material.unidad}
                        </Text>
                      </View>
                      <View style={styles.selectedMaterialQuantity}>
                        <TextInput
                          style={styles.quantityInput}
                          value={material.cantidadAsignada.toString()}
                          onChangeText={(text) => {
                            const cantidad = Number.parseInt(text) || 0
                            actualizarCantidadMaterial(material.id, cantidad)
                          }}
                          keyboardType="numeric"
                        />
                        <Text style={styles.quantityUnit}>{material.unidad}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeMaterialButton}
                        onPress={() => seleccionarMaterial(material)}
                      >
                        <Feather name="x" size={18} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noMaterialsText}>No hay materiales seleccionados</Text>
              )}

              <View style={styles.searchMaterialContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Buscar material..."
                  placeholderTextColor="#999"
                  value={busquedaMaterial}
                  onChangeText={setBusquedaMaterial}
                />
                {busquedaMaterial.length > 0 && (
                  <FlatList
                    data={materialesFiltrados}
                    keyExtractor={(item) => item.id}
                    style={styles.searchResults}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.searchResultItem, item.cantidad <= 0 && styles.outOfStockItem]}
                        onPress={() => seleccionarMaterial(item)}
                        disabled={item.cantidad <= 0}
                      >
                        <View style={styles.searchResultInfo}>
                          <Text style={styles.searchResultText}>{item.nombre}</Text>
                          <Text style={styles.searchResultSubtext}>
                            {item.cantidad} {item.unidad} disponibles
                          </Text>
                        </View>
                        {materialesSeleccionados.some((m) => m.id === item.id) && (
                          <Feather name="check" size={18} color="#4CAF50" />
                        )}
                        {item.cantidad <= 0 && <Text style={styles.outOfStockText}>Sin stock</Text>}
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            </View>

            {/* Botones */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false)
                  setNuevaTarea({
                    titulo: "",
                    descripcion: "",
                    asignadoA: "",
                    asignadoANombre: "",
                    asignadoProfileImage: "",
                    fechaVencimiento: "",
                    prioridad: "media",
                    estado: "En Progreso",
                    comentarios: [],
                  })
                  setBusquedaMiembro("")
                  setMaterialesSeleccionados([])
                  setFechaError("")
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleCrearTarea}>
                <Text style={styles.saveButtonText}>Guardar Tarea</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>

      {/* Modal para invitar miembro */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalInvitarVisible}
        onRequestClose={() => setModalInvitarVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invitar Miembro</Text>
              <TouchableOpacity onPress={() => setModalInvitarVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#999"
                value={emailInvitacion}
                onChangeText={setEmailInvitacion}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Rol:</Text>
              <View style={styles.rolSelector}>
                {(permisos.puedeInvitar && !permisos.puedeEliminarMiembros
                  ? ["Empleado"] // Si es Supervisor, solo puede invitar Empleados
                  : ["Empleado", "Supervisor", "Gerente"]
                ) // Si es Gerente, puede invitar todos los roles
                  .map((rol) => (
                    <TouchableOpacity
                      key={rol}
                      style={[styles.rolOption, rolSeleccionado === rol && styles.rolOptionSelected]}
                      onPress={() => setRolSeleccionado(rol)}
                    >
                      <Text style={[styles.rolOptionText, rolSeleccionado === rol && styles.rolOptionTextSelected]}>
                        {rol}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalInvitarVisible(false)
                  setRolSeleccionado("Empleado")
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleInvitarMiembro}>
                <Text style={styles.saveButtonText}>Invitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para administrar materiales */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalMaterialesVisible}
        onRequestClose={() => setModalMaterialesVisible(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.modalContent}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Administrar Materiales</Text>
              <TouchableOpacity onPress={() => setModalMaterialesVisible(false)}>
                <Feather name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.materialsTabContainer}>
              <TouchableOpacity
                style={[
                  styles.materialsTab,
                  materialTab === "inventario" ? { backgroundColor: "#1E5F74" } : { backgroundColor: "#F0F0F0" },
                ]}
                onPress={() => setMaterialTab("inventario")}
              >
                <Text
                  style={[
                    styles.materialsTabText,
                    materialTab === "inventario" ? { color: "#FFFFFF" } : { color: "#333" },
                  ]}
                >
                  Inventario
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.materialsTab,
                  materialTab === "material" ? { backgroundColor: "#1E5F74" } : { backgroundColor: "#F0F0F0" },
                ]}
                onPress={() => setMaterialTab("material")}
              >
                <Text
                  style={[
                    styles.materialsTabText,
                    materialTab === "material" ? { color: "#FFFFFF" } : { color: "#333" },
                  ]}
                >
                  Material
                </Text>
              </TouchableOpacity>
            </View>

            {materialTab === "inventario" ? (
              // Sección de Inventario mejorada
              <View style={styles.inventarioSection}>
                <View style={styles.searchContainer}>
                  <Feather name="search" size={18} color="#666" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar material..."
                    placeholderTextColor="#999"
                    value={busquedaMaterial}
                    onChangeText={setBusquedaMaterial}
                  />
                </View>

                <ScrollView style={styles.materialsList}>
                  {materiales.length > 0 ? (
                    materiales
                      .filter(
                        (material) =>
                          busquedaMaterial === "" ||
                          material.nombre.toLowerCase().includes(busquedaMaterial.toLowerCase()),
                      )
                      .map((material) => (
                        <View key={material.id} style={styles.materialItemCard}>
                          <View style={styles.materialInfo}>
                            <Text style={styles.materialName}>{material.nombre}</Text>
                            <Text style={styles.materialDescription}>{material.descripcion}</Text>
                          </View>
                          <View style={styles.materialActions}>
                            <View style={styles.materialStock}>
                              <Text style={styles.materialQuantity}>
                                {material.cantidad} {material.unidad}
                              </Text>
                            </View>
                            
                          </View>
                        </View>
                      ))
                  ) : (
                    <View style={styles.emptyMaterialsContainer}>
                      <Feather name="package" size={50} color="#BBBBBB" />
                      <Text style={styles.emptyMaterialsText}>No hay materiales registrados</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            ) : (
              // Sección de Material (Agregar nuevo)
              <View style={styles.addMaterialForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nombre del material</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Cemento, Ladrillos, etc."
                    placeholderTextColor="#999"
                    value={nuevoMaterial.nombre}
                    onChangeText={(text) => setNuevoMaterial({ ...nuevoMaterial, nombre: text })}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Cantidad</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: 100"
                      placeholderTextColor="#999"
                      value={nuevoMaterial.cantidad}
                      onChangeText={(text) => setNuevoMaterial({ ...nuevoMaterial, cantidad: text })}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.inputLabel}>Unidad</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: kg, m², unidades"
                      placeholderTextColor="#999"
                      value={nuevoMaterial.unidad}
                      onChangeText={(text) => setNuevoMaterial({ ...nuevoMaterial, unidad: text })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descripción (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe el material..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                    value={nuevoMaterial.descripcion}
                    onChangeText={(text) => setNuevoMaterial({ ...nuevoMaterial, descripcion: text })}
                  />
                </View>

                <TouchableOpacity style={styles.addMaterialButton} onPress={handleCrearMaterial}>
                  <Feather name="plus" size={18} color="#fff" />
                  <Text style={styles.addMaterialButtonText}>Agregar Material</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, { flex: 1 }]}
                onPress={() => setModalMaterialesVisible(false)}
              >
                <Text style={styles.saveButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>
    </View>
  )
}

