import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import RpgBar from './components/RpgBar'; 
import api from '../services/api'; 

const mascaraHorario = (texto: string) => {
  const limpo = texto.replace(/\D/g, '');
  if (limpo.length > 2) return limpo.replace(/(\d{2})(\d)/, '$1:$2').substring(0, 5);
  return limpo;
};

const mascaraData = (texto: string) => {
  const limpo = texto.replace(/\D/g, '');
  if (limpo.length > 4) return limpo.replace(/(\d{2})(\d{2})(\d)/, '$1/$2/$3').substring(0, 10);
  if (limpo.length > 2) return limpo.replace(/(\d{2})(\d)/, '$1/$2').substring(0, 10);
  return limpo;
};

const getDataHoje = () => {
  const h = new Date();
  return `${String(h.getDate()).padStart(2, '0')}/${String(h.getMonth() + 1).padStart(2, '0')}/${h.getFullYear()}`;
};

// Função para extrair apenas a hora da string ISO do banco de dados
const formatarHorarioExibicao = (dataIso: string) => {
  if (!dataIso) return '--:--';
  if (!dataIso.includes('T')) return dataIso; // Caso já venha formatado
  const data = new Date(dataIso);
  return `${String(data.getUTCHours()).padStart(2, '0')}:${String(data.getUTCMinutes()).padStart(2, '0')}`;
};

export default function Dieta() {
  const [alimento, setAlimento] = useState('');
  const [horario, setHorario] = useState('');
  const [dataRegistro, setDataRegistro] = useState(getDataHoje());
  const [repeticao, setRepeticao] = useState('nenhuma'); 
  const [historico, setHistorico] = useState<any[]>([]);
  
  const [favoritos, setFavoritos] = useState<string[]>(['Whey + Morango', 'Creatina']);

  useEffect(() => { carregarHistorico(); }, []);

  const carregarHistorico = async () => {
    try {
      const response = await api.get('/dietas');
      setHistorico(response.data);
    } catch (e) {
      console.log("Erro ao carregar histórico de dieta:", e);
    }
  };

  const adicionarFavorito = () => {
    if (alimento.trim() === '') { Alert.alert("Aviso", "Digite um alimento primeiro para favoritar."); return; }
    if (!favoritos.includes(alimento)) {
      setFavoritos([alimento, ...favoritos]);
    }
  };

  const salvarDieta = async () => {
    if (!alimento || horario.length !== 5 || dataRegistro.length !== 10) {
      Alert.alert("Atenção", "Preencha a data e horário completos!"); return;
    }
    const [dia, mes, ano] = dataRegistro.split('/');
    const horarioCompletoISO = `${ano}-${mes}-${dia}T${horario}:00.000Z`;
    
    try {
      const response = await api.post('/dietas', { 
        usuarioId: 1, 
        alimento, 
        horario: horarioCompletoISO, 
        repeticao 
      });
      
      const dados = response.data;
      Alert.alert("Refeição Registrada!", `🔥 ${dados.kcalCalculada || 0} kcal\n📅 Eventos: ${dados.geradas || 1}\n⭐ +50 XP!`);
      
      setAlimento(''); 
      setHorario(''); 
      setDataRegistro(getDataHoje()); 
      setRepeticao('nenhuma'); 
      carregarHistorico();
      
    } catch (e) { 
      Alert.alert("Erro de Rede", "Falha ao conectar."); 
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={{ marginHorizontal: -20, marginBottom: 10 }}><RpgBar /></View>
      <Text style={styles.title}>Minha Nutrição</Text>

      {/* ADENDO NUTRICIONAL */}
      <Text style={styles.disclaimer}>
        ⚠️ Aviso: O Cyber Athletic é uma ferramenta de gestão e gamificação desportiva. Este aplicativo não substitui o diagnóstico ou acompanhamento profissional de um nutricionista.
      </Text>

      <Text style={styles.slotTitle}>Meus Favoritos (Inventário Rápido)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotContainer}>
        {favoritos.map((fav, idx) => (
          <TouchableOpacity key={idx} style={styles.slotBtn} onPress={() => setAlimento(fav)}>
            <Text style={styles.slotText}>{fav}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <TextInput style={styles.input} placeholder="Data (Ex: 23/09/2026)" value={dataRegistro} onChangeText={(t) => setDataRegistro(mascaraData(t))} keyboardType="numeric" maxLength={10} placeholderTextColor="#7F8C8D" />
        
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, {flex: 1, marginBottom: 0, borderBottomWidth: 0}]} placeholder="O que consumiu?" value={alimento} onChangeText={setAlimento} placeholderTextColor="#7F8C8D" />
          <TouchableOpacity style={styles.btnFav} onPress={adicionarFavorito}>
            <Text style={styles.btnFavText}>⭐ Salvar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputLine} />

        <TextInput style={styles.input} placeholder="Horário (Ex: 08:30)" value={horario} onChangeText={(t) => setHorario(mascaraHorario(t))} keyboardType="numeric" maxLength={5} placeholderTextColor="#7F8C8D" />
        
        <Text style={styles.label}>Frequência desta refeição:</Text>
        <View style={styles.repRow}>
          {['nenhuma', 'diariamente', 'semanalmente'].map(r => (
            <TouchableOpacity key={r} style={[styles.repBtn, repeticao === r && styles.repBtnAtivo]} onPress={() => setRepeticao(r)}>
              <Text style={[styles.repText, repeticao === r && styles.repTextAtivo]}>{r === 'nenhuma' ? 'Uma Vez' : r === 'diariamente' ? 'Todo Dia' : 'Toda Semana'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={salvarDieta}>
          <Text style={styles.btnText}>REGISTRAR REFEIÇÃO</Text>
        </TouchableOpacity>
      </View>

      {/* NOVA TABELA DE HISTÓRICO NUTRICIONAL */}
      <View style={styles.tabelaContainer}>
        <Text style={styles.tabelaTitulo}>Cronograma Nutricional</Text>
        
        <View style={styles.tabelaHeader}>
          <Text style={[styles.tabelaHeaderText, { flex: 2 }]}>Alimento</Text>
          <Text style={[styles.tabelaHeaderText, { flex: 1, textAlign: 'center' }]}>Horário</Text>
          <Text style={[styles.tabelaHeaderText, { flex: 1.5, textAlign: 'right' }]}>Freq.</Text>
        </View>

        {historico.length === 0 ? (
          <Text style={styles.tabelaVazio}>Nenhuma refeição planeada.</Text>
        ) : (
          historico.map((item, index) => (
            <View key={item.id || index} style={styles.tabelaRow}>
              <Text style={[styles.tabelaCellText, { flex: 2, color: '#FFF' }]} numberOfLines={1}>
                {item.alimento}
              </Text>
              <Text style={[styles.tabelaCellText, { flex: 1, textAlign: 'center', color: '#B0BEC5' }]}>
                {formatarHorarioExibicao(item.horario)}
              </Text>
              <Text style={[styles.tabelaCellText, { flex: 1.5, textAlign: 'right', color: '#00E676', fontWeight: 'bold' }]}>
                {item.repeticao === 'nenhuma' ? 'Hoje' : item.repeticao === 'diariamente' ? 'Diário' : 'Semanal'}
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
  title: { fontSize: 26, fontWeight: 'bold', color: '#00FFCC', marginBottom: 5, textAlign: 'center' },
  disclaimer: { color: '#7F8C8D', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginBottom: 20, paddingHorizontal: 10, lineHeight: 16 },
  slotTitle: { color: '#B0BEC5', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  slotContainer: { marginBottom: 25 },
  slotBtn: { backgroundColor: 'rgba(0, 230, 118, 0.1)', borderWidth: 1, borderColor: '#00E676', padding: 12, borderRadius: 12, marginRight: 10, justifyContent: 'center' },
  slotText: { color: '#00E676', fontSize: 13, fontWeight: 'bold' },
  card: { backgroundColor: '#2C2F33', padding: 20, borderRadius: 15, marginBottom: 10 },
  input: { borderBottomWidth: 1, borderColor: '#455A64', color: '#FFF', marginBottom: 20, padding: 10, fontSize: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  inputLine: { height: 1, backgroundColor: '#455A64', marginBottom: 20 },
  btnFav: { backgroundColor: '#455A64', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  btnFavText: { color: '#FFD700', fontWeight: 'bold', fontSize: 12 },
  label: { color: '#00E676', fontWeight: 'bold', marginBottom: 10, marginTop: -5 },
  repRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  repBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#455A64', borderRadius: 8, marginHorizontal: 3, alignItems: 'center' },
  repBtnAtivo: { backgroundColor: 'rgba(0, 230, 118, 0.2)', borderColor: '#00E676' },
  repText: { color: '#B0BEC5', fontSize: 12, fontWeight: 'bold' },
  repTextAtivo: { color: '#00E676' },
  btn: { backgroundColor: '#00E676', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#1A1A1D', fontWeight: 'bold', fontSize: 16 },
  
  // ESTILOS DA NOVA TABELA
  tabelaContainer: { marginTop: 10, backgroundColor: '#2C2F33', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#00E676', marginBottom: 40 },
  tabelaTitulo: { fontSize: 18, fontWeight: 'bold', color: '#00E676', marginBottom: 15, textAlign: 'center' },
  tabelaHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#455A64', paddingBottom: 10, marginBottom: 10 },
  tabelaHeaderText: { color: '#B0BEC5', fontSize: 13, fontWeight: 'bold' },
  tabelaRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(69, 90, 100, 0.4)' },
  tabelaCellText: { fontSize: 14 },
  tabelaVazio: { color: '#7F8C8D', textAlign: 'center', fontStyle: 'italic', paddingVertical: 15 }
});