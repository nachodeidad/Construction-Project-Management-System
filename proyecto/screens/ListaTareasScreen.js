import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { obtenerTareasProyecto, obtenerMiembrosProyecto } from '../proyectosService';
import { auth } from '../firebaseConfig';
import { Filter, Search } from 'lucide-react-native';
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

    // Aplicar filtros
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

      {/* Búsqueda por Usuario */}
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

      {/* Botones */}
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

  const renderTareaCard = (tarea) => {
    const miembroAsignado = miembros.find(m => m.userId === tarea.asignadoA);
    const prioridad = PRIORIDADES[tarea.prioridad] || PRIORIDADES.media;

    return (
      <View 
        key={tarea.id} 
        style={[
          styles.tareaCard,
          { borderLeftColor: prioridad.color }
        ]}
      >
        <Text style={styles.tareaTitulo}>{tarea.titulo}</Text>
        <Text style={styles.tareaDescripcion}>{tarea.descripcion}</Text>
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
      </View>
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
          <Filter size={20} color="#fff" />
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
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Blanco como fondo principal
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Blanco para el loading
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#F2F2F2', // Gris claro para el header
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#171321', // Púrpura oscuro para el botón de retroceso
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171321', // Púrpura oscuro para el título del header
    marginTop: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F2', // Gris claro para el contenedor de tabs
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
    borderBottomColor: '#171321', // Púrpura oscuro para el tab activo
  },
  tabText: {
    color: '#333', // Gris oscuro para el texto del tab
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextoActivo: {
    color: '#171321', // Púrpura oscuro para el texto del tab activo
  },
  filtrosHeader: {
    padding: 16,
    backgroundColor: '#F2F2F2', // Gris claro para el header de filtros
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Gris claro para el borde del filtro
  },
  filtrosBoton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5', // Gris muy claro para el botón de filtros
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  filtrosBotonTexto: {
    color: '#171321', // Púrpura oscuro para el texto del botón de filtros
    marginLeft: 8,
    fontSize: 14,
  },
  filtrosBadge: {
    backgroundColor: '#171321', // Púrpura oscuro para el badge de filtros
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
    backgroundColor: '#F2F2F2', // Gris claro para el contenido del modal
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171321', // Púrpura oscuro para el título del modal
    paddingTop: 30,
    marginBottom: 20,
  },
  filtroSeccion: {
    marginBottom: 20,
  },
  filtroTitulo: {
    fontSize: 16,
    color: '#171321', // Púrpura oscuro para el título del filtro
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
    backgroundColor: '#F5F5F5', // Gris muy claro para las opciones de filtro
  },
  filtroOpcionTexto: {
    color: '#171321', // Púrpura oscuro para el texto de la opción de filtro
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
    backgroundColor: '#171321', // Púrpura oscuro para el botón primario del modal
  },
  modalBotonSecundario: {
    backgroundColor: '#4A4656', // Púrpura claro para el botón secundario del modal
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
    backgroundColor: '#F2F2F2', // Gris claro para las tarjetas de tarea
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  tareaTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#171321', // Púrpura oscuro para el título de la tarea
    marginBottom: 8,
  },
  tareaDescripcion: {
    fontSize: 14,
    color: '#333', // Gris oscuro para la descripción de la tarea
    marginBottom: 12,
  },
  tareaDetalles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tareaAsignado: {
    fontSize: 14,
    color: '#171321', // Púrpura oscuro para el asignado de la tarea
  },
  tareaFecha: {
    fontSize: 14,
    color: '#333', // Gris oscuro para la fecha de la tarea
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
    color: '#666', // Gris medio para el mensaje vacío
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5', // Gris muy claro para el contenedor de búsqueda
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#171321', // Púrpura oscuro para el input de búsqueda
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
    backgroundColor: '#171321', // Púrpura oscuro para el resultado seleccionado
  },
  resultadoBusquedaTexto: {
    color: '#171321', // Púrpura oscuro para el texto del resultado de búsqueda
    fontSize: 14,
  },
  resultadoSeleccionadoTexto: {
    color: '#fff', // Blanco para el texto del resultado seleccionado
    fontWeight: '600',
  },
  noResultados: {
    color: '#666', // Gris medio para el mensaje de no resultados
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});