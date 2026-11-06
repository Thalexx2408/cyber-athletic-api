import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
// IMPORTAÇÃO DA NOSSA API CENTRALIZADA
// Voltamos duas pastas ('../../') pois este ficheiro está dentro de 'app/components'
import api from '../../services/api';

// NOVA HIERARQUIA DE PATENTES EXPANDIDA
const calcularPatente = (nivel: number) => {
  if (nivel <= 2) return "Recruta de Aço";
  if (nivel <= 5) return "Ciborgue em Treinamento";
  if (nivel <= 9) return "Atleta Neon";
  if (nivel <= 14) return "Operário Sintético";
  if (nivel <= 19) return "Soldado de Elite";
  if (nivel <= 29) return "Mercenário Biônico";
  if (nivel <= 49) return "Ninja Cibernético";
  if (nivel <= 74) return "Samurai de Plasma";
  if (nivel <= 99) return "Titã de Carbono";
  return "Lenda Cybernética";
};

export default function RpgBar() {
  const [xpTotal, setXpTotal] = useState(0);
  const router = useRouter(); 

  // REFATORADO COM AXIOS E PROMISE.ALL
  const carregarStats = async () => {
    try {
      const [resTreinos, resDietas] = await Promise.all([
        api.get('/treinos'), 
        api.get('/dietas')
      ]);
      
      setXpTotal((resTreinos.data.length * 150) + (resDietas.data.length * 50));
    } catch (e) {
      console.log("Erro ao carregar stats da RPG Bar:", e);
    }
  };

  useFocusEffect(
    useCallback(() => { carregarStats(); }, [])
  );

  const nivelAtual = Math.floor(xpTotal / 1000) + 1;
  const xpProgresso = xpTotal % 1000;
  const porcentagem = xpProgresso / 1000;

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => router.navigate('/perfil')} 
      style={styles.rpgContainer}
    >
      <View style={styles.rpgHeader}>
        <Text style={styles.rpgNivel}>Lvl {nivelAtual}</Text>
        <Text style={styles.rpgPatente}>{calcularPatente(nivelAtual)}</Text>
        <Text style={styles.rpgXpText}>{xpProgresso} / 1000 XP</Text>
      </View>
      <View style={styles.rpgBarBg}>
        {/* Sintaxe matemática corrigida aqui 👇 */}
        <View style={[styles.rpgBarFill, { width: `${porcentagem * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  rpgContainer: { marginHorizontal: 15, marginTop: 15, marginBottom: 5, backgroundColor: '#2C2F33', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#00FFCC', elevation: 5 },
  rpgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  rpgNivel: { color: '#00FFCC', fontSize: 20, fontWeight: '900' },
  rpgPatente: { color: '#FFF', fontSize: 13, fontWeight: 'bold', fontStyle: 'italic', flex: 1, marginLeft: 10, paddingBottom: 2 },
  rpgXpText: { color: '#B0BEC5', fontSize: 12, fontWeight: 'bold', paddingBottom: 2 },
  rpgBarBg: { height: 10, backgroundColor: '#1A1A1D', borderRadius: 10, overflow: 'hidden' },
  rpgBarFill: { height: '100%', backgroundColor: '#00FFCC', borderRadius: 10 }
});