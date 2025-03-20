import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { obtenerTareasProyecto, obtenerMiembrosProyecto, actualizarTarea } from '../proyectosService';
import { auth } from '../firebaseConfig';
import { Filter, Search, CheckCircle, X } from 'lucide-react-native';
import { KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const PRIORIDADES = {
  alta: { color: '#ff4444', label: 'Alta' },
  media: { color: '#ff9800', label: 'Media' },
  baja: { color: '#4caf50', label: 'Baja' }
};

export default function ListaTareasScreen({ route, navigation }) {
  const { proyecto, userRole } = route.params;
  const [tareas, setTareas] = useState([]);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState('pendientes');
  const [filtros, setFiltros] = useState({
    prioridad: null,
    usuario: null,
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [mostrarFinalizarModal, setMostrarFinalizarModal] = useState(false);
  const [comentarioFinalizacion, setComentarioFinalizacion] = useState('');
  const [finalizandoTarea, setFinalizandoTarea] = useState(false);

  const miembrosFiltrados = miembros.filter(miembro =>
    miembro.username.toLowerCase().includes(busquedaUsuario.toLowerCase())
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [tareasData, miembrosData] = await Promise.all([
        obtenerTareasProyecto(proyecto.id),
        obtenerMiembrosProyecto(proyecto.id)
      ]);
      
      let tareasFiltradas = tareasData;
      if (userRole === "Empleado") {
        tareasFiltradas = tareasData.filter(
          tarea => tarea.asignadoA === auth.currentUser?.uid
        );
      } else if (userRole === "Supervisor") {
        const empleadosIds = miembrosData
          .filter(m => m.rol === "Empleado")
          .map(m => m.userId);
        tareasFiltradas = tareasData.filter(
          tarea => tarea.asignadoA === auth.currentUser?.uid || 
                  empleadosIds.includes(tarea.asignadoA)
        );
      }

      setTareas(tareasFiltradas);
      setMiembros(miembrosData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTareasPorEstado = () => {
    const hoy = new Date();
    let tareasFiltradas = tareas;

    if (filtros.prioridad) {
      tareasFiltradas = tareasFiltradas.filter(tarea => tarea.prioridad === filtros.prioridad);
    }
    if (filtros.usuario) {
      tareasFiltradas = tareasFiltradas.filter(tarea => tarea.asignadoA === filtros.usuario);
    }

    return {
      pendientes: tareasFiltradas.filter(tarea => 
        tarea.estado === "Pendiente" && new Date(tarea.fechaVencimiento) > hoy
      ),
      completadas: tareasFiltradas.filter(tarea => 
        tarea.estado === "Completada"
      ),
      vencidas: tareasFiltradas.filter(tarea => 
        tarea.estado !== "Completada" && new Date(tarea.fechaVencimiento) < hoy
      ),
    };
  };

  const finalizarTarea = async () => {
    if (!comentarioFinalizacion.trim()) {
      Alert.alert("Error", "Debes agregar un comentario para finalizar la tarea");
      return;
    }

    try {
      setFinalizandoTarea(true);
      
      const tareaActualizada = {
        ...tareaSeleccionada,
        estado: "Completada",
        comentarioFinalizacion: comentarioFinalizacion,
        fechaFinalizacion: new Date().toISOString()
      };
      
      await actualizarTarea(proyecto.id, tareaActualizada);
      
      setTareas(tareas.map(t => 
        t.id === tareaSeleccionada.id ? tareaActualizada : t
      ));
      
      setMostrarFinalizarModal(false);
      setMostrarDetalles(false);
      setComentarioFinalizacion('');
      
      Alert.alert("Éxito", "Tarea finalizada correctamente");
    } catch (error) {
      console.error("Error al finalizar tarea:", error);
      Alert.alert("Error", "No se pudo finalizar la tarea. Intenta nuevamente.");
    } finally {
      setFinalizandoTarea(false);
    }
  };

  const renderFiltros = () => (
    <Modal
      visible={mostrarFiltros}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setMostrarFiltros(false)}
    >
      <View style={styles.modalContainer}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.modalContent}
          enableOnAndroid={true}
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.modalTitle}>Filtros</Text>

          {/* Filtro por Prioridad */}
          <View style={styles.filtroSeccion}>
            <Text style={styles.filtroTitulo}>Prioridad</Text>
            <View style={styles.filtroOpciones}>
              {Object.entries(PRIORIDADES).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.filtroOpcion,
                    filtros.prioridad === key && { backgroundColor: value.color }
                  ]}
                  onPress={() => setFiltros(prev => ({
                    ...prev,
                    prioridad: prev.prioridad === key ? null : key
                  }))}
                >
                  <Text style={[
                    styles.filtroOpcionTexto,
                    filtros.prioridad === key && { color: '#fff' }
                  ]}>
                    {value.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filtroSeccion}>
            <Text style={styles.filtroTitulo}>Buscar por usuario</Text>
            <View style={styles.searchContainer}>
              <Search size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar usuario..."
                placeholderTextColor="#666"
                value={busquedaUsuario}
                onChangeText={setBusquedaUsuario}
              />
            </View>
            {busquedaUsuario.length > 0 && (
              <View style={styles.resultadosBusqueda}>
                {miembrosFiltrados.map((miembro) => (
                  <TouchableOpacity
                    key={miembro.userId}
                    style={[
                      styles.resultadoBusqueda,
                      filtros.usuario === miembro.userId && styles.resultadoSeleccionado
                    ]}
                    onPress={() => {
                      setFiltros(prev => ({
                        ...prev,
                        usuario: prev.usuario === miembro.userId ? null : miembro.userId
                      }));
                      setBusquedaUsuario('');
                    }}
                  >
                    <Text style={[
                      styles.resultadoBusquedaTexto,
                      filtros.usuario === miembro.userId && styles.resultadoSeleccionadoTexto
                    ]}>
                      {miembro.username}
                    </Text>
                  </TouchableOpacity>
                ))}
                {miembrosFiltrados.length === 0 && (
                  <Text style={styles.noResultados}>No se encontraron usuarios</Text>
                )}
              </View>
            )}
          </View>

          <View style={styles.modalBotones}>
            <TouchableOpacity
              style={[styles.modalBoton, styles.modalBotonSecundario]}
              onPress={() => {
                setFiltros({ prioridad: null, usuario: null });
                setBusquedaUsuario('');
                setMostrarFiltros(false);
              }}
            >
              <Text style={styles.modalBotonTextoSecundario}>Limpiar filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBoton, styles.modalBotonPrimario]}
              onPress={() => setMostrarFiltros(false)}
            >
              <Text style={styles.modalBotonTextoPrimario}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );

  const renderDetallesTarea = () => {
    if (!tareaSeleccionada) return null;
    
    const miembroAsignado = miembros.find(m => m.userId === tareaSeleccionada.asignadoA);
    const prioridad = PRIORIDADES[tareaSeleccionada.prioridad] || PRIORIDADES.media;
    const fechaVencimiento = new Date(tareaSeleccionada.fechaVencimiento);
    const hoy = new Date();
    const diasRestantes = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));
    
    return (
      <Modal
        visible={mostrarDetalles}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMostrarDetalles(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.detallesModalContent}>
            <View style={styles.detallesHeader}>
              <Text style={styles.detallesTitulo}>{tareaSeleccionada.titulo}</Text>
              <TouchableOpacity 
                style={styles.cerrarBoton}
                onPress={() => setMostrarDetalles(false)}
              >
                <X size={24} color="#171321" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detallesScroll}>
              <View style={[styles.prioridadBadge, { backgroundColor: prioridad.color, alignSelf: 'flex-start' }]}>
                <Text style={styles.prioridadText}>{prioridad.label}</Text>
              </View>
              
              <Text style={styles.detallesSubtitulo}>Descripción</Text>
              <Text style={styles.detallesDescripcion}>{tareaSeleccionada.descripcion}</Text>
              
              <View style={styles.detallesInfoContainer}>
                <View style={styles.detallesInfoItem}>
                  <Text style={styles.detallesInfoLabel}>Asignado a</Text>
                  <Text style={styles.detallesInfoValor}>{miembroAsignado?.username || 'Usuario no encontrado'}</Text>
                </View>
                
                <View style={styles.detallesInfoItem}>
                  <Text style={styles.detallesInfoLabel}>Fecha de vencimiento</Text>
                  <Text style={styles.detallesInfoValor}>{fechaVencimiento.toLocaleDateString()}</Text>
                </View>
                
                <View style={styles.detallesInfoItem}>
                  <Text style={styles.detallesInfoLabel}>Estado</Text>
                  <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(tareaSeleccionada.estado) }]}>
                    <Text style={styles.estadoText}>{tareaSeleccionada.estado}</Text>
                  </View>
                </View>
                
                {tareaSeleccionada.estado !== "Completada" && (
                  <View style={styles.detallesInfoItem}>
                    <Text style={styles.detallesInfoLabel}>Tiempo restante</Text>
                    <Text style={[
                      styles.detallesInfoValor, 
                      diasRestantes < 0 ? styles.textoVencido : 
                      diasRestantes <= 2 ? styles.textoProximoVencer : null
                    ]}>
                      {diasRestantes < 0 
                        ? `Vencida hace ${Math.abs(diasRestantes)} días` 
                        : diasRestantes === 0 
                          ? 'Vence hoy' 
                          : `${diasRestantes} días restantes`}
                    </Text>
                  </View>
                )}
                
                {tareaSeleccionada.estado === "Completada" && tareaSeleccionada.comentarioFinalizacion && (
                  <View style={styles.detallesInfoItem}>
                    <Text style={styles.detallesInfoLabel}>Comentario de finalización</Text>
                    <Text style={styles.detallesInfoValor}>{tareaSeleccionada.comentarioFinalizacion}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
            
            {tareaSeleccionada.estado !== "Completada" && (
              <TouchableOpacity 
                style={styles.finalizarBoton}
                onPress={() => {
                  setMostrarDetalles(false);
                  setMostrarFinalizarModal(true);
                }}
              >
                <CheckCircle size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.finalizarBotonTexto}>Finalizar Tarea</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderFinalizarModal = () => (
    <Modal
      visible={mostrarFinalizarModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setMostrarFinalizarModal(false)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.finalizarModalContent}>
            <Text style={styles.finalizarModalTitulo}>Finalizar Tarea</Text>
            <Text style={styles.finalizarModalSubtitulo}>
              Agrega un comentario sobre la finalización de la tarea
            </Text>
            
            <TextInput
              style={styles.comentarioInput}
              placeholder="Escribe un comentario..."
              placeholderTextColor="#666"
              multiline={true}
              numberOfLines={4}
              value={comentarioFinalizacion}
              onChangeText={setComentarioFinalizacion}
            />
            
            <View style={styles.finalizarModalBotones}>
              <TouchableOpacity
                style={[styles.modalBoton, styles.modalBotonSecundario]}
                onPress={() => {
                  setMostrarFinalizarModal(false);
                  setComentarioFinalizacion('');
                  setMostrarDetalles(true);
                }}
                disabled={finalizandoTarea}
              >
                <Text style={styles.modalBotonTextoSecundario}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalBoton, 
                  styles.modalBotonPrimario,
                  finalizandoTarea && styles.botonDeshabilitado
                ]}
                onPress={finalizarTarea}
                disabled={finalizandoTarea}
              >
                {finalizandoTarea ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBotonTextoPrimario}>Finalizar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderTareaCard = (tarea) => {
    const miembroAsignado = miembros.find(m => m.userId === tarea.asignadoA);
    const prioridad = PRIORIDADES[tarea.prioridad] || PRIORIDADES.media;

    return (
      <TouchableOpacity 
        key={tarea.id} 
        style={[
          styles.tareaCard,
          { borderLeftColor: prioridad.color }
        ]}
        onPress={() => {
          setTareaSeleccionada(tarea);
          setMostrarDetalles(true);
        }}
      >
        <Text style={styles.tareaTitulo}>{tarea.titulo}</Text>
        <Text style={styles.tareaDescripcion} numberOfLines={2}>
          {tarea.descripcion}
        </Text>
        <View style={styles.tareaDetalles}>
          <Text style={styles.tareaAsignado}>
            Asignado a: {miembroAsignado?.username || 'Usuario no encontrado'}
          </Text>
          <Text style={styles.tareaFecha}>
            Vence: {new Date(tarea.fechaVencimiento).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.tareaEstadoContainer}>
          <View style={[
            styles.prioridadBadge,
            { backgroundColor: prioridad.color }
          ]}>
            <Text style={styles.prioridadText}>{prioridad.label}</Text>
          </View>
          <View style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(tarea.estado) }
          ]}>
            <Text style={styles.estadoText}>{tarea.estado}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Completada": return "#4caf50";
      case "En Progreso": return "#ff9800";
      default: return "#666";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0073ea" />
      </View>
    );
  }

  const tareasPorEstado = getTareasPorEstado();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tareas del Proyecto</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            seccionActiva === 'pendientes' && styles.tabActivo
          ]}
          onPress={() => setSeccionActiva('pendientes')}
        >
          <Text style={[
            styles.tabText,
            seccionActiva === 'pendientes' && styles.tabTextoActivo
          ]}>
            Pendientes ({tareasPorEstado.pendientes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            seccionActiva === 'completadas' && styles.tabActivo
          ]}
          onPress={() => setSeccionActiva('completadas')}
        >
          <Text style={[
            styles.tabText,
            seccionActiva === 'completadas' && styles.tabTextoActivo
          ]}>
            Finalizadas ({tareasPorEstado.completadas.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.tab, 
            seccionActiva === 'vencidas' && styles.tabActivo
          ]}
          onPress={() => setSeccionActiva('vencidas')}
        >
          <Text style={[
            styles.tabText,
            seccionActiva === 'vencidas' && styles.tabTextoActivo
          ]}>
            Vencidas ({tareasPorEstado.vencidas.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtrosHeader}>
        <TouchableOpacity
          style={styles.filtrosBoton}
          onPress={() => setMostrarFiltros(true)}
        >
          <Filter size={20} color="#171321" />
          <Text style={styles.filtrosBotonTexto}>Filtros</Text>
          {(filtros.prioridad || filtros.usuario) && (
            <View style={styles.filtrosBadge}>
              <Text style={styles.filtrosBadgeTexto}>
                {(filtros.prioridad ? 1 : 0) + (filtros.usuario ? 1 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {seccionActiva === 'pendientes' && (
          <View style={styles.seccion}>
            {tareasPorEstado.pendientes.map(renderTareaCard)}
            {tareasPorEstado.pendientes.length === 0 && (
              <Text style={styles.emptyMessage}>No hay tareas pendientes</Text>
            )}
          </View>
        )}

        {seccionActiva === 'completadas' && (
          <View style={styles.seccion}>
            {tareasPorEstado.completadas.map(renderTareaCard)}
            {tareasPorEstado.completadas.length === 0 && (
              <Text style={styles.emptyMessage}>No hay tareas finalizadas</Text>
            )}
          </View>
        )}

        {seccionActiva === 'vencidas' && (
          <View style={styles.seccion}>
            {tareasPorEstado.vencidas.map(renderTareaCard)}
            {tareasPorEstado.vencidas.length === 0 && (
              <Text style={styles.emptyMessage}>No hay tareas vencidas</Text>
            )}
          </View>
        )}
      </ScrollView>

      {renderFiltros()}
      {renderDetallesTarea()}
      {renderFinalizarModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#F2F2F2',
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#171321',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171321',
    marginTop: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActivo: {
    borderBottomColor: '#171321',
  },
  tabText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextoActivo: {
    color: '#171321',
  },
  filtrosHeader: {
    padding: 16,
    backgroundColor: '#F2F2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtrosBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  filtrosBotonTexto: {
    color: '#171321',
    marginLeft: 8,
    fontSize: 14,
  },
  filtrosBadge: {
    backgroundColor: '#171321',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filtrosBadgeTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F2F2F2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171321',
    paddingTop: 30,
    marginBottom: 20,
  },
  filtroSeccion: {
    marginBottom: 20,
  },
  filtroTitulo: {
    fontSize: 16,
    color: '#171321',
    marginBottom: 12,
  },
  filtroOpciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filtroOpcion: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filtroOpcionTexto: {
    color: '#171321',
    fontSize: 14,
  },
  modalBotones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalBoton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBotonPrimario: {
    backgroundColor: '#171321',
  },
  modalBotonSecundario: {
    backgroundColor: '#4A4656',
  },
  modalBotonTextoPrimario: {
    color: '#fff',
    fontWeight: '600',
  },
  modalBotonTextoSecundario: {
    color: '#fff',
  },
  seccion: {
    marginBottom: 24,
  },
  tareaCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  tareaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#171321',
    marginBottom: 8,
  },
  tareaDescripcion: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
  },
  tareaDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tareaAsignado: {
    fontSize: 14,
    color: '#171321',
  },
  tareaFecha: {
    fontSize: 14,
    color: '#333',
  },
  tareaEstadoContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  prioridadBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prioridadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyMessage: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#171321',
    fontSize: 16,
    paddingVertical: 12,
  },
  resultadosBusqueda: {
    marginTop: 8,
  },
  resultadoBusqueda: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  resultadoSeleccionado: {
    backgroundColor: '#171321',
  },
  resultadoBusquedaTexto: {
    color: '#171321',
    fontSize: 14,
  },
  resultadoSeleccionadoTexto: {
    color: '#fff',
    fontWeight: '600',
  },
  noResultados: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Estilos para el modal de detalles
  detallesModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  detallesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detallesTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#171321',
    flex: 1,
  },
  cerrarBoton: {
    padding: 8,
  },
  detallesScroll: {
    flex: 1,
  },
  detallesSubtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#171321',
    marginTop: 16,
    marginBottom: 8,
  },
  detallesDescripcion: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 24,
  },
  detallesInfoContainer: {
    marginTop: 16,
  },
  detallesInfoItem: {
    marginBottom: 16,
  },
  detallesInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detallesInfoValor: {
    fontSize: 16,
    color: '#171321',
  },
  textoVencido: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  textoProximoVencer: {
    color: '#ff9800',
    fontWeight: 'bold',
  },
  finalizarBoton: {
    backgroundColor: '#171321',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  finalizarBotonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para el modal de finalización
  finalizarModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  finalizarModalTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#171321',
    marginBottom: 8,
  },
  finalizarModalSubtitulo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  comentarioInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#171321',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  finalizarModalBotones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
});