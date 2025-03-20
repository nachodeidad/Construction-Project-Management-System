import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';

const navigationItems = [
  { id: 'home', icon: 'home', label: 'Inicio', screen: 'Home' },
  { id: 'work', icon: 'calendar', label: 'Archivados', screen: 'Proyectos' },
  { id: 'notifications', icon: 'bell', label: 'Notificaciones', screen: 'Notificaciones' },
  { id: 'profile', icon: 'user', label: 'Perfil', screen: 'Home' },
];

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const handleNavigation = (screen) => {
    navigation.navigate(screen);
  };

  const isActive = (screen) => {
    return route.name === screen;
  };

  return (
    <Animated.View style={styles.bottomNav}>
      {navigationItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.navItem}
          onPress={() => handleNavigation(item.screen)}
        >
          <Icon
            name={item.icon}
            size={24}
            color={isActive(item.screen) ? "#171321" : "rgb(149, 144, 144)"} // Cambio aquí
          />
          <Text
            style={[
              styles.navText,
              isActive(item.screen) && styles.activeNavText
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F2F2F2', // Gris claro para el fondo de la navegación
    paddingVertical: 10,
    borderRadius: 20,
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 10,
  },
  navItem: {
    alignItems: 'center',
    padding: 8,
  },
  navText: {
    color: '#333', // Gris oscuro para el texto de la navegación inactiva
    fontSize: 12,
    marginTop: 4,
  },
  activeNavText: {
    color: '#171321', // Púrpura oscuro para el texto de la navegación activa
    fontWeight: '500',
  },
});

export default BottomNav;