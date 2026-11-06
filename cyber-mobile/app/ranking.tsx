import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import RpgBar from './components/RpgBar'; 
import api from '../services/api';

const MEU_ID = 1; // ID do utilizador atual

export default function Ranking() {
  // --- ESTADOS DA NOVA ABA (LEADERBOARD E NAVEGAÇÃO) ---
  const [abaAtiva, setAbaAtiva] = useState('Grupos'); // Começa nos Grupos para manter o foco original
  const [leaderboard, setLeaderboard] = useState([
    { id: '1', nome: 'Thalexx2408', nivel: 15, xp: 14500, avatar: '👑', rank: 1 },
    { id: '2', nome: 'Ciborgue Mutante', nivel: 12, xp: 11200, avatar: '🤖', rank: 2 },
    { id: '3', nome: 'Atleta Neon', nivel: 10, xp: 9500, avatar: '🏃', rank: 3 },
    { id: '4', nome: 'Samurai Sintético', nivel: 8, xp: 7800, avatar: '🥷', rank: 4 },
    { id: '5', nome: 'Utilizador Sem Nome', nivel: 1, xp: 1450, avatar: '👤', rank: 5 },
  ]);

  // --- ESTADOS ORIGINAIS DE GRUPOS DO MESTRE ---
  const [grupos, setGrupos] = useState<any[]>([]);
  const [modalCriar, setModalCriar] = useState(false);
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [descricao, setDescricao] = useState('');
  
  const [grupoSelecionado, setGrupoSelecionado] = useState<any>(null);
  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');

  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<any[]>([]);
  const [membrosSelecionados, setMembrosSelecionados] = useState<number[]>([MEU_ID]);

  useEffect(() => {
    carregarGrupos();
    carregarUsuarios();
  }, []);

  const carregarGrupos = async () => {
    try {
      const res = await api.get(`/usuarios/${MEU_ID}`);
      setGrupos(res.data.grupos || []);
    } catch (e) {
      console.log("Erro ao carregar grupos:", e);
    }
  };

  const carregarUsuarios = async () => {
    setUsuariosDisponiveis([
      { id: 2, nomeUsuario: 'CyberNinja_99', fotoPerfil: '🦾' },
      { id: 3, nomeUsuario: 'Alex Runner', fotoPerfil: '⚡' },
      { id: 4, nomeUsuario: 'Sarah_Fit', fotoPerfil: '🔥' },
    ]);
  };

  const criarGrupoReal = async () => {
    if (!nomeGrupo.trim()) {
      Alert.alert("Erro", "Insira um nome para o grupo.");
      return;
    }
    try {
      await api.post('/grupos', { nome: nomeGrupo, descricao, adminId: MEU_ID });
      Alert.alert("Sucesso", "Grupo criado com sucesso!");
      setNomeGrupo(''); 
      setDescricao(''); 
      setModalCriar(false);
      carregarGrupos();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível criar o grupo.");
    }
  };

  const sairDoGrupo = async (grupoId: number) => {
    try {
      await api.post('/grupos/sair', { grupoId, usuarioId: MEU_ID });
      Alert.alert("Aviso", "Você saiu do grupo.");
      setGrupoSelecionado(null);
      carregarGrupos();
    } catch (e) {
      Alert.alert("Erro", "Falha ao sair do grupo.");
    }
  };

  const salvarEdicao = async () => {
    try {
      const res = await api.put(`/grupos/${grupoSelecionado.id}`, { nome: novoNome, descricao: novaDescricao, usuarioId: MEU_ID });
      setGrupoSelecionado(res.data);
      setEditando(false);
      carregarGrupos();
      Alert.alert("Sucesso", "Grupo atualizado!");
    } catch (e: any) {
      const erroMsg = e.response?.data?.erro || "Erro na conexão.";
      Alert.alert("Erro", erroMsg);
    }
  };

  const promoverAdmin = async (novoAdminId: number) => {
    try {
      const res = await api.put(`/grupos/${grupoSelecionado.id}/promover`, { novoAdminId, usuarioId: MEU_ID });
      setGrupoSelecionado(res.data);
      Alert.alert("Sucesso", "Novo administrador definido!");
    } catch (e: any) {
      const erroMsg = e.response?.data?.erro || "Erro na conexão.";
      Alert.alert("Erro", erroMsg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={{ marginHorizontal: -20, marginBottom: 10 }}><RpgBar /></View>
      
      <Text style={styles.title}>Rede Neural & Grupos</Text>
      
      {/* ABAS DE NAVEGAÇÃO INTERNA */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tabBtn, abaAtiva === 'Global' && styles.tabAtiva]} onPress={() => setAbaAtiva('Global')}>
          <Text style={abaAtiva === 'Global' ? styles.tabTextAtiva : styles.tabText}>🏆 Global</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, abaAtiva === 'Grupos' && styles.tabAtiva]} onPress={() => setAbaAtiva('Grupos')}>
          <Text style={abaAtiva === 'Grupos' ? styles.tabTextAtiva : styles.tabText}>🛡️ Meus Grupos</Text>
        </TouchableOpacity>
      </View>

      {/* --- CONTEÚDO DA ABA: GLOBAL (LEADERBOARD) --- */}
      {abaAtiva === 'Global' && (
        <View>
          {leaderboard.map((item) => {
            let corBorda = '#455A64';
            let corTextoRank = '#B0BEC5';
            if (item.rank === 1) { corBorda = '#FFD700'; corTextoRank = '#FFD700'; }
            else if (item.rank === 2) { corBorda = '#C0C0C0'; corTextoRank = '#C0C0C0'; }
            else if (item.rank === 3) { corBorda = '#CD7F32'; corTextoRank = '#CD7F32'; }

            return (
              <View key={item.id} style={[styles.leaderboardCard, { borderColor: corBorda }]}>
                <Text style={[styles.rankNumber, { color: corTextoRank }]}>#{item.rank}</Text>
                <Text style={styles.avatar}>{item.avatar}</Text>
                <View style={styles.infoContainer}>
                  <Text style={styles.nomeLeaderboard} numberOfLines={1}>{item.nome}</Text>
                  <Text style={styles.nivelLeaderboard}>Lvl {item.nivel}</Text>
                </View>
                <View style={styles.xpContainer}>
                  <Text style={styles.xp}>{item.xp} XP</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* --- CONTEÚDO DA ABA: MEUS GRUPOS (CÓDIGO ORIGINAL DO MESTRE) --- */}
      {abaAtiva === 'Grupos' && (
        <View>
          {grupoSelecionado ? (
            <View style={styles.detalheCard}>
              <TouchableOpacity onPress={() => setGrupoSelecionado(null)} style={styles.voltarBtn}>
                <Text style={{color: '#00FFCC', fontWeight: 'bold'}}>← Voltar aos Grupos</Text>
              </TouchableOpacity>

              {editando ? (
                <View style={{marginTop: 10}}>
                  <TextInput style={styles.input} value={novoNome} onChangeText={setNovoNome} placeholder="Novo Nome" placeholderTextColor="#7F8C8D" />
                  <TextInput style={styles.input} value={novaDescricao} onChangeText={setNovaDescricao} placeholder="Nova Descrição" placeholderTextColor="#7F8C8D" />
                  <TouchableOpacity style={styles.btnSalvar} onPress={salvarEdicao}>
                    <Text style={{color: '#1A1A1D', fontWeight: 'bold'}}>GUARDAR ALTERAÇÕES</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.detalheNome}>🛡️ {grupoSelecionado.nome}</Text>
                  <Text style={styles.detalheDesc}>{grupoSelecionado.descricao || "Sem descrição"}</Text>
                  <Text style={styles.detalheAdminText}>Administrador Principal: ID {grupoSelecionado.adminId}</Text>

                  {grupoSelecionado.adminId === MEU_ID && (
                    <TouchableOpacity style={styles.btnEditar} onPress={() => {
                      setNovoNome(grupoSelecionado.nome);
                      setNovaDescricao(grupoSelecionado.descricao || '');
                      setEditando(true);
                    }}>
                      <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 12}}>✏️ EDITAR GRUPO</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <Text style={styles.sectionTitleModal}>Participantes ({grupoSelecionado.membros?.length || 0})</Text>
              {grupoSelecionado.membros?.map((m: any) => (
                <View key={m.id} style={styles.membroRow}>
                  <Text style={{color: '#FFF'}}>{m.fotoPerfil || '🤖'} {m.nomeUsuario}</Text>
                  {grupoSelecionado.adminId === MEU_ID && m.id !== MEU_ID && (
                    <TouchableOpacity style={styles.btnPromover} onPress={() => promoverAdmin(m.id)}>
                      <Text style={{color: '#00FFCC', fontSize: 11, fontWeight: 'bold'}}>Tornar Admin</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.btnSair} onPress={() => sairDoGrupo(grupoSelecionado.id)}>
                <Text style={{color: '#FF0055', fontWeight: 'bold'}}>🚪 SAIR DO GRUPO</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.btnAction} onPress={() => setModalCriar(true)}>
                  <Text style={styles.btnActionText}>+ CRIAR NOVO GRUPO</Text>
                </TouchableOpacity>
              </View>

              {modalCriar && (
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Configurar Novo Grupo</Text>
                  <TextInput style={styles.input} placeholder="Nome do Grupo" value={nomeGrupo} onChangeText={setNomeGrupo} placeholderTextColor="#7F8C8D" />
                  <TextInput style={styles.input} placeholder="Descrição / Objetivo" value={descricao} onChangeText={setDescricao} placeholderTextColor="#7F8C8D" />
                  
                  <View style={styles.modalBtns}>
                    <TouchableOpacity style={[styles.btnModal, {backgroundColor: '#455A64'}]} onPress={() => setModalCriar(false)}>
                      <Text style={styles.btnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnModal, {backgroundColor: '#00FFCC'}]} onPress={criarGrupoReal}>
                      <Text style={[styles.btnText, {color: '#1A1A1D'}]}>Criar Grupo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>Os Meus Grupos de Treino</Text>
              {grupos.length === 0 ? (
                <Text style={styles.vazioText}>Ainda não participa em nenhum grupo. Crie um acima!</Text>
              ) : (
                grupos.map(g => (
                  <TouchableOpacity key={g.id} style={styles.groupCard} onPress={() => setGrupoSelecionado(g)}>
                    <View style={{flex: 1}}>
                      <Text style={styles.groupName}>🛡️ {g.nome}</Text>
                      <Text style={styles.groupDesc}>{g.descricao || "Sem descrição"}</Text>
                    </View>
                    <Text style={{color: '#00FFCC', fontSize: 12}}>Ver Detalhes →</Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1D' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#00FFCC', textAlign: 'center', marginBottom: 20 },
  
  // Estilos das Abas
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#2C2F33', borderRadius: 10, padding: 5 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabAtiva: { backgroundColor: '#00FFCC' },
  tabText: { color: '#B0BEC5', fontWeight: 'bold' },
  tabTextAtiva: { color: '#1A1A1D', fontWeight: 'bold' },

  // Estilos do Leaderboard (Global)
  leaderboardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2F33', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  rankNumber: { fontSize: 20, fontWeight: '900', width: 45 },
  avatar: { fontSize: 28, marginRight: 15 },
  infoContainer: { flex: 1 },
  nomeLeaderboard: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  nivelLeaderboard: { color: '#00FFCC', fontSize: 12, marginTop: 4 },
  xpContainer: { alignItems: 'flex-end' },
  xp: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },

  // Estilos Originais de Grupos
  actionContainer: { marginBottom: 20 },
  btnAction: { backgroundColor: 'rgba(0, 191, 255, 0.1)', borderWidth: 1, borderColor: '#00BFFF', padding: 12, borderRadius: 10, alignItems: 'center' },
  btnActionText: { color: '#00BFFF', fontWeight: 'bold', fontSize: 14 },
  modalCard: { backgroundColor: '#2C2F33', padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#00FFCC' },
  modalTitle: { color: '#00FFCC', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#1A1A1D', color: '#FFF', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#455A64' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 15 },
  btnModal: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#00FFCC', marginBottom: 15 },
  sectionTitleModal: { fontSize: 16, fontWeight: 'bold', color: '#00FFCC', marginTop: 20, marginBottom: 10 },
  vazioText: { color: '#7F8C8D', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  groupCard: { backgroundColor: '#2C2F33', padding: 15, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#455A64' },
  groupName: { color: '#00FFCC', fontSize: 16, fontWeight: 'bold' },
  groupDesc: { color: '#FFF', fontSize: 13, marginTop: 3 },
  detalheCard: { backgroundColor: '#2C2F33', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#00FFCC' },
  voltarBtn: { marginBottom: 15 },
  detalheNome: { color: '#00FFCC', fontSize: 22, fontWeight: 'bold' },
  detalheDesc: { color: '#FFF', fontSize: 14, marginTop: 5 },
  detalheAdminText: { color: '#7F8C8D', fontSize: 12, marginTop: 5, fontStyle: 'italic' },
  btnEditar: { backgroundColor: '#455A64', padding: 8, borderRadius: 6, alignItems: 'center', marginTop: 15 },
  btnSalvar: { backgroundColor: '#00FFCC', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  membroRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#1A1A1D', borderRadius: 8, marginBottom: 6, alignItems: 'center' },
  btnPromover: { backgroundColor: 'rgba(0,255,204,0.1)', padding: 6, borderRadius: 6, borderWidth: 1, borderColor: '#00FFCC' },
  btnSair: { backgroundColor: 'rgba(255,0,85,0.1)', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 25, borderWidth: 1, borderColor: '#FF0055' }
});