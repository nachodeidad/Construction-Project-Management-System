import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"


import LoginScreen from "./screens/LoginScreen"
import SignupScreen from "./screens/SignUpScreen"
import HomeScreen from "./screens/HomeScreen"
import InfoProyectosScreen from "./screens/InfoProyectosScreen"
import UserDataScreen from "./screens/UserDataScreen"
import NotificacionesScreen from './screens/NotificacionesScreen';
import ProyectosArchivadosScreen from "./screens/ProyectosArchivadosScreen"
import ListaTareasScreen from "./screens/ListaTareasScreen"
import ProfileScreen from "./screens/perfilScreen"


const Stack = createStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="UserData" component={UserDataScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="InfoProyectos" component={InfoProyectosScreen} />
        <Stack.Screen name="Proyectos" component={ProyectosArchivadosScreen} />
        <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
        <Stack.Screen name="Perfi" component={ProfileScreen} />
        <Stack.Screen name="ListaTareas" component={ListaTareasScreen} options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>

  )
}