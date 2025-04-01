import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { obtenerProyectos } from '../proyectosService';
import BottomNav from '../assets/BottomNav';
import { Feather } from '@expo/vector-icons';
import styles from "../styles/proyectosArchivadosStyle"

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

  // Cambio de fecha de YYYY-MM-DD a DD-MM-YYYY
  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    const dia = date.getDate().toString().padStart(2, "0");
    const mes = (date.getMonth() + 1).toString().padStart(2, "0");
    const anio = date.getFullYear();
    return `${dia}-${mes}-${anio}`;
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
          { backgroundColor: proyecto.estado === "Finalizado" ? "#4CAF50" : "#FF9800" }
        ]}>
          <Text style={styles.estadoTexto}>{proyecto.estado}</Text>
        </View>
      </View>
      <Text style={styles.proyectoDescripcion}>{proyecto.descripcion}</Text>
      <View style={styles.proyectoFooter}>
        <View style={styles.footerItem}>
          <Feather name="calendar" size={16} color="#1E5F74" />
          <Text style={styles.proyectoFecha}>
            {proyecto.estado === "Finalizado"
              ? `Finalizado: ${formatearFecha(proyecto.fechaFinalizacion)}`
              : `Creado: ${formatearFecha(proyecto.fechaCreacion)}`
            }
          </Text>
        </View>
        {proyecto.cliente && (
          <View style={styles.footerItem}>
            <Feather name="user" size={16} color="#1E5F74" />
            <Text style={styles.proyectoCliente}>{proyecto.cliente}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E5F74" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E5F74" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proyectos Archivados</Text>
      </View>

      <ScrollView style={styles.content}>
        {proyectosPendientes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Feather name="clock" size={20} color="#1E5F74" />
              <Text style={styles.sectionTitle}>Proyectos Pendientes</Text>
            </View>
            {proyectosPendientes.map((proyecto) => (
              <ProyectoCard key={proyecto.id} proyecto={proyecto} />
            ))}
          </View>
        )}

        {proyectosFinalizados.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
            </View>
            {proyectosFinalizados.map((proyecto) => (
              <ProyectoCard key={proyecto.id} proyecto={proyecto} />
            ))}
          </View>
        )}

        {proyectosPendientes.length === 0 && proyectosFinalizados.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="folder" size={50} color="#BBBBBB" />
            <Text style={styles.emptyStateText}>No hay proyectos archivados</Text>
          </View>
        )}
      </ScrollView>
      <BottomNav />
    </View>
  );
}
