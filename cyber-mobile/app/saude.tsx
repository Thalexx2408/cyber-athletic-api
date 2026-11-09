import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import RpgBar from './components/RpgBar'; 
import api from '../services/api'; // <-- A IMPORTAÇÃO ESTÁ CORRETA!

const META_AGUA = 2000; 
const LIMITE_CILINDROS = 15;

const mascaraHorario = (texto: string) => {
  const limpo = texto.replace(/\D/g, '');
  if (limpo.length > 2) return limpo.replace(/(\d{2})(\d)/, '$1:$2').substring(0, 5);
  return limpo;
};

const getDataHoje = () => new Date().toISOString().split('T')[0];

export default function Saude() {
  const [titulo, setTitulo] = useState('');
  const [horario, setHorario] = useState('');
  const [repeticao, setRepeticao] = useState('diariamente');
  const [alarmes, setAlarmes] = useState<any[]>([]);
  
  const [aguaTotal, setAguaTotal] = useState(0); 
  const [dataAgua, setDataAgua] = useState(getDataHoje());
  
  const [historicoAgua, setHistoricoAgua] = useState<{horario: string, quantidade: number}[]>([]);

  useEffect(() => { 
    carregarAlarmes(); 
    if (dataAgua !== getDataHoje()) {
      setAguaTotal(0); 
      setHistoricoAgua([]); 
      setDataAgua(getDataHoje());
    }
  }, []);

  const carregarAlarmes = async () => {
    try {
      const response = await api.get('/alarmes');
      setAlarmes(response.data);
    } catch (e) { 
      console.log("Erro ao carregar protocolos (alarmes):", e); 
    }
  };

  const salvarAlarme = async () => {
    if (!titulo.trim() || horario.length !== 5) {
      Alert.alert("Erro", "Preencha o título e o horário completo (Ex: 08:30)");
      return;
    }
    try {
      await api.post('/alarmes', { 
        usuarioId: 1, 
        titulo, 
        horario, 
        repeticao 
      });
      
      Alert.alert("Sucesso", "Protocolo salvo no sistema!");
      setTitulo(''); 
      setHorario(''); 
      setRepeticao('diariamente'); 
      carregarAlarmes();
      
    } catch (e) { 
      Alert.alert("Erro", "Falha na conexão."); 
    }
  };

  const adicionarAgua = (quantidade: number) => {
    const agora = new Date();
    const horaStr = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    setAguaTotal(prev => {
      const novoTotal = prev + quantidade;
      const capacidadeMaxima = LIMITE_CILINDROS * META_AGUA;
      
      if (prev >= capacidadeMaxima) {
        Alert.alert("Capacidade Máxima", "Limite diário de 15 cilindros atingido! Seus sistemas estão totalmente operacionais.");
        return prev;
      }

      setHistoricoAgua(h => [{ horario: horaStr, quantidade }, ...h]);
      
      return novoTotal > capacidadeMaxima ? capacidadeMaxima : novoTotal;
    });
  };

  const cilindrosCompletos = Math.floor(aguaTotal / META_AGUA);
  const aguaAtual = aguaTotal % META_AGUA;
  const nivelAgua = aguaTotal >= (LIMITE_CILINDROS * META_AGUA) ? 100 : (aguaAtual / META_AGUA) * 100;

  return (
    <ScrollView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginBottom: 10 }}><RpgBar /></View>

      <Text style={styles.title}>Saúde & Manutenção</Text>

      <View style={styles.hydroContainer}>
        <Text style={styles.hydroTitle}>Hidratação Diária (Máx: 15)</Text>
        
        <View style={styles.estoqueContainer}>
          {Array.from({ length: cilindrosCompletos }).map((_, i) => (
            <View key={i} style={styles.miniCylinder}>
              <View style={styles.miniCylinderFill} />
              <Text style={styles.miniCylinderText}>100%</Text>
            </View>
          ))}
        </View>

        <View style={styles.cylinderOutline}>
          <View style={[styles.cylinderFill, { height: `${nivelAgua}%` }]} />
          <Text style={styles.hydroText}>
            {aguaTotal >= (LIMITE_CILINDROS * META_AGUA) ? "MÁX" : `${aguaAtual} / ${META_AGUA}`} ml
          </Text>
        </View>

        <Text style={styles.totalAguaText}>Total hoje: {aguaTotal} ml</Text>

        <View style={styles.hydroButtons}>
          <TouchableOpacity style={styles.hydroBtn} onPress={() => adicionarAgua(250)}>
            <Text style={styles.hydroBtnText}>+250ml 💧</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.hydroBtn} onPress={() => adicionarAgua(500)}>
            <Text style={styles.hydroBtnText}>+500ml 🥤</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabelaContainer, { borderColor: '#00BFFF', width: '100%', marginTop: 25 }]}>
          <View style={[styles.tabelaHeader, { borderBottomColor: '#00BFFF' }]}>
            <Text style={[styles.tabelaHeaderText, { flex: 1 }]}>Horário</Text>
            <Text style={[styles.tabelaHeaderText, { flex: 1, textAlign: 'right' }]}>Quantidade</Text>
          </View>
          {historicoAgua.length === 0 ? (
            <Text style={styles.tabelaVazio}>Nenhum registro de hidratação hoje.</Text>
          ) : (
            historicoAgua.map((item, index) => (
              <View key={index} style={styles.tabelaRow}>
                <Text style={[styles.tabelaCellText, { flex: 1, color: '#B0BEC5' }]}>{item.horario}</Text>
                <Text style={[styles.tabelaCellText, { flex: 1, textAlign: 'right', color: '#00BFFF', fontWeight: 'bold' }]}>+{item.quantidade} ml</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={[styles.label, { color: '#FF0055', fontSize: 16, marginBottom: 15 }]}>Novo Protocolo (Alarme)</Text>
        <TextInput style={styles.input} placeholder="Ex: Tomar Creatina" placeholderTextColor="#7F8C8D" value={titulo} onChangeText={setTitulo} />
        
        <Text style={styles.label}>Horário:</Text>
        <TextInput style={styles.input} placeholder="0830 (vira 08:30)" placeholderTextColor="#7F8C8D" value={horario} onChangeText={(texto) => setHorario(mascaraHorario(texto))} keyboardType="numeric" maxLength={5} />
        
        <Text style={styles.label}>Repetição:</Text>
        <View style={styles.repRow}>
          {['nenhuma', 'diariamente', 'semanalmente'].map(r => (
            <TouchableOpacity key={r} style={[styles.repBtn, repeticao === r && styles.repBtnAtivo]} onPress={() => setRepeticao(r)}>
              <Text style={[styles.repText, repeticao === r && styles.repTextAtivo]}>
                {r === 'nenhuma' ? 'Uma Vez' : r === 'diariamente' ? 'Todo Dia' : 'Toda Semana'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btnSalvar} onPress={salvarAlarme}>
          <Text style={styles.btnSalvarText}>SALVAR PROTOCOLO</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tabelaContainer, { borderColor: '#FF0055', marginBottom: 40 }]}>
        <Text style={[styles.title, { fontSize: 18, color: '#FF0055', marginBottom: 15, marginTop: 0 }]}>Protocolos Ativos</Text>
        
        <View style={[styles.tabelaHeader, { borderBottomColor: '#455A64' }]}>
          <Text style={[styles.tabelaHeaderText, { flex: 2 }]}>Protocolo</Text>
          <Text style={[styles.tabelaHeaderText, { flex: 1, textAlign: 'center' }]}>Horário</Text>
          <Text style={[styles.tabelaHeaderText, { flex: 1.5, textAlign: 'right' }]}>Freq.</Text>
        </View>

        {alarmes.length === 0 ? (
          <Text style={styles.tabelaVazio}>Nenhum protocolo configurado.</Text>
        ) : (
          alarmes.map((item, index) => (
            <View key={item.id || index} style={styles.tabelaRow}>
              <Text style={[styles.tabelaCellText, { flex: 2, color: '#FFF' }]} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={[styles.tabelaCellText, { flex: 1, textAlign: 'center', color: '#B0BEC5' }]}>
                {item.horario}
              </Text>
              <Text style={[styles.tabelaCellText, { flex: 1.5, textAlign: 'right', color: '#FF0055', fontWeight: 'bold' }]}>
                {item.repeticao === 'nenhuma' ? '1x' : item.repeticao === 'diariamente' ? 'Diário' : 'Semanal'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1D', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#00FFCC', textAlign: 'center', marginVertical: 20 },
  
  hydroContainer: { backgroundColor: '#2C2F33', padding: 25, borderRadius: 15, alignItems: 'center', marginBottom: 30, elevation: 5, borderWidth: 1, borderColor: '#00BFFF' },
  hydroTitle: { color: '#00BFFF', fontSize: 15, fontWeight: 'bold', marginBottom: 15 },
  estoqueContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 15, justifyContent: 'center' },
  miniCylinder: { width: 30, height: 60, borderColor: '#00BFFF', borderWidth: 2, borderRadius: 15, overflow: 'hidden', justifyContent: 'flex-end' },
  miniCylinderFill: { width: '100%', height: '100%', backgroundColor: '#00BFFF' },
  miniCylinderText: { position: 'absolute', bottom: 20, left: 1, fontSize: 8, fontWeight: 'bold', color: '#1A1A1D' },
  cylinderOutline: { width: 110, height: 220, borderColor: '#00BFFF', borderWidth: 3, borderRadius: 55, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center', backgroundColor: '#1A1A1D' },
  cylinderFill: { width: '100%', backgroundColor: 'rgba(0, 191, 255, 0.75)', position: 'absolute', bottom: 0 },
  hydroText: { position: 'absolute', top: '45%', color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  totalAguaText: { color: '#00BFFF', marginTop: 15, fontWeight: 'bold' },
  hydroButtons: { flexDirection: 'row', gap: 15, marginTop: 15 },
  hydroBtn: { backgroundColor: 'rgba(0, 191, 255, 0.1)', borderColor: '#00BFFF', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  hydroBtnText: { color: '#00BFFF', fontWeight: 'bold', fontSize: 15 },
  
  card: { backgroundColor: '#2C2F33', padding: 20, borderRadius: 15, marginBottom: 30 },
  label: { fontWeight: 'bold', color: '#B0BEC5', marginBottom: 8, marginTop: 10 },
  input: { borderBottomWidth: 1, borderColor: '#455A64', color: '#FFF', marginBottom: 10, paddingVertical: 8, fontSize: 16 },
  repRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, marginTop: 5 },
  repBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#455A64', borderRadius: 8, marginHorizontal: 3, alignItems: 'center' },
  repBtnAtivo: { backgroundColor: 'rgba(255, 0, 85, 0.2)', borderColor: '#FF0055' },
  repText: { color: '#B0BEC5', fontSize: 12, fontWeight: 'bold' },
  repTextAtivo: { color: '#FF0055' },
  btnSalvar: { backgroundColor: '#FF0055', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnSalvarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  tabelaContainer: { backgroundColor: '#2C2F33', borderRadius: 12, padding: 15, borderWidth: 1 },
  tabelaHeader: { flexDirection: 'row', borderBottomWidth: 2, paddingBottom: 10, marginBottom: 10 },
  tabelaHeaderText: { color: '#B0BEC5', fontSize: 13, fontWeight: 'bold' },
  tabelaRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(69, 90, 100, 0.4)' },
  tabelaCellText: { fontSize: 14 },
  tabelaVazio: { color: '#7F8C8D', textAlign: 'center', fontStyle: 'italic', paddingVertical: 15 }
});