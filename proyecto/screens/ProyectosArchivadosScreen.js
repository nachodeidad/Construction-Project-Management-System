import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { obtenerProyectos } from '../proyectosService';
import BottomNav from '../assets/BottomNav';

export default function ProyectosArchivadosScreen({ navigation }) {
  const [proyectosPendientes, setProyectosPendientes] = useState([]);
  const [proyectosFinalizados, setProyectosFinalizados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarProyectos();
  }, []);

  const cargarProyectos = async () => {
    try {
      const [pendientes, finalizados] = await Promise.all([
        obtenerProyectos("Pendiente"),
        obtenerProyectos("Finalizado")
      ]);
      
      setProyectosPendientes(pendientes);
      setProyectosFinalizados(finalizados);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar proyectos:", error);
      setLoading(false);
    }
  };

  const ProyectoCard = ({ proyecto }) => (
    <TouchableOpacity
      style={styles.proyectoCard}
      onPress={() => navigation.navigate('InfoProyectos', { proyecto })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.proyectoNombre}>{proyecto.nombre}</Text>
        <View style={[
          styles.estadoBadge,
          { backgroundColor: proyecto.estado === "Finalizado" ? "#4CAF50" : "#FFA000" }
        ]}>
          <Text style={styles.estadoTexto}>{proyecto.estado}</Text>
        </View>
      </View>
      <Text style={styles.proyectoDescripcion}>{proyecto.descripcion}</Text>
      <View style={styles.proyectoFooter}>
        <Text style={styles.proyectoFecha}>
          {proyecto.estado === "Finalizado" 
            ? `Finalizado: ${new Date(proyecto.fechaFinalizacion).toLocaleDateString()}`
            : `Creado: ${new Date(proyecto.fechaCreacion).toLocaleDateString()}`
          }
        </Text>
      </View>
    </TouchableOpacity>
  );

  

  return (
    <View style={styles.container}>
      <View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
        </TouchableOpacity>
      </View>
      <Text style={styles.headerTitle}>Proyectos Archivados</Text>
      <ScrollView style={styles.content}>
        {proyectosPendientes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proyectos Pendientes</Text>
            {proyectosPendientes.map((proyecto) => (
              <ProyectoCard key={proyecto.id} proyecto={proyecto} />
            ))}
          </View>
        )}

        {proyectosFinalizados.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proyectos Finalizados</Text>
            {proyectosFinalizados.map((proyecto) => (
              <ProyectoCard key={proyecto.id} proyecto={proyecto} />
            ))}
          </View>
        )}

        {proyectosPendientes.length === 0 && proyectosFinalizados.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay proyectos archivados</Text>
          </View>
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
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#F2F2F2', // Gris claro para el encabezado
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171321', // Púrpura oscuro para el título del encabezado
    marginTop: 50,
    paddingLeft: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#171321', // Púrpura oscuro para el texto del botón de retroceso
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#171321', // Púrpura oscuro para el título de la sección
    marginBottom: 16,
  },
  proyectoCard: {
    backgroundColor: '#F2F2F2', // Gris claro para las tarjetas de proyecto
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proyectoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#171321', // Púrpura oscuro para el nombre del proyecto
    flex: 1,
    marginRight: 8,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  proyectoDescripcion: {
    color: '#333', // Gris oscuro para la descripción del proyecto
    fontSize: 14,
    marginBottom: 12,
  },
  proyectoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proyectoFecha: {
    color: '#666', // Gris medio para la fecha del proyecto
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Blanco para el contenedor de carga
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#666', // Gris medio para el texto de estado vacío
    fontSize: 16,
  },
});