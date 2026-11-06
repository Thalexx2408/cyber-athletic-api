import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import Svg, { Circle } from 'react-native-svg'; // NOVO IMPORT DO CÍRCULO
import RpgBar from './components/RpgBar';
import api from '../services/api'; 

const mascaraData = (texto: string) => {
  const limpo = texto.replace(/\D/g, '');
  if (limpo.length > 4) return limpo.replace(/(\d{2})(\d{2})(\d)/, '$1/$2/$3').substring(0, 10);
  if (limpo.length > 2) return limpo.replace(/(\d{2})(\d)/, '$1/$2').substring(0, 10);
  return limpo;
};

const mascaraTempoTreino = (texto: string) => {
  const limpo = texto.replace(/\D/g, '');
  if (limpo.length > 4) return limpo.replace(/(\d{2})(\d{2})(\d)/, '$1:$2:$3').substring(0, 8);
  if (limpo.length > 2) return limpo.replace(/(\d{2})(\d)/, '$1:$2').substring(0, 8);
  return limpo;
};

const getDataHoje = () => {
  const h = new Date();
  return `${String(h.getDate()).padStart(2, '0')}/${String(h.getMonth() + 1).padStart(2, '0')}/${h.getFullYear()}`;
};

const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

export default function Treinos() {
  const [abaAtual, setAbaAtual] = useState('Corrida');
  const [segundos, setSegundos] = useState(0);
  const [rodando, setRodando] = useState(false);
  
  // NOVOS ESTADOS DE DISTÂNCIA BIDIRECIONAL
  const [distanciaM, setDistanciaM] = useState('');
  const [distanciaKm, setDistanciaKm] = useState('');
  
  const [tempoManual, setTempoManual] = useState(''); 
  const [dataRegistro, setDataRegistro] = useState(getDataHoje());
  const [historico, setHistorico] = useState<any[]>([]);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const ultimaPosicao = useRef<{lat: number, lon: number} | null>(null);
  const distanciaAcumulada = useRef(0);

  useEffect(() => {
    let intervalo: any;
    if (rodando) { intervalo = setInterval(() => setSegundos((s) => s + 1), 1000); }
    return () => clearInterval(intervalo);
  }, [rodando]);

  useEffect(() => {
    carregarHistorico();
    return () => { if (locationSubscription.current) locationSubscription.current.remove(); };
  }, []);

  const carregarHistorico = async () => {
    try {
      const response = await api.get('/treinos');
      setHistorico(response.data);
    } catch (e) {
      console.log("Erro ao carregar histórico:", e);
    }
  };

  // CONVERSÃO INTELIGENTE MESTRE-DISCÍPULO
  const handleMudaMetros = (texto: string) => {
    const limpo = texto.replace(/[^0-9]/g, '');
    setDistanciaM(limpo);
    const m = parseFloat(limpo);
    if (!isNaN(m)) {
      setDistanciaKm((m / 1000).toString());
      distanciaAcumulada.current = m / 1000;
    } else {
      setDistanciaKm('');
      distanciaAcumulada.current = 0;
    }
  };

  const handleMudaKm = (texto: string) => {
    const limpo = texto.replace(',', '.').replace(/[^0-9.]/g, '');
    setDistanciaKm(limpo);
    const k = parseFloat(limpo);
    if (!isNaN(k)) {
      setDistanciaM((k * 1000).toString());
      distanciaAcumulada.current = k;
    } else {
      setDistanciaM('');
      distanciaAcumulada.current = 0;
    }
  };

  const iniciarOuPausarTreino = async () => {
    if (rodando) {
      setRodando(false);
      if (locationSubscription.current) { locationSubscription.current.remove(); locationSubscription.current = null; }
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert("Permissão Negada", "Precisamos do GPS para calcular a sua rota."); return; }
      setRodando(true);
      const localAtual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      ultimaPosicao.current = { lat: localAtual.coords.latitude, lon: localAtual.coords.longitude };
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 3000, distanceInterval: 2 },
        (novaLocalizacao) => {
          if (ultimaPosicao.current) {
            const distancia = calcularDistancia(ultimaPosicao.current.lat, ultimaPosicao.current.lon, novaLocalizacao.coords.latitude, novaLocalizacao.coords.longitude);
            distanciaAcumulada.current += distancia;
            
            const novoKm = distanciaAcumulada.current.toFixed(2);
            setDistanciaKm(novoKm);
            setDistanciaM((parseFloat(novoKm) * 1000).toFixed(0)); // Sincroniza metros com o GPS
          }
          ultimaPosicao.current = { lat: novaLocalizacao.coords.latitude, lon: novaLocalizacao.coords.longitude };
        }
      );
    }
  };

  const zerarTreino = () => {
    setSegundos(0); setRodando(false); setDistanciaKm(''); setDistanciaM(''); setTempoManual(''); distanciaAcumulada.current = 0; ultimaPosicao.current = null;
    if (locationSubscription.current) { locationSubscription.current.remove(); locationSubscription.current = null; }
  };

  const formatarTempo = (seg: number) => {
    const h = Math.floor(seg / 3600); const m = Math.floor((seg % 3600) / 60); const s = seg % 60;
    return `${h < 10 ? '0'+h : h}:${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
  };

  const formatarDataExibicao = (dataIso: string) => {
    if (!dataIso) return '';
    const d = new Date(dataIso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const salvarTreino = async () => {
    const tempoFinal = tempoManual || formatarTempo(segundos);
    if (!distanciaKm || tempoFinal === "00:00:00" || dataRegistro.length !== 10) { Alert.alert("Erro", "Preencha a distância, tempo e data completos!"); return; }
    const [dia, mes, ano] = dataRegistro.split('/');
    const dataIso = `${ano}-${mes}-${dia}T12:00:00.000Z`;

    try {
      const response = await api.post('/treinos', {
        usuarioId: 1, 
        distancia: distanciaKm, 
        tempo: tempoFinal, 
        modalidade: abaAtual, 
        data: dataIso
      });
      
      const dados = response.data;
      Alert.alert("Salvo!", `🔥 Calorias gastas: ${dados.kcalGastas} kcal\n⚡ Pace: ${dados.pace}\n⭐ +150 XP!`);
      zerarTreino(); 
      setDataRegistro(getDataHoje()); 
      carregarHistorico(); 
      
    } catch (e) { 
      Alert.alert("Erro de Rede", "Falha ao conectar."); 
    }
  };

  const getCor = (mod: string) => { if(mod === 'Corrida') return '#00E676'; if(mod === 'Ciclismo') return '#00FFCC'; return '#FF0055'; };

  // LÓGICA DO CÍRCULO SVG (Preenche a cada 1km completo)
  const kmAtual = parseFloat(distanciaKm) || 0;
  const kmCompletos = Math.floor(kmAtual);
  const porcentagemCirculo = (kmAtual % 1) * 100; 
  
  const raio = 45;
  const circunferencia = 2 * Math.PI * raio;
  const strokeDashoffset = circunferencia - (porcentagemCirculo / 100) * circunferencia;

  return (
    <ScrollView style={styles.container}>
      <RpgBar />
      
      <View style={styles.tabContainer}>
        {['Corrida', 'Ciclismo', 'Caminhada'].map(m => (
          <TouchableOpacity key={m} style={[styles.tabButton, abaAtual === m && styles.tabAtiva]} onPress={() => { setAbaAtual(m); zerarTreino(); }}>
            <Text style={[styles.tabText, abaAtual === m && styles.tabTextAtivo]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.content}>
        {rodando && <Text style={styles.gpsLigado}>📍 GPS Ativo</Text>}
        <Text style={styles.timer}>{formatarTempo(segundos)}</Text>
        
        {/* CÍRCULO DE PROGRESSO (Voltas/Km) */}
        <View style={styles.circuloContainer}>
          <Svg height="100" width="100" viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r={raio} stroke="#455A64" strokeWidth="8" fill="transparent" />
            <Circle 
              cx="50" cy="50" r={raio} 
              stroke="#00FFCC" strokeWidth="8" fill="transparent"
              strokeDasharray={circunferencia}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90" origin="50, 50" 
            />
          </Svg>
          <View style={styles.circuloTextoOverlay}>
            <Text style={styles.circuloKmTexto}>{kmCompletos}</Text>
            <Text style={styles.circuloLabel}>KM</Text>
          </View>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.btn} onPress={iniciarOuPausarTreino}><Text style={styles.btnText}>{rodando ? "PAUSAR" : "INICIAR"}</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnZerar]} onPress={zerarTreino}><Text style={styles.btnText}>ZERAR</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Resumo do Treino:</Text>
          <TextInput style={styles.input} placeholder="Data (Ex: 23/09/2026)" value={dataRegistro} onChangeText={(t) => setDataRegistro(mascaraData(t))} keyboardType="numeric" maxLength={10} placeholderTextColor="#7F8C8D" />
          
          {/* INPUTS BIDIRECIONAIS EM LINHA */}
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabelMenor}>Metros (m)</Text>
              <TextInput
                style={styles.inputDuplo}
                keyboardType="numeric"
                value={distanciaM}
                onChangeText={handleMudaMetros}
                placeholder="Ex: 1500"
                placeholderTextColor="#7F8C8D"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabelMenor}>Quilômetros (km)</Text>
              <TextInput
                style={styles.inputDuplo}
                keyboardType="numeric"
                value={distanciaKm}
                onChangeText={handleMudaKm}
                placeholder="Ex: 1.5"
                placeholderTextColor="#7F8C8D"
              />
            </View>
          </View>

          <TextInput style={styles.input} placeholder="Tempo (Ex: 00:30:00)" value={tempoManual} onChangeText={(t) => setTempoManual(mascaraTempoTreino(t))} keyboardType="numeric" maxLength={8} placeholderTextColor="#7F8C8D" />
          <TouchableOpacity style={styles.btnSalvar} onPress={salvarTreino}><Text style={styles.btnSalvarText}>FINALIZAR E SALVAR</Text></TouchableOpacity>
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Meus Treinos</Text>
          {historico.map((item, index) => (
            <View key={item.id || index} style={[styles.historyCard, { borderLeftColor: getCor(item.modalidade) }]}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyModality}>{item.modalidade}</Text>
                <Text style={styles.historyDate}>{formatarDataExibicao(item.data)}</Text>
              </View>
              <View style={styles.historyBody}>
                <Text style={styles.historyStat}>📏 {item.distanciaKm} km</Text>
                <Text style={styles.historyStat}>⏱️ {item.tempoMinutos} min</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1D' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#2C2F33', elevation: 3, paddingTop: 10 },
  tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabAtiva: { borderBottomColor: '#00FFCC' },
  tabText: { fontWeight: 'bold', color: '#7F8C8D' },
  tabTextAtivo: { color: '#00FFCC' },
  content: { padding: 20, alignItems: 'center' },
  gpsLigado: { color: '#00FFCC', fontWeight: 'bold', fontSize: 16, marginTop: 10, letterSpacing: 1 },
  timer: { fontSize: 65, fontWeight: 'bold', color: '#FFF', marginVertical: 5 },
  
  // ESTILOS DO CÍRCULO E DOS INPUTS DUPLOS
  circuloContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 15 },
  circuloTextoOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  circuloKmTexto: { fontSize: 28, fontWeight: 'bold', color: '#00FFCC' },
  circuloLabel: { fontSize: 10, color: '#B0BEC5', fontWeight: 'bold', marginTop: -2 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 20 },
  inputGroup: { flex: 1 },
  inputLabelMenor: { color: '#00FFCC', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  inputDuplo: { borderBottomWidth: 1, borderColor: '#455A64', padding: 10, fontSize: 16, color: '#FFF', textAlign: 'center' },

  row: { flexDirection: 'row', gap: 15 },
  btn: { backgroundColor: '#00FFCC', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  btnZerar: { backgroundColor: '#455A64' },
  btnText: { color: '#1A1A1D', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#2C2F33', width: '100%', padding: 20, borderRadius: 15, marginTop: 25 },
  label: { fontWeight: 'bold', fontSize: 16, color: '#00FFCC', marginBottom: 15 },
  input: { borderBottomWidth: 1, borderColor: '#455A64', marginBottom: 20, padding: 10, fontSize: 16, color: '#FFF' },
  btnSalvar: { backgroundColor: '#00FFCC', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnSalvarText: { color: '#1A1A1D', fontWeight: 'bold', fontSize: 16 },
  historyContainer: { width: '100%', marginTop: 35 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#00FFCC', marginBottom: 15 },
  historyCard: { backgroundColor: '#2C2F33', padding: 15, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  historyModality: { fontWeight: 'bold', fontSize: 16, color: '#FFF' },
  historyDate: { color: '#B0BEC5', fontSize: 14 },
  historyBody: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  historyStat: { fontSize: 14, color: '#00FFCC' }
});