import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { auth } from '../firebaseConfig';
import {
  obtenerNotificaciones,
  aceptarInvitacion,
  rechazarInvitacion,
} from '../proyectosService';
import BottomNav from '../assets/BottomNav';

export default function NotificacionesScreen() {
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
    }
  };

  const handleRechazarInvitacion = async (invitacionId) => {
    try {
      await rechazarInvitacion(invitacionId);
      await cargarNotificaciones();
    } catch (error) {
      console.error('Error al rechazar invitación:', error);
    }
  };

  const renderNotificacion = (notificacion) => {
    if (notificacion.tipo === 'invitacion') {
      return (
        <View key={notificacion.id} style={styles.notificacionCard}>
          <View style={styles.notificacionHeader}>
            <Text style={styles.notificacionTipo}>Invitación a Proyecto</Text>
            <Text style={styles.notificacionFecha}>
              {new Date(notificacion.fechaInvitacion).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.notificacionTitulo}>
            {notificacion.nombreProyecto}
          </Text>
          <View style={styles.botonesContainer}>
            <TouchableOpacity
              style={[styles.boton, styles.botonAceptar]}
              onPress={() => handleAceptarInvitacion(notificacion.id)}
            >
              <Text style={styles.botonTexto}>Aceptar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boton, styles.botonRechazar]}
              onPress={() => handleRechazarInvitacion(notificacion.id)}
            >
              <Text style={styles.botonTexto}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (notificacion.tipo === 'tarea') {
      return (
        <View key={notificacion.id} style={styles.notificacionCard}>
          <View style={styles.notificacionHeader}>
            <Text style={styles.notificacionTipo}>Tarea Asignada</Text>
            <Text style={styles.notificacionFecha}>
              {new Date(notificacion.fechaCreacion).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.notificacionTitulo}>{notificacion.titulo}</Text>
          <Text style={styles.notificacionProyecto}>
            Proyecto: {notificacion.proyecto.nombre}
          </Text>
          <Text style={styles.notificacionEstado}>
            Estado: {notificacion.estado}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Notificaciones</Text>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.contentContainer}
      >
        {notificaciones.length > 0 ? (
          notificaciones.map(renderNotificacion)
        ) : (
          <Text style={styles.noNotificaciones}>
            No tienes notificaciones pendientes
          </Text>
        )}
      </ScrollView>
      <BottomNav/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Blanco como fondo principal
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171321', // Púrpura oscuro para el título
    padding: 16,
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  notificacionCard: {
    backgroundColor: '#F2F2F2', // Gris claro para las tarjetas de notificación
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificacionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notificacionTipo: {
    color: '#171321', // Púrpura oscuro para el tipo de notificación
    fontSize: 14,
    fontWeight: '500',
  },
  notificacionFecha: {
    color: '#666', // Gris medio para la fecha de notificación
    fontSize: 12,
  },
  notificacionTitulo: {
    color: '#171321', // Púrpura oscuro para el título de notificación
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  notificacionProyecto: {
    color: '#333', // Gris oscuro para el proyecto de notificación
    fontSize: 14,
    marginBottom: 4,
  },
  notificacionEstado: {
    color: '#333', // Gris oscuro para el estado de notificación
    fontSize: 14,
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  boton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  botonAceptar: {
    backgroundColor: '#171321', // Púrpura oscuro para el botón aceptar
  },
  botonRechazar: {
    backgroundColor: '#4A4656', // Púrpura claro para el botón rechazar
  },
  botonTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  noNotificaciones: {
    color: '#666', // Gris medio para el texto de no notificaciones
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
});