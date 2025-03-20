import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import {
  crearTarea,
  obtenerEstadisticasTareas,
  obtenerMiembrosProyecto,
  invitarUsuario,
  eliminarMiembro,
  verificarPermisos,
  obtenerTareasProyecto,
  finalizarProyecto,
} from "../proyectosService";
import { auth } from "../firebaseConfig";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

const PRIORIDADES = [
  { id: "alta", label: "Alta", color: "#ff4444" },
  { id: "media", label: "Media", color: "#ff9800" },
  { id: "baja", label: "Baja", color: "#4caf50" },
];

export default function InfoProyectosScreen({ route, navigation }) {
  const { proyecto } = route.params;
  const [activeTab, setActiveTab] = useState("resumen");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalInvitarVisible, setModalInvitarVisible] = useState(false);
  const [emailInvitacion, setEmailInvitacion] = useState("");
  const [rolSeleccionado, setRolSeleccionado] = useState("Empleado");
  const [miembros, setMiembros] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [busquedaMiembro, setBusquedaMiembro] = useState("");
  const [miembrosFiltrados, setMiembrosFiltrados] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: "",
    descripcion: "",
    asignadoA: "",
    asignadoANombre: "",
    fechaVencimiento: "",
    prioridad: "media",
    estado: "Pendiente",
    comentarios: [],
  });
  const [estadisticas, setEstadisticas] = useState({
    completadas: 0,
    total: 0,
    vencidas: 0,
    actualizadas: 0,
  });
  const [permisos, setPermisos] = useState({
    puedeInvitar: false,
    puedeEliminarMiembros: false,
    puedeCrearTareas: false,
    puedeFinalizarProyecto: false,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (miembros.length > 0) {
      const filtrados = miembros.filter(miembro =>
        miembro.username.toLowerCase().includes(busquedaMiembro.toLowerCase()) ||
        miembro.email.toLowerCase().includes(busquedaMiembro.toLowerCase())
      );
      setMiembrosFiltrados(filtrados);
    }
  }, [busquedaMiembro, miembros]);

  const cargarDatos = async () => {
    try {
      await Promise.all([
        cargarEstadisticas(),
        cargarMiembros(),
        cargarTareas(),
        verificarPermisosUsuario(),
      ]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del proyecto");
    }
  };

  const verificarPermisosUsuario = async () => {
    try {
      const [puedeInvitar, puedeEliminarMiembros, puedeCrearTareas, puedeFinalizarProyecto] =
        await Promise.all([
          verificarPermisos(proyecto.id, "invitar"),
          verificarPermisos(proyecto.id, "eliminar_miembro"),
          verificarPermisos(proyecto.id, "crear_tarea"),
          verificarPermisos(proyecto.id, "finalizar_proyecto"),
        ]);

      setPermisos({
        puedeInvitar,
        puedeEliminarMiembros,
        puedeCrearTareas,
        puedeFinalizarProyecto,
      });
    } catch (error) {
      console.error("Error al verificar permisos:", error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const stats = await obtenerEstadisticasTareas(proyecto.id);
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      throw error;
    }
  };

  const cargarMiembros = async () => {
    try {
      const miembrosData = await obtenerMiembrosProyecto(proyecto.id);
      setMiembros(miembrosData);
    } catch (error) {
      console.error("Error al cargar miembros:", error);
      throw error;
    }
  };

  const cargarTareas = async () => {
    try {
      const tareasData = await obtenerTareasProyecto(proyecto.id);
      setTareas(tareasData);
    } catch (error) {
      console.error("Error al cargar tareas:", error);
      throw error;
    }
  };

  const handleCrearTarea = async () => {
    try {
      if (!nuevaTarea.titulo || !nuevaTarea.asignadoA || !nuevaTarea.fechaVencimiento || !nuevaTarea.prioridad) {
        Alert.alert("Error", "Completa todos los campos requeridos");
        return;
      }

      // Validar formato de fecha
      const fechaVencimiento = new Date(nuevaTarea.fechaVencimiento);
      if (isNaN(fechaVencimiento.getTime())) {
        Alert.alert("Error", "La fecha de vencimiento no es válida");
        return;
      }

      await crearTarea({
        ...nuevaTarea,
        proyectoId: proyecto.id,
        fechaEstimadaFinalizacion: nuevaTarea.fechaVencimiento,
      });

      setModalVisible(false);
      setNuevaTarea({
        titulo: "",
        descripcion: "",
        asignadoA: "",
        asignadoANombre: "",
        fechaVencimiento: "",
        prioridad: "media",
        estado: "Pendiente",
        comentarios: [],
      });

      await cargarDatos();
      Alert.alert("Éxito", "Tarea creada correctamente");
    } catch (error) {
      console.error("Error al crear tarea:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleInvitarMiembro = async () => {
    try {
      if (!emailInvitacion) {
        Alert.alert("Error", "Por favor ingresa un correo electrónico");
        return;
      }

      await invitarUsuario(proyecto.id, emailInvitacion, rolSeleccionado);
      setModalInvitarVisible(false);
      setEmailInvitacion("");
      setRolSeleccionado("Empleado");
      await cargarMiembros();
      Alert.alert("Éxito", "Invitación enviada correctamente");
    } catch (error) {
      console.error("Error al invitar miembro:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleEliminarMiembro = async (miembroId) => {
    try {
      await eliminarMiembro(proyecto.id, miembroId);
      await cargarMiembros();
      Alert.alert("Éxito", "Miembro eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar miembro:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleFinalizarProyecto = async () => {
    try {
      Alert.alert(
        "Finalizar Proyecto",
        "¿Estás seguro que deseas finalizar este proyecto? Esta acción no se puede deshacer.",
        [
          {
            text: "Cancelar",
            style: "cancel"
          },
          {
            text: "Finalizar",
            style: "destructive",
            onPress: async () => {
              try {
                await finalizarProyecto(proyecto.id);
                await cargarDatos();
                Alert.alert("Éxito", "El proyecto ha sido finalizado");
                navigation.goBack();
              } catch (error) {
                console.error("Error al finalizar proyecto:", error);
                Alert.alert("Error", error.message);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error al finalizar proyecto:", error);
      Alert.alert("Error", error.message);
    }
  };

  const seleccionarMiembro = (miembro) => {
    setNuevaTarea({
      ...nuevaTarea,
      asignadoA: miembro.userId,
      asignadoANombre: miembro.username,
    });
    setBusquedaMiembro("");
  };

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
          <Text style={styles.statsNumber}>{estadisticas.actualizadas}</Text>
          <Text style={styles.statsLabel}>En Progreso</Text>
        </View>
      </View>

      {permisos.puedeCrearTareas && (
        <TouchableOpacity
          style={styles.addTaskButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addTaskButtonText}>+ Nueva Tarea</Text>
          
        </TouchableOpacity>
        
      )}
       <TouchableOpacity
        style={[styles.addTaskButton, { marginTop: 12 }]}
        onPress={() => navigation.navigate('ListaTareas', { 
          proyecto,
          userRole: miembros.find(m => m.userId === auth.currentUser?.uid)?.rol
        })}
      >
        <Text style={styles.addTaskButtonText}>Ver Tareas</Text>
      </TouchableOpacity>
    </View>
    
    
  );

  const InformacionContent = () => (
    <View style={styles.content}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Cliente:</Text>
        <Text style={styles.detailText}>{proyecto.cliente}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Ubicación:</Text>
        <Text style={styles.detailText}>{proyecto.ubicacion}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Fecha de inicio:</Text>
        <Text style={styles.detailText}>{proyecto.fechaInicio}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Fecha de fin:</Text>
        <Text style={styles.detailText}>{proyecto.fechaFin}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Estado:</Text>
        <Text
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                proyecto.estado === "Finalizado" ? "#4caf50" : "#ff9800",
            },
          ]}
        >
          {proyecto.estado}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Gerente:</Text>
        <Text style={styles.detailText}>{proyecto.gerenteUsername}</Text>
      </View>
      <View style={styles.descriptionRow}>
        <Text style={styles.detailLabel}>Descripción:</Text>
        <Text style={styles.detailText}>{proyecto.descripcion}</Text>
      </View>

      {permisos.puedeFinalizarProyecto && proyecto.estado !== "Finalizado" && (
        <TouchableOpacity
          style={styles.finalizarButton}
          onPress={handleFinalizarProyecto}
        >
          <Text style={styles.finalizarButtonText}>Finalizar Proyecto</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const PersonalContent = () => (
    <View style={styles.content}>
      <View style={styles.personalHeader}>
        <Text style={styles.personalTitle}>Miembros del Proyecto</Text>
        {permisos.puedeInvitar && (
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setModalInvitarVisible(true)}
          >
            <Text style={styles.inviteButtonText}>+ Invitar</Text>
          </TouchableOpacity>
        )}
      </View>

      {miembros.map((miembro) => (
        <View key={miembro.id} style={styles.miembroCard}>
          <View style={styles.miembroInfo}>
            <Text style={styles.miembroNombre}>{miembro.username}</Text>
            <Text style={styles.miembroRol}>{miembro.rol}</Text>
          </View>
          {permisos.puedeEliminarMiembros &&
            miembro.userId !== auth.currentUser?.uid && (
              <TouchableOpacity
                style={styles.eliminarButton}
                onPress={() => handleEliminarMiembro(miembro.id)}
              >
                <Text style={styles.eliminarButtonText}>Eliminar</Text>
              </TouchableOpacity>
            )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{proyecto.nombre}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "resumen" && styles.activeTab]}
          onPress={() => setActiveTab("resumen")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "resumen" && styles.activeTabText,
            ]}
          >
            Resumen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "informacion" && styles.activeTab]}
          onPress={() => setActiveTab("informacion")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "informacion" && styles.activeTabText,
            ]}
          >
            Información
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "personal" && styles.activeTab]}
          onPress={() => setActiveTab("personal")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "personal" && styles.activeTabText,
            ]}
          >
            Personal
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        {activeTab === "resumen" && <ResumenContent />}
        {activeTab === "informacion" && <InformacionContent />}
        {activeTab === "personal" && <PersonalContent />}
      </ScrollView>

      {/* Modal para crear nueva tarea */}
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
      <Text style={styles.modalTitle}>Nueva Tarea</Text>

      <TextInput
        style={styles.input}
        placeholder="Título de la tarea"
        placeholderTextColor="#999"
        value={nuevaTarea.titulo}
        onChangeText={(text) =>
          setNuevaTarea({ ...nuevaTarea, titulo: text })
        }
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descripción"
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        value={nuevaTarea.descripcion}
        onChangeText={(text) =>
          setNuevaTarea({ ...nuevaTarea, descripcion: text })
        }
      />

      {/* Asignar Miembro */}
      <View style={styles.asignarContainer}>
        <Text style={styles.inputLabel}>Asignar a:</Text>
        {nuevaTarea.asignadoANombre ? (
          <View style={styles.selectedMemberContainer}>
            <Text style={styles.selectedMemberText}>
              {nuevaTarea.asignadoANombre}
            </Text>
            <TouchableOpacity
              onPress={() => setNuevaTarea({
                ...nuevaTarea,
                asignadoA: "",
                asignadoANombre: ""
              })}
            >
              <Text style={styles.removeMemberText}>×</Text>
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
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResultItem}
                    onPress={() => seleccionarMiembro(item)}
                  >
                    <Text style={styles.searchResultText}>
                      {item.username}
                    </Text>
                    <Text style={styles.searchResultSubtext}>
                      {item.rol}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}
      </View>

      {/* Prioridad */}
      <Text style={styles.inputLabel}>Prioridad:</Text>
      <View style={styles.prioridadContainer}>
        {PRIORIDADES.map((prioridad) => (
          <TouchableOpacity
            key={prioridad.id}
            style={[
              styles.prioridadOption,
              {
                backgroundColor:
                  nuevaTarea.prioridad === prioridad.id
                    ? prioridad.color
                    : "#fff",
              },
            ]}
            onPress={() =>
              setNuevaTarea({ ...nuevaTarea, prioridad: prioridad.id })
            }
          >
            <Text style={styles.prioridadText}>{prioridad.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fecha */}
      <Text style={styles.inputLabel}>Fecha de vencimiento:</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#999"
        value={nuevaTarea.fechaVencimiento}
        onChangeText={(text) =>
          setNuevaTarea({ ...nuevaTarea, fechaVencimiento: text })
        }
      />

      {/* Botones */}
      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => {
            setModalVisible(false);
            setNuevaTarea({
              titulo: "",
              descripcion: "",
              asignadoA: "",
              asignadoANombre: "",
              fechaVencimiento: "",
              prioridad: "media",
              estado: "Pendiente",
              comentarios: [],
            });
            setBusquedaMiembro("");
          }}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleCrearTarea}
        >
          <Text style={styles.buttonText}>Guardar</Text>
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
            <Text style={styles.modalTitle}>Invitar Miembro</Text>

            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#999"
              value={emailInvitacion}
              onChangeText={setEmailInvitacion}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.rolSelector}>
              <Text style={styles.rolLabel}>Rol:</Text>
              {(permisos.puedeInvitar && !permisos.puedeEliminarMiembros 
                ? ["Empleado"] // Si es Supervisor, solo puede invitar Empleados
                : ["Empleado", "Supervisor", "Gerente"] // Si es Gerente, puede invitar todos los roles
              ).map((rol) => (
                <TouchableOpacity
                  key={rol}
                  style={[
                    styles.rolOption,
                    rolSeleccionado === rol && styles.rolOptionSelected
                  ]}
                  onPress={() => setRolSeleccionado(rol)}
                >
                  <Text style={[
                    styles.rolOptionText,
                    rolSeleccionado === rol && styles.rolOptionTextSelected
                  ]}>
                    {rol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalInvitarVisible(false);
                  setRolSeleccionado("Empleado");
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleInvitarMiembro}
              >
                <Text style={styles.buttonText}>Invitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Blanco como fondo principal
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#F2F2F2", // Gris claro para el encabezado
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#171321", // Púrpura oscuro para el título del encabezado
    marginTop: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: "#171321", // Púrpura oscuro para el texto del botón de retroceso
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2", // Gris claro para el contenedor de pestañas
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#171321", // Púrpura oscuro para la pestaña activa
  },
  tabText: {
    color: "#333", // Gris oscuro para el texto de la pestaña inactiva
    fontSize: 16,
  },
  activeTabText: {
    color: "#fff",
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: "#F2F2F2", // Gris claro para las tarjetas de estadísticas
    borderRadius: 12,
    padding: 16,
    width: "48%",
    alignItems: "center",
  },
  statsNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#171321", // Púrpura oscuro para los números de estadísticas
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: "#171321", // Púrpura oscuro para las etiquetas de estadísticas
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  descriptionRow: {
    marginBottom: 20,
  },
  detailLabel: {
    color: "#333", // Gris oscuro para las etiquetas de detalles
    width: 120,
    fontSize: 16,
    fontWeight: "500",
  },
  detailText: {
    color: "#171321", // Púrpura oscuro para el texto de detalles
    flex: 1,
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    fontSize: 14,
    color: "#fff",
    overflow: "hidden",
    backgroundColor: "#171321", // Púrpura oscuro para la insignia de estado
  },
  addTaskButton: {
    backgroundColor: "#171321", // Púrpura oscuro para el botón de agregar tarea
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  addTaskButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
    paddingTop: 40,
  },
  modalContent: {
    backgroundColor: "#F2F2F2", // Gris claro para el contenido modal
    padding: 20,
    borderRadius: 8,
    width: 380,
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
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#4A4656", // Un tono claro del púrpura para el botón de cancelar
  },
  saveButton: {
    backgroundColor: "#171321", // Púrpura oscuro para el botón de guardar
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  personalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  personalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#171321", // Púrpura oscuro para el título personal
  },
  inviteButton: {
    backgroundColor: "#171321", // Púrpura oscuro para el botón de invitación
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  inviteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  miembroCard: {
    backgroundColor: "#F2F2F2", // Gris claro para las tarjetas de miembros
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miembroInfo: {
    flex: 1,
  },
  miembroNombre: {
    fontSize: 16,
    color: "#171321", // Púrpura oscuro para el nombre del miembro
    fontWeight: "500",
    marginBottom: 4,
  },
  miembroRol: {
    fontSize: 14,
    color: "#333", // Gris oscuro para el rol del miembro
  },
  eliminarButton: {
    backgroundColor: "#e57373", // Rojo claro para el botón de eliminar
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  eliminarButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  rolSelector: {
    marginBottom: 20,
  },
  rolLabel: {
    color: "#171321", // Púrpura oscuro para la etiqueta del selector de rol
    fontSize: 16,
    marginBottom: 12,
  },
  rolOption: {
    backgroundColor: "#F5F5F5", // Gris muy claro para las opciones de rol
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  rolOptionSelected: {
    backgroundColor: "gray", // Púrpura oscuro para la opción de rol seleccionada
  },
  finalizarButton: {
    backgroundColor: "#e57373", // Rojo claro para el botón finalizar, para mantener la coherencia
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  finalizarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  // Nuevos estilos para el formulario de tarea
  inputLabel: {
    color: "#171321", // Púrpura oscuro para las etiquetas de entrada
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  asignarContainer: {
    marginBottom: 16,
  },
  searchResults: {
    backgroundColor: "#F5F5F5", // Gris muy claro para los resultados de búsqueda
    borderRadius: 6,
    marginTop: 4,
    maxHeight: 150,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0", // Gris claro para el borde de los resultados
  },
  searchResultText: {
    color: "#171321", // Púrpura oscuro para el texto de los resultados
    fontSize: 16,
  },
  searchResultSubtext: {
    color: "#333", // Gris oscuro para el subtexto de los resultados
    fontSize: 14,
    marginTop: 4,
  },
  selectedMemberContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5", // Gris muy claro para el contenedor del miembro seleccionado
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  selectedMemberText: {
    color: "#171321", // Púrpura oscuro para el texto del miembro seleccionado
    fontSize: 16,
    flex: 1,
  },
  removeMemberText: {
    color: "#e57373", // Rojo claro para el texto de eliminar miembro
    fontSize: 24,
    marginLeft: 8,
  },
  prioridadContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  prioridadOption: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: "center",
  },
  prioridadText: {
    color: "#171321", // Púrpura oscuro para el texto de prioridad
    fontSize: 14,
    fontWeight: "500",
  },
});