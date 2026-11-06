import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import RpgBar from './components/RpgBar';
// IMPORTAÇÃO DA NOSSA API CENTRALIZADA
import api from '../services/api';

const MEU_ID = 1;

export const calcularPatente = (nivel: number) => {
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

const TABELA_REQUISITOS = [
  { patente: "Recruta de Aço", nivel: 1, xp: "0 XP" },
  { patente: "Ciborgue em Treinamento", nivel: 3, xp: "2.000 XP" },
  { patente: "Atleta Neon", nivel: 6, xp: "5.000 XP" },
  { patente: "Operário Sintético", nivel: 10, xp: "9.000 XP" },
  { patente: "Soldado de Elite", nivel: 15, xp: "14.000 XP" },
  { patente: "Mercenário Biônico", nivel: 20, xp: "19.000 XP" },
  { patente: "Ninja Cibernético", nivel: 30, xp: "29.000 XP" },
  { patente: "Samurai de Plasma", nivel: 50, xp: "49.000 XP" },
  { patente: "Titã de Carbono", nivel: 75, xp: "74.000 XP" },
  { patente: "Lenda Cybernética", nivel: 100, xp: "99.000 XP" }
];

const calcularIdade = (dataNasc: string) => {
  if (!dataNasc) return 0;
  const [ano, mes, dia] = dataNasc.split('-').map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const m = hoje.getMonth() + 1 - mes;
  if (m < 0 || (m === 0 && hoje.getDate() < dia)) idade--;
  return idade;
};

export default function Perfil() {
  // --- ESTADOS DE NAVEGAÇÃO E LOJA ---
  const [abaAtiva, setAbaAtiva] = useState('Perfil');
  const [cyberCoins, setCyberCoins] = useState(1500); // Saldo inicial para testes
  const [loja, setLoja] = useState([
    { id: 1, nome: 'Tênis de Carbono', desc: '+5% XP em Corridas', preco: 500, icone: '👟', comprado: false, equipado: false },
    { id: 2, nome: 'Cantil de Fusão', desc: 'XP Duplo ao Beber Água', preco: 800, icone: '🔋', comprado: false, equipado: false },
    { id: 3, nome: 'Implante Metabólico', desc: '+10 XP Fixo por Refeição', preco: 1200, icone: '🫀', comprado: false, equipado: false },
  ]);

  // --- ESTADOS ORIGINAIS ---
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2000-01-01');
  const [fotoPerfil, setFotoPerfil] = useState('🤖');
  const [xpTotal, setXpTotal] = useState(0);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mostrarTabelaXP, setMostrarTabelaXP] = useState(false);

  // Sistema de Amigos
  const [amigos, setAmigos] = useState<any[]>([]);
  const [mostrarModalAmigos, setMostrarModalAmigos] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [todosUsuarios, setTodosUsuarios] = useState<any[]>([]);

  useEffect(() => {
    carregarPerfil();
    carregarRedeUsuarios();
  }, []);

  const carregarPerfil = async () => {
    try {
      const res = await api.get(`/usuarios/${MEU_ID}`);
      const dados = res.data;
      setNomeUsuario(dados.nomeUsuario || '');
      setEmail(dados.email || '');
      if (dados.dataNascimento) setDataNascimento(dados.dataNascimento.split('T')[0]);
      setXpTotal(dados.xpTotal || 0);
      setFotoPerfil(dados.fotoPerfil || '🤖');
      setAmigos(dados.amigos || []);
    } catch (e) {
      console.log("Erro ao carregar perfil:", e);
    }
  };

  const carregarRedeUsuarios = async () => {
    try {
      const res = await api.get('/usuarios');
      setTodosUsuarios(res.data);
    } catch (e) {
      console.log("Erro ao carregar rede de utilizadores:", e);
    }
  };

  const salvarPerfil = async () => {
    try {
      await api.post('/usuarios', { nomeUsuario, email, dataNascimento, fotoPerfil });
      Alert.alert("Sucesso", "Perfil criado/atualizado com sucesso!");
      setModoEdicao(false);
      setMostrarTabelaXP(true);
      carregarPerfil();
    } catch (e: any) {
      const erroMsg = e.response?.data?.erro || "Falha ao salvar perfil.";
      Alert.alert("Erro", erroMsg);
    }
  };

  const adicionarAmigo = async (amigoId: number) => {
    try {
      const res = await api.post('/amigos/adicionar', { usuarioId: MEU_ID, amigoId });
      setAmigos(res.data.amigos);
      Alert.alert("Sucesso", "Amigo adicionado à sua rede!");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível adicionar o amigo.");
    }
  };

  // --- FUNÇÕES DA LOJA ---
  const comprarItem = (id: number) => {
    const item = loja.find(i => i.id === id);
    if (!item) return;
    if (item.comprado) {
      Alert.alert("Inventário", "Você já possui esta Melhoria Sintética!");
      return;
    }
    if (cyberCoins >= item.preco) {
      setCyberCoins(prev => prev - item.preco);
      setLoja(prev => prev.map(i => i.id === id ? { ...i, comprado: true } : i));
      Alert.alert("Compra Aprovada!", `Você adquiriu: ${item.nome}`);
    } else {
      Alert.alert("CyberCoins Insuficientes", "Treine mais para faturar moedas!");
    }
  };

  const equiparItem = (id: number) => {
    setLoja(prev => prev.map(i => {
      if (i.id === id) {
        const novoStatus = !i.equipado;
        Alert.alert("Sistema", novoStatus ? `[${i.nome}] Equipado! Buffs Ativos.` : `[${i.nome}] Desequipado.`);
        return { ...i, equipado: novoStatus };
      }
      return i;
    }));
  };

  const nivelAtual = Math.floor(xpTotal / 1000) + 1;
  const xpProgresso = xpTotal % 1000;
  const porcentagem = xpProgresso / 1000;
  const patenteAtual = calcularPatente(nivelAtual);
  const idadeCalculada = calcularIdade(dataNascimento);

  const usuariosFiltrados = todosUsuarios.filter(u => 
    u.id !== MEU_ID && 
    u.nomeUsuario.toLowerCase().includes(termoBusca.toLowerCase()) &&
    !amigos.some(a => a.id === u.id)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={{ marginHorizontal: -20, marginBottom: 10 }}><RpgBar /></View>
      
      <Text style={styles.pageTitle}>Cyber Perfil & Rede</Text>

      {/* ABAS DE NAVEGAÇÃO */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tabBtn, abaAtiva === 'Perfil' && styles.tabAtiva]} onPress={() => setAbaAtiva('Perfil')}>
          <Text style={abaAtiva === 'Perfil' ? styles.tabTextAtiva : styles.tabText}>👤 Meu Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, abaAtiva === 'Loja' && styles.tabAtiva]} onPress={() => setAbaAtiva('Loja')}>
          <Text style={abaAtiva === 'Loja' ? styles.tabTextAtiva : styles.tabText}>🛒 Cyber Shop</Text>
        </TouchableOpacity>
      </View>

      {/* ================= CONTEÚDO DA ABA: MEU PERFIL ================= */}
      {abaAtiva === 'Perfil' && (
        <View>
          <View style={styles.perfilCard}>
            <View style={styles.avatarRowContainer}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarIcon}>{fotoPerfil}</Text>
              </View>
              {/* Saldo de Moedas no Perfil */}
              <View style={styles.moedasContainerPerfil}>
                <Text style={{fontSize: 24}}>🪙</Text>
                <Text style={styles.moedasTextoPerfil}>{cyberCoins}</Text>
              </View>
            </View>

            {modoEdicao ? (
              <View style={styles.editForm}>
                <TextInput style={styles.input} placeholder="Nome de Utilizador" value={nomeUsuario} onChangeText={setNomeUsuario} placeholderTextColor="#7F8C8D" />
                <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} placeholderTextColor="#7F8C8D" />
                <TextInput style={styles.input} placeholder="Data Nasc (AAAA-MM-DD)" value={dataNascimento} onChangeText={setDataNascimento} placeholderTextColor="#7F8C8D" />
                
                <Text style={styles.labelAvatar}>Escolha o seu Avatar Cyber:</Text>
                <View style={styles.avatarRow}>
                  {['🤖', '🦾', '⚡', '🔥', '💀', '🚀', '💻', '🛡️'].map(av => (
                    <TouchableOpacity key={av} onPress={() => setFotoPerfil(av)} style={[styles.avatarBtn, fotoPerfil === av && styles.avatarBtnAtivo]}>
                      <Text style={{fontSize: 22}}>{av}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={styles.btnSalvar} onPress={salvarPerfil}>
                  <Text style={styles.btnSalvarText}>GUARDAR E VER NÍVEIS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.title}>{nomeUsuario || "Utilizador Sem Nome"}</Text>
                <Text style={styles.subInfo}>{email || "Sem e-mail"} | {idadeCalculada} Anos</Text>
                <Text style={styles.patenteText}>{patenteAtual}</Text>
                <Text style={styles.nivelText}>Nível {nivelAtual}</Text>

                <View style={styles.rpgBarBg}>
                  <View style={[styles.rpgBarFill, { width: `${porcentagem * 100}%` }]} />
                </View>
                <Text style={styles.xpText}>{1000 - xpProgresso} XP para o próximo nível</Text>
                
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => setModoEdicao(true)}>
                    <Text style={styles.editBtnText}>✏️ EDITAR PERFIL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.xpToggleBtn} onPress={() => setMostrarTabelaXP(!mostrarTabelaXP)}>
                    <Text style={styles.xpToggleText}>{mostrarTabelaXP ? 'Ocultar Tabela XP' : '⚡ VER TABELA XP'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* TABELA DE XP */}
          {(mostrarTabelaXP || !nomeUsuario) && (
            <View style={styles.tabelaCard}>
              <Text style={styles.sectionTitle}>Tabela de Patentes & Requisitos XP</Text>
              {TABELA_REQUISITOS.map((item, idx) => {
                const atingido = nivelAtual >= item.nivel;
                return (
                  <View key={idx} style={[styles.tabelaRow, atingido && styles.tabelaRowAtiva]}>
                    <Text style={[styles.tabelaPatente, atingido && styles.textoAtivo]}>{item.patente}</Text>
                    <Text style={[styles.tabelaXp, atingido && styles.textoAtivo]}>Lvl {item.nivel} ({item.xp})</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* AMIGOS */}
          <View style={styles.amigosHeader}>
            <Text style={styles.sectionTitle}>Meus Amigos ({amigos.length})</Text>
            <TouchableOpacity style={styles.btnAddAmigo} onPress={() => setMostrarModalAmigos(true)}>
              <Text style={{color: '#00FFCC', fontWeight: 'bold', fontSize: 12}}>+ ADICIONAR AMIGO</Text>
            </TouchableOpacity>
          </View>
          {amigos.length === 0 ? (
            <Text style={styles.vazioText}>Nenhum amigo adicionado na rede ainda.</Text>
          ) : (
            amigos.map(amigo => (
              <View key={amigo.id} style={styles.amigoCard}>
                <Text style={{color: '#FFF', fontSize: 16}}>{amigo.fotoPerfil || '🤖'} {amigo.nomeUsuario}</Text>
                <Text style={{color: '#00FFCC', fontSize: 12, fontWeight: 'bold'}}>Conectado</Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* ================= CONTEÚDO DA ABA: CYBER SHOP ================= */}
      {abaAtiva === 'Loja' && (
        <View>
          <View style={styles.lojaHeader}>
            <View>
              <Text style={styles.sectionTitleLoja}>Melhorias Sintéticas</Text>
              <Text style={styles.subtitleLoja}>Compre equipamentos para multiplicar bônus.</Text>
            </View>
            <View style={styles.moedasContainerLoja}>
              <Text style={{fontSize: 16}}>🪙</Text>
              <Text style={styles.moedasTextoLoja}>{cyberCoins}</Text>
            </View>
          </View>

          {loja.map((item) => (
            <View key={item.id} style={[styles.itemCard, item.equipado && styles.itemEquipado]}>
              <Text style={styles.itemIcone}>{item.icone}</Text>
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemNome}>{item.nome}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>

              {item.comprado ? (
                <TouchableOpacity 
                  style={[styles.btnEquipar, item.equipado && styles.btnEquipado]} 
                  onPress={() => equiparItem(item.id)}
                >
                  <Text style={[styles.btnText, item.equipado && {color: '#1A1A1D'}]}>{item.equipado ? 'EQUIPADO' : 'USAR'}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.btnComprar} onPress={() => comprarItem(item.id)}>
                  <Text style={styles.btnTextPreco}>🪙 {item.preco}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* MODAL DE PESQUISA (Independente da aba ativa) */}
      {mostrarModalAmigos && (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Pesquisar Novos Amigos</Text>
          <TextInput style={styles.input} placeholder="Digite o nome de perfil..." value={termoBusca} onChangeText={setTermoBusca} placeholderTextColor="#7F8C8D" />
          
          {usuariosFiltrados.length === 0 ? (
            <Text style={{color: '#7F8C8D', textAlign: 'center', marginVertical: 10}}>Nenhum utilizador encontrado.</Text>
          ) : (
            usuariosFiltrados.map(u => (
              <View key={u.id} style={styles.buscaRow}>
                <Text style={{color: '#FFF'}}>{u.fotoPerfil || '🤖'} {u.nomeUsuario}</Text>
                <TouchableOpacity style={styles.btnEnviarAdd} onPress={() => adicionarAmigo(u.id)}>
                  <Text style={{color: '#1A1A1D', fontWeight: 'bold', fontSize: 11}}>+ Adicionar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.btnFecharModal} onPress={() => setMostrarModalAmigos(false)}>
            <Text style={{color: '#FFF', fontWeight: 'bold'}}>Fechar</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1D' },
  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#00FFCC', textAlign: 'center', marginBottom: 20, marginTop: 15 },
  
  // NAVEGAÇÃO ABAS
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#2C2F33', borderRadius: 10, padding: 5 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabAtiva: { backgroundColor: '#00FFCC' },
  tabText: { color: '#B0BEC5', fontWeight: 'bold' },
  tabTextAtiva: { color: '#1A1A1D', fontWeight: 'bold' },

  // PERFIL ORIGINAL
  perfilCard: { alignItems: 'center', backgroundColor: '#2C2F33', padding: 25, borderRadius: 15, borderWidth: 1, borderColor: '#00FFCC', elevation: 5, marginBottom: 20 },
  avatarRowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 15 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#1A1A1D', borderWidth: 2, borderColor: '#00FFCC', justifyContent: 'center', alignItems: 'center' },
  avatarIcon: { fontSize: 45 },
  moedasContainerPerfil: { backgroundColor: 'rgba(255, 215, 0, 0.1)', borderWidth: 1, borderColor: '#FFD700', borderRadius: 12, padding: 10, alignItems: 'center', justifyContent: 'center' },
  moedasTextoPerfil: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  subInfo: { color: '#B0BEC5', fontSize: 13, marginBottom: 5 },
  patenteText: { fontSize: 18, color: '#00FFCC', fontWeight: 'bold', fontStyle: 'italic', marginTop: 5 },
  nivelText: { fontSize: 14, color: '#7F8C8D', fontWeight: 'bold', marginBottom: 20 },
  rpgBarBg: { height: 10, width: '100%', backgroundColor: '#1A1A1D', borderRadius: 10, overflow: 'hidden' },
  rpgBarFill: { height: '100%', backgroundColor: '#00FFCC', borderRadius: 10 },
  xpText: { color: '#B0BEC5', fontSize: 13, fontWeight: 'bold', marginTop: 10, marginBottom: 15 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  editBtn: { backgroundColor: '#455A64', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  editBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  xpToggleBtn: { backgroundColor: 'rgba(0, 255, 204, 0.1)', borderColor: '#00FFCC', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  xpToggleText: { color: '#00FFCC', fontWeight: 'bold', fontSize: 11 },
  
  // FORMULÁRIO DE EDIÇÃO E MODAIS
  editForm: { width: '100%', marginTop: 10 },
  input: { backgroundColor: '#1A1A1D', color: '#FFF', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#455A64' },
  labelAvatar: { color: '#B0BEC5', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  avatarBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#455A64' },
  avatarBtnAtivo: { borderColor: '#00FFCC', backgroundColor: 'rgba(0,255,204,0.1)' },
  btnSalvar: { backgroundColor: '#00FFCC', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnSalvarText: { color: '#1A1A1D', fontWeight: 'bold', fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#00FFCC', marginBottom: 15 },
  tabelaCard: { backgroundColor: '#2C2F33', padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#00BFFF' },
  tabelaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#455A64' },
  tabelaRowAtiva: { backgroundColor: 'rgba(0, 255, 204, 0.1)', borderBottomColor: '#00FFCC', borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -8 },
  tabelaPatente: { color: '#B0BEC5', fontSize: 13, fontWeight: 'bold' },
  tabelaXp: { color: '#7F8C8D', fontSize: 12 },
  textoAtivo: { color: '#00FFCC' },
  amigosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  btnAddAmigo: { backgroundColor: 'rgba(0,255,204,0.1)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#00FFCC' },
  vazioText: { color: '#7F8C8D', fontStyle: 'italic', marginBottom: 20 },
  amigoCard: { backgroundColor: '#2C2F33', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#455A64' },
  modalCard: { backgroundColor: '#2C2F33', padding: 20, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: '#00FFCC' },
  modalTitle: { color: '#00FFCC', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  buscaRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#1A1A1D', borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  btnEnviarAdd: { backgroundColor: '#00FFCC', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  btnFecharModal: { backgroundColor: '#455A64', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },

  // ESTILOS DA LOJA
  lojaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitleLoja: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', marginBottom: 2 },
  subtitleLoja: { color: '#B0BEC5', fontSize: 11 },
  moedasContainerLoja: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2F33', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FFD700' },
  moedasTextoLoja: { color: '#FFD700', fontWeight: 'bold', fontSize: 16, marginLeft: 5 },
  itemCard: { backgroundColor: '#2C2F33', padding: 15, borderRadius: 12, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#455A64' },
  itemEquipado: { borderColor: '#00FFCC', backgroundColor: 'rgba(0, 255, 204, 0.1)' },
  itemIcone: { fontSize: 35, marginRight: 15 },
  itemInfo: { flex: 1 },
  itemNome: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  itemDesc: { color: '#00FFCC', fontSize: 11, marginTop: 4 },
  btnComprar: { backgroundColor: '#1A1A1D', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#FFD700' },
  btnTextPreco: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
  btnEquipar: { backgroundColor: '#455A64', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  btnEquipado: { backgroundColor: '#00FFCC' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});