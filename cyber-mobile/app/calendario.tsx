import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import RpgBar from './components/RpgBar';
// IMPORTAÇÃO DA NOSSA API CENTRALIZADA
import api from '../services/api';

LocaleConfig.locales['pt'] = {
  monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
  dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  today: 'Hoje'
};
LocaleConfig.defaultLocale = 'pt';

const mascaraHorario = (texto: string) => {
  const limpo = texto.replace(/\D/g, '');
  if (limpo.length > 2) return limpo.replace(/(\d{2})(\d)/, '$1:$2').substring(0, 5);
  return limpo;
};

const mascaraTempoTreino = (texto: string) => {
  const limpo = texto.replace(/\D/g, '');
  if (limpo.length > 4) return limpo.replace(/(\d{2})(\d{2})(\d)/, '$1:$2:$3').substring(0, 8);
  if (limpo.length > 2) return limpo.replace(/(\d{2})(\d)/, '$1:$2').substring(0, 8);
  return limpo;
};

export default function Calendario() {
  const [selected, setSelected] = useState('');
  const [treinos, setTreinos] = useState<any[]>([]);
  const [dietas, setDietas] = useState<any[]>([]);
  const [alarmes, setAlarmes] = useState<any[]>([]);
  const [filtroAtivo, setFiltroAtivo] = useState<'Todos' | 'Treinos' | 'Dietas' | 'Lembretes'>('Todos');
  const [modalTreinoVisible, setModalTreinoVisible] = useState(false);
  const [modalDietaVisible, setModalDietaVisible] = useState(false);

  const [modalidade, setModalidade] = useState('Corrida');
  const [km, setKm] = useState('');
  const [tempo, setTempo] = useState('');
  const [alimento, setAlimento] = useState('');
  const [horario, setHorario] = useState('');
  const [repeticaoDieta, setRepeticaoDieta] = useState('nenhuma');

  useEffect(() => { 
    carregarDadosGlobais(); 
    const hoje = new Date().toISOString().split('T')[0]; 
    setSelected(hoje); 
  }, []);

  // REFATORADO COM AXIOS E PROMISE.ALL PARA MÁXIMA VELOCIDADE
  const carregarDadosGlobais = async () => {
    try {
      const [resTreinos, resDietas, resAlarmes] = await Promise.all([ 
        api.get('/treinos'), 
        api.get('/dietas'), 
        api.get('/alarmes') 
      ]);
      
      setTreinos(resTreinos.data);
      setDietas(resDietas.data);
      setAlarmes(resAlarmes.data);
    } catch (e) { 
      console.log("Erro ao carregar os dados do calendário:", e); 
    }
  };

  // REFATORADO COM AXIOS
  const salvarTreinoRapido = async () => {
    if (!km || !tempo) { Alert.alert("Erro", "Preencha a distância e o tempo!"); return; }
    const dataIso = `${selected}T12:00:00.000Z`;
    try {
      await api.post('/treinos', { 
        usuarioId: 1, 
        distancia: km, 
        tempo, 
        modalidade, 
        data: dataIso 
      });
      
      Alert.alert("Sucesso", "Treino salvo! +150 XP ⭐"); 
      setModalTreinoVisible(false); 
      setKm(''); 
      setTempo(''); 
      carregarDadosGlobais(); 
      
    } catch (e) { 
      Alert.alert("Erro", "Falha de conexão."); 
    }
  };

  // REFATORADO COM AXIOS
  const salvarDietaRapida = async () => {
    if (!alimento || horario.length !== 5) { Alert.alert("Erro", "Preencha o alimento e o horário completo!"); return; }
    const partesHora = horario.split(':');
    const horarioCompletoISO = `${selected}T${partesHora[0]}:${partesHora[1]}:00.000Z`; 
    
    try {
      const response = await api.post('/dietas', { 
        usuarioId: 1, 
        alimento, 
        horario: horarioCompletoISO, 
        repeticao: repeticaoDieta 
      });
      
      const dados = response.data;
      Alert.alert("Sucesso", `Dieta salva!\n📅 Agendamentos: ${dados.geradas || 1}\n⭐ +50 XP!`); 
      setModalDietaVisible(false); 
      setAlimento(''); 
      setHorario(''); 
      setRepeticaoDieta('nenhuma'); 
      carregarDadosGlobais(); 
      
    } catch (e) { 
      Alert.alert("Erro", "Falha de conexão."); 
    }
  };

  const markedDates: any = {};
  if (filtroAtivo === 'Todos' || filtroAtivo === 'Treinos') { treinos.forEach(t => { if (t.data) { const d = t.data.split('T')[0]; if (!markedDates[d]) markedDates[d] = { dots: [] }; markedDates[d].dots.push({ key: `t-${t.id}`, color: '#00FFCC' }); } }); }
  if (filtroAtivo === 'Todos' || filtroAtivo === 'Dietas') { dietas.forEach(d => { if (d.horario) { const dStr = d.horario.split('T')[0]; if (!markedDates[dStr]) markedDates[dStr] = { dots: [] }; markedDates[dStr].dots.push({ key: `d-${d.id}`, color: '#00E676' }); } }); }
  if (markedDates[selected]) markedDates[selected] = { ...markedDates[selected], selected: true, selectedColor: '#34495E' };
  else markedDates[selected] = { selected: true, selectedColor: '#34495E' };

  const treinosDoDia = treinos.filter(t => t.data && t.data.startsWith(selected));
  const dietasDoDia = dietas.filter(d => d.horario && d.horario.startsWith(selected));
  const dataFormatada = selected.split('-').reverse().join('/');

  return (
    <View style={styles.container}>
      <ScrollView>
        <RpgBar />
        <Text style={styles.title}>Painel Central</Text>
        <View style={styles.filterRow}>
          {['Todos', 'Treinos', 'Dietas', 'Lembretes'].map((f) => (
            <TouchableOpacity key={f} style={[styles.filterBtn, filtroAtivo === f && styles.filterBtnActive]} onPress={() => setFiltroAtivo(f as any)}>
              <Text style={[styles.filterText, filtroAtivo === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Calendar
          onDayPress={(day: any) => setSelected(day.dateString)} markedDates={markedDates} markingType={'multi-dot'}
          theme={{ backgroundColor: '#1A1A1D', calendarBackground: '#2C2F33', textSectionTitleColor: '#00FFCC', selectedDayBackgroundColor: '#455A64', selectedDayTextColor: '#FFF', todayTextColor: '#FF0055', dayTextColor: '#FFF', textDisabledColor: '#455A64', monthTextColor: '#00FFCC', arrowColor: '#00FFCC' }}
          style={styles.calendar}
        />

        <View style={styles.detailsContainer}>
          <Text style={styles.dateTitle}>Registros de {dataFormatada}</Text>
          <View style={styles.quickActionRow}>
            <TouchableOpacity style={styles.btnQuickTreino} onPress={() => setModalTreinoVisible(true)}><Text style={styles.btnQuickText}>➕ Adicionar Treino</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnQuickDieta} onPress={() => setModalDietaVisible(true)}><Text style={styles.btnQuickText}>➕ Adicionar Dieta</Text></TouchableOpacity>
          </View>

          {(filtroAtivo === 'Todos' || filtroAtivo === 'Treinos') && treinosDoDia.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: '#00FFCC'}]}>🏃‍♂️ Treinos</Text>
              {treinosDoDia.map((t, i) => (
                <View key={i} style={[styles.card, { borderLeftColor: '#00FFCC' }]}>
                  <Text style={styles.cardText}>{t.modalidade} - {t.distanciaKm}km</Text>
                  <Text style={styles.cardSub}>🔥 {t.caloriasGastas} kcal</Text>
                </View>
              ))}
            </View>
          )}
          
          {(filtroAtivo === 'Todos' || filtroAtivo === 'Dietas') && dietasDoDia.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: '#00E676'}]}>🥗 Alimentação</Text>
              {dietasDoDia.map((d, i) => (
                <View key={i} style={[styles.card, { borderLeftColor: '#00E676' }]}>
                  <Text style={styles.cardText}>{d.alimento}</Text>
                  <Text style={styles.cardSub}>Às {new Date(d.horario).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} ⚡ {d.caloriasIngeridas} kcal</Text>
                </View>
              ))}
            </View>
          )}
          
          {(filtroAtivo === 'Todos' || filtroAtivo === 'Lembretes') && alarmes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, {color: '#FF0055'}]}>⏰ Lembretes</Text>
              {alarmes.map((a, i) => (
                <View key={i} style={[styles.card, { borderLeftColor: '#FF0055' }]}>
                  <Text style={styles.cardText}>{a.titulo}</Text>
                  <Text style={styles.cardSub}>Todos os dias às {a.horario}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAIS */}
      <Modal visible={modalTreinoVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Treino em {dataFormatada}</Text>
            <View style={styles.modalTabRow}>
              {['Corrida', 'Ciclismo', 'Caminhada'].map(m => (
                <TouchableOpacity key={m} onPress={() => setModalidade(m)} style={[styles.modalTabBtn, modalidade === m && { borderBottomColor: '#00FFCC' }]}>
                  <Text style={[styles.modalTabText, modalidade === m && { color: '#00FFCC' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.modalInput} placeholder="Distância (km)" keyboardType="numeric" placeholderTextColor="#7F8C8D" value={km} onChangeText={setKm} />
            <TextInput style={styles.modalInput} placeholder="Tempo (Ex: 003000)" value={tempo} onChangeText={(t) => setTempo(mascaraTempoTreino(t))} keyboardType="numeric" maxLength={8} placeholderTextColor="#7F8C8D" />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalTreinoVisible(false)}><Text style={styles.modalBtnCancelText}>CANCELAR</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSaveTreino} onPress={salvarTreinoRapido}><Text style={styles.modalBtnSaveText}>SALVAR</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalDietaVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, {color: '#00E676'}]}>Refeição em {dataFormatada}</Text>
            <TextInput style={styles.modalInput} placeholder="Alimento (Ex: Pão)" placeholderTextColor="#7F8C8D" value={alimento} onChangeText={setAlimento} />
            <TextInput style={styles.modalInput} placeholder="Horário (Ex: 0830)" value={horario} onChangeText={(t) => setHorario(mascaraHorario(t))} keyboardType="numeric" maxLength={5} placeholderTextColor="#7F8C8D" />
            
            <Text style={{color: '#00E676', fontWeight: 'bold', marginBottom: 10, alignSelf: 'flex-start'}}>Repetir:</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, width: '100%'}}>
              {['nenhuma', 'diariamente', 'semanalmente'].map(r => (
                <TouchableOpacity key={r} style={[{flex: 1, padding: 10, borderWidth: 1, borderColor: '#455A64', borderRadius: 8, marginHorizontal: 2, alignItems: 'center'}, repeticaoDieta === r && {backgroundColor: 'rgba(0,230,118,0.2)', borderColor: '#00E676'}]} onPress={() => setRepeticaoDieta(r)}>
                  <Text style={[{color: '#B0BEC5', fontSize: 11, fontWeight: 'bold'}, repeticaoDieta === r && {color: '#00E676'}]}>{r === 'nenhuma' ? 'Não' : r === 'diariamente' ? 'Todo Dia' : 'Toda Sem.'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalDietaVisible(false)}><Text style={styles.modalBtnCancelText}>CANCELAR</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSaveDieta} onPress={salvarDietaRapida}><Text style={styles.modalBtnSaveText}>SALVAR</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1D' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#00FFCC', textAlign: 'center', marginTop: 20, marginBottom: 15 },
  filterRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15, paddingHorizontal: 10, gap: 5 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#455A64', backgroundColor: '#2C2F33' },
  filterBtnActive: { backgroundColor: '#00FFCC', borderColor: '#00FFCC' },
  filterText: { color: '#B0BEC5', fontSize: 13, fontWeight: 'bold' },
  filterTextActive: { color: '#1A1A1D' },
  calendar: { borderRadius: 15, marginHorizontal: 15, elevation: 4 },
  detailsContainer: { padding: 20 },
  dateTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#455A64', paddingBottom: 10 },
  quickActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  btnQuickTreino: { flex: 1, backgroundColor: 'rgba(0, 255, 204, 0.1)', borderColor: '#00FFCC', borderWidth: 1, padding: 12, borderRadius: 8, marginRight: 10, alignItems: 'center' },
  btnQuickDieta: { flex: 1, backgroundColor: 'rgba(0, 230, 118, 0.1)', borderColor: '#00E676', borderWidth: 1, padding: 12, borderRadius: 8, marginLeft: 10, alignItems: 'center' },
  btnQuickText: { color: '#FFF', fontWeight: 'bold' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  card: { backgroundColor: '#2C2F33', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 5 },
  cardText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cardSub: { color: '#B0BEC5', fontSize: 14, marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#2C2F33', borderRadius: 15, padding: 20, elevation: 10, borderWidth: 1, borderColor: '#455A64' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#00FFCC', textAlign: 'center', marginBottom: 20 },
  modalTabRow: { flexDirection: 'row', marginBottom: 20 },
  modalTabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  modalTabText: { color: '#7F8C8D', fontWeight: 'bold' },
  modalInput: { backgroundColor: '#1A1A1D', color: '#FFF', borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#455A64' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  modalBtnCancelText: { color: '#FF0055', fontWeight: 'bold' },
  modalBtnSaveTreino: { flex: 1, backgroundColor: '#00FFCC', padding: 15, borderRadius: 8, alignItems: 'center' },
  modalBtnSaveDieta: { flex: 1, backgroundColor: '#00E676', padding: 15, borderRadius: 8, alignItems: 'center' },
  modalBtnSaveText: { color: '#1A1A1D', fontWeight: 'bold' }
});