import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: true,
        tabBarActiveTintColor: '#00FFCC',
        tabBarInactiveTintColor: '#455A64',
        tabBarStyle: { 
          backgroundColor: '#1A1A1D', 
          borderTopWidth: 2, 
          borderTopColor: '#00FFCC', // Borda néon ciano no topo da barra
          paddingBottom: 5, 
          height: 65,
          elevation: 10,
        },
        headerStyle: { 
          backgroundColor: '#1A1A1D', 
          borderBottomWidth: 1, 
          borderBottomColor: '#00FFCC' // Cabeçalho também ganha a linha néon
        },
        headerTintColor: '#00FFCC',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      {/* OCULTAR O COMPONENTE DA BARRA (Manteve-se a sua lógica perfeita) */}
      <Tabs.Screen name="components/RpgBar" options={{ href: null }} />

      {/* 1. TREINO */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Treino', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>🏃</Text>
          ) 
        }} 
      />
      
      {/* 2. DIETA */}
      <Tabs.Screen 
        name="dieta" 
        options={{ 
          title: 'Dieta', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>🥗</Text>
          ) 
        }} 
      />
      
      {/* 3. SAÚDE */}
      <Tabs.Screen 
        name="saude" 
        options={{ 
          title: 'Saúde', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>⏰</Text>
          ) 
        }} 
      />
      
      {/* 4. RESUMO (Calendário) */}
      <Tabs.Screen 
        name="calendario" 
        options={{ 
          title: 'Resumo', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>📅</Text>
          ) 
        }} 
      />
      
      {/* 5. RANKING */}
      <Tabs.Screen 
        name="ranking" 
        options={{ 
          title: 'Ranking', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>🏆</Text>
          ) 
        }} 
      />
      
      {/* 6. PERFIL */}
      <Tabs.Screen 
        name="perfil" 
        options={{ 
          title: 'Perfil', 
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>🤖</Text>
          ) 
        }} 
      />
    </Tabs>
  );
}