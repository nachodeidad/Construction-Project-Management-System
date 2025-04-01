import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar
} from 'react-native';
import { auth } from '../firebaseConfig';
import {
  obtenerNotificaciones,
  aceptarInvitacion,
  rechazarInvitacion,
  marcarNotificacionLeida
} from '../proyectosService';
import BottomNav from '../assets/BottomNav';
import { Feather } from '@expo/vector-icons';
import styles from "../styles/notificacionesStyles"

export default function NotificacionesScreen({ navigation }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const cargarNotificaciones = useCallback(async () => {
    try {
      const data = await obtenerNotificaciones(auth.currentUser.uid);
      setNotificaciones(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarNotificaciones();
    setRefreshing(false);
  }, [cargarNotificaciones]);

  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  const handleAceptarInvitacion = async (invitacionId) => {
    try {
      await aceptarInvitacion(invitacionId);
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error al aceptar invitación:', error);
      Alert.alert('Error', 'No se pudo aceptar la invitación. Intenta nuevamente.');
    }
  };

  const handleRechazarInvitacion = async (invitacionId) => {
    try {
      await rechazarInvitacion(invitacionId);
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error al rechazar invitación:', error);
      Alert.alert('Error', 'No se pudo rechazar la invitación. Intenta nuevamente.');
    }
  };

  // Función para usar fecha DD-MM-YYYY
  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, "0");
    const mes = (date.getMonth() + 1).toString().padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}-${mes}-${anio}`;
  };

  // Función para navegar a la tarea
  const navegarATarea = async (notificacion) => {
    try {
      // Solo intentar marcar como leída si es una notificación de cambio_fecha
      if (notificacion.tipo === 'cambio_fecha' && !notificacion.leido) {
        await marcarNotificacionLeida(notificacion.id);
      }
      
      // Determinar el ID de la tarea según el tipo de notificación
      let tareaId;
      if (notificacion.tipo === 'tarea') {
        // Para notificaciones de tipo tarea, el ID es el ID de la tarea directamente
        tareaId = notificacion.id;
      } else if (notificacion.tipo === 'cambio_fecha' && notificacion.datos && notificacion.datos.tareaId) {
        // Para notificaciones de cambio de fecha, el ID de la tarea está en datos.tareaId
        tareaId = notificacion.datos.tareaId;
      } else {
        throw new Error('No se pudo determinar el ID de la tarea');
      }
      
      // Navegar a la pantalla de tareas al dar  click
      navigation.navigate('ListaTareas', {
        proyecto: notificacion.proyecto,
        userRole: notificacion.rol || 'Empleado',
        tareaId: tareaId,
        abrirTarea: true 
      });
    } catch (error) {
      console.error('Error al navegar a la tarea:', error);
      Alert.alert('Error', 'No se pudo abrir la tarea. Intenta nuevamente.');
    }
  };

  const renderNotificacion = (notificacion) => {
    if (notificacion.tipo === 'invitacion') {
      return (
        <View key={notificacion.id} style={styles.notificacionCard}>
          <View style={styles.notificacionHeader}>
            <View style={styles.tipoContainer}>
              <Feather name="mail" size={16} color="#1E5F74" style={styles.iconoTipo} />
              <Text style={styles.notificacionTipo}>Invitación a Proyecto</Text>
            </View>
            <Text style={styles.notificacionFecha}>
              {formatearFecha(notificacion.fechaInvitacion)}
            </Text>
          </View>
          <Text style={styles.notificacionTitulo}>
            {notificacion.nombreProyecto}
          </Text>
          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonRechazar]}
              onPress={() => handleRechazarInvitacion(notificacion.id)}
            >
              <Text style={styles.botonTexto}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boton, styles.botonAceptar]}
              onPress={() => handleAceptarInvitacion(notificacion.id)}
            >
              <Text style={styles.botonTexto}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (notificacion.tipo === 'tarea' || notificacion.tipo === 'cambio_fecha') {
      const esCambioFecha = notificacion.tipo === 'cambio_fecha';
      
      return (
        <TouchableOpacity 
          key={notificacion.id} 
          style={[
            styles.notificacionCard,
            !notificacion.leido && styles.notificacionNoLeida
          ]}
          onPress={() => navegarATarea(notificacion)}
        >
          <View style={styles.notificacionHeader}>
            <View style={styles.tipoContainer}>
              {esCambioFecha ? (
                <Feather name="clock" size={16} color="#FF9800" style={styles.iconoTipo} />
              ) : (
                <Feather name="bell" size={16} color="#1E5F74" style={styles.iconoTipo} />
              )}
              <Text style={[
                styles.notificacionTipo,
                esCambioFecha && styles.cambioFechaTipo
              ]}>
                {esCambioFecha ? 'Cambio de Fecha' : 'Tarea Asignada'}
              </Text>
            </View>
            <Text style={styles.notificacionFecha}>
              {formatearFecha(notificacion.fechaCreacion || notificacion.fecha)}
            </Text>
          </View>
          
          <Text style={styles.notificacionTitulo}>{notificacion.titulo}</Text>
          
          {notificacion.mensaje && (
            <Text style={styles.notificacionMensaje}>{notificacion.mensaje}</Text>
          )}
          
          <View style={styles.notificacionDetalles}>
            <View style={styles.detalleItem}>
              <Feather name="briefcase" size={14} color="#1E5F74" />
              <Text style={styles.notificacionProyecto}>
                {notificacion.proyecto.nombre}
              </Text>
            </View>
            
            {!esCambioFecha && (
              <View style={styles.detalleItem}>
                <Feather name="flag" size={14} color="#1E5F74" />
                <Text style={styles.notificacionEstado}>
                  {notificacion.estado}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.verMasContainer}>
            <Text style={styles.verMasTexto}>Ver detalles</Text>
            <Feather name="arrow-right" size={16} color="#1E5F74" />
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E5F74" barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notificaciones</Text>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#1E5F74"]} 
            tintColor="#1E5F74"
          />
        }
        contentContainerStyle={styles.contentContainer}
      >
        {notificaciones.length > 0 ? (
          notificaciones.map(renderNotificacion)
        ) : (
          <View style={styles.emptyState}>
            <Feather name="bell-off" size={50} color="#BBBBBB" />
            <Text style={styles.noNotificaciones}>
              No tienes notificaciones pendientes
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomNav/>
    </View>
  );
}
