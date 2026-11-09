const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors());

// 1. GERENCIAMENTO DE PERFIS DE USUÁRIO E LISTAGEM DA REDE
app.post('/usuarios', async (req, res) => {
  try {
    const { nomeUsuario, email, dataNascimento, fotoPerfil } = req.body;
    
    // Procura se já existe um usuário com este ID ou e-mail para atualizar ou criar
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { OR: [{ id: 1 }, { email }] }
    });

    let usuario;
    if (usuarioExistente) {
      usuario = await prisma.usuario.update({
        where: { id: usuarioExistente.id },
        data: {
          nomeUsuario,
          email,
          dataNascimento: new Date(dataNascimento),
          fotoPerfil: fotoPerfil || 'avatar_default'
        }
      });
    } else {
      usuario = await prisma.usuario.create({
        data: {
          nomeUsuario,
          email,
          dataNascimento: new Date(dataNascimento),
          fotoPerfil: fotoPerfil || 'avatar_default'
        }
      });
    }
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao criar/atualizar perfil.", detalhes: error.message });
  }
});

app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nomeUsuario: true, email: true, fotoPerfil: true, xpTotal: true }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao listar usuários da rede.", detalhes: error.message });
  }
});

app.get('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      include: { grupos: true, gruposAdministrados: true, amigos: true }
    });

    // Se o ID 1 não existir, cria um perfil padrão automaticamente para evitar erros na app
    if (!usuario && Number(id) === 1) {
      usuario = await prisma.usuario.create({
        data: {
          id: 1,
          nomeUsuario: 'Recruta Cyber',
          email: 'cyber@tcc.com',
          dataNascimento: new Date('2000-01-01'),
          fotoPerfil: '🤖'
        },
        include: { grupos: true, gruposAdministrados: true, amigos: true }
      });
    }

    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar usuário.", detalhes: error.message });
  }
});

// 2. SISTEMA DE AMIGOS
app.post('/amigos/adicionar', async (req, res) => {
  try {
    const { usuarioId, amigoId } = req.body;
    if (Number(usuarioId) === Number(amigoId)) {
      return res.status(400).json({ erro: "Não pode adicionar-se a si próprio." });
    }
    await prisma.usuario.update({
      where: { id: Number(usuarioId) },
      data: { amigos: { connect: { id: Number(amigoId) } } }
    });
    const atualizado = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) },
      include: { amigos: true }
    });
    res.json(atualizado);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao adicionar amigo.", detalhes: error.message });
  }
});

// 3. SISTEMA DE GRUPOS DE TREINO (Criar, Administrar, Detalhes, Adicionar, Sair e Promover)
app.post('/grupos', async (req, res) => {
  try {
    const { nome, descricao, adminId } = req.body;
    const novoGrupo = await prisma.grupo.create({
      data: {
        nome,
        descricao,
        adminId: Number(adminId),
        membros: {
          connect: { id: Number(adminId) }
        }
      },
      include: { membros: true, admin: true }
    });
    res.status(201).json(novoGrupo);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao criar grupo.", detalhes: error.message });
  }
});

app.get('/grupos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const grupo = await prisma.grupo.findUnique({
      where: { id: Number(id) },
      include: { membros: true, admin: true }
    });
    if (!grupo) return res.status(404).json({ erro: "Grupo não encontrado." });
    res.json(grupo);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar grupo.", detalhes: error.message });
  }
});

app.put('/grupos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, usuarioId } = req.body;

    const grupo = await prisma.grupo.findUnique({ where: { id: Number(id) } });
    if (!grupo) return res.status(404).json({ erro: "Grupo não encontrado." });

    if (grupo.adminId !== Number(usuarioId)) {
      return res.status(403).json({ erro: "Apenas o administrador pode editar o grupo." });
    }

    const grupoAtualizado = await prisma.grupo.update({
      where: { id: Number(id) },
      data: { nome, descricao },
      include: { membros: true, admin: true }
    });
    res.json(grupoAtualizado);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao atualizar grupo.", detalhes: error.message });
  }
});

app.put('/grupos/:id/promover', async (req, res) => {
  try {
    const { id } = req.params;
    const { novoAdminId, usuarioId } = req.body;

    const grupo = await prisma.grupo.findUnique({ where: { id: Number(id) } });
    if (!grupo) return res.status(404).json({ erro: "Grupo não encontrado." });

    if (grupo.adminId !== Number(usuarioId)) {
      return res.status(403).json({ erro: "Apenas o administrador pode promover outros membros." });
    }

    const grupoAtualizado = await prisma.grupo.update({
      where: { id: Number(id) },
      data: { adminId: Number(novoAdminId) },
      include: { membros: true, admin: true }
    });
    res.json(grupoAtualizado);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao promover administrador.", detalhes: error.message });
  }
});

app.post('/grupos/adicionar', async (req, res) => {
  try {
    const { grupoId, novoMembroId, usuarioId } = req.body;

    const grupo = await prisma.grupo.findUnique({ where: { id: Number(grupoId) } });
    if (!grupo) return res.status(404).json({ erro: "Grupo não encontrado." });

    if (grupo.adminId !== Number(usuarioId)) {
      return res.status(403).json({ erro: "Apenas o administrador pode adicionar novos membros." });
    }

    const grupoAtualizado = await prisma.grupo.update({
      where: { id: Number(grupoId) },
      data: {
        membros: {
          connect: { id: Number(novoMembroId) }
        }
      },
      include: { membros: true, admin: true }
    });

    res.json(grupoAtualizado);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao adicionar participante.", detalhes: error.message });
  }
});

app.post('/grupos/sair', async (req, res) => {
  try {
    const { grupoId, usuarioId } = req.body;

    const grupo = await prisma.grupo.findUnique({
      where: { id: Number(grupoId) },
      include: { membros: true }
    });
    if (!grupo) return res.status(404).json({ erro: "Grupo não encontrado." });

    const grupoAtualizado = await prisma.grupo.update({
      where: { id: Number(grupoId) },
      data: {
        membros: {
          disconnect: { id: Number(usuarioId) }
        }
      },
      include: { membros: true }
    });

    res.json({ mensagem: "Saiu do grupo com sucesso.", grupo: grupoAtualizado });
  } catch (error) {
    res.status(400).json({ erro: "Erro ao sair do grupo.", detalhes: error.message });
  }
});

// 4. ROTAS DE TREINO, DIETA E HIDRATAÇÃO
app.post('/treinos', async (req, res) => {
  try {
    const { usuarioId, modalidade, distancia, duracao, kcal } = req.body;
    
    // Assegura que o Utilizador 1 existe antes de salvar (Proteção do Prisma)
    await prisma.usuario.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1, nomeUsuario: 'Recruta Cyber', email: 'cyber@tcc.com', dataNascimento: new Date('2000-01-01'), fotoPerfil: '🤖'
      }
    });

    const novoTreino = await prisma.treino.create({
      data: { usuarioId: Number(usuarioId), modalidade, distancia, duracao, kcal }
    });
    await prisma.usuario.update({
      where: { id: Number(usuarioId) },
      data: { xpTotal: { increment: 150 } }
    });
    res.status(201).json(novoTreino);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao salvar treino.", detalhes: error.message });
  }
});

app.get('/treinos', async (req, res) => {
  const treinos = await prisma.treino.findMany({ include: { usuario: true } });
  res.json(treinos);
});

app.post('/dietas', async (req, res) => {
  try {
    // CORREÇÃO: Aceitar tanto 'horario' quanto 'dataHorario' para compatibilidade total
    const { usuarioId, alimento, repeticao, dataHorario, horario } = req.body;
    
    // Verifica se recebemos 'horario' do App novo ou 'dataHorario' do App antigo
    const dataHoraFinal = dataHorario || horario; 

    // Assegura que o Utilizador 1 existe antes de salvar (Proteção do Prisma)
    await prisma.usuario.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1, nomeUsuario: 'Recruta Cyber', email: 'cyber@tcc.com', dataNascimento: new Date('2000-01-01'), fotoPerfil: '🤖'
      }
    });

    const novaDieta = await prisma.dieta.create({
      data: { 
        usuarioId: Number(usuarioId), 
        alimento, 
        repeticao, 
        dataHorario: new Date(dataHoraFinal) 
      }
    });
    
    await prisma.usuario.update({
      where: { id: Number(usuarioId) },
      data: { xpTotal: { increment: 50 } }
    });
    res.status(201).json(novaDieta);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao salvar dieta.", detalhes: error.message });
  }
});

app.get('/dietas', async (req, res) => {
  const dietas = await prisma.dieta.findMany({ include: { usuario: true } });
  res.json(dietas);
});

// 5. ROTAS DE ALARMES/PROTOCOLOS
app.post('/alarmes', async (req, res) => {
  try {
    const { usuarioId, titulo, horario, repeticao } = req.body;
    const novoAlarme = await prisma.alarme.create({
      data: { usuarioId: Number(usuarioId), titulo, horario, repeticao }
    });
    res.status(201).json(novoAlarme);
  } catch (error) {
    res.status(400).json({ erro: "Erro ao salvar alarme.", detalhes: error.message });
  }
});

app.get('/alarmes', async (req, res) => {
  try {
    const alarmes = await prisma.alarme.findMany();
    res.json(alarmes);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar alarmes.", detalhes: error.message });
  }
});

// 6. SISTEMA DE RANKING (Leaderboards)
app.get('/ranking/global', async (req, res) => {
  try {
    // Retorna os top 50 usuários com mais XP de toda a rede Cyber Athletic
    const rankingGlobal = await prisma.usuario.findMany({
      orderBy: { xpTotal: 'desc' },
      take: 50,
      select: { id: true, nomeUsuario: true, fotoPerfil: true, xpTotal: true }
    });
    res.json(rankingGlobal);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar ranking global.", detalhes: error.message });
  }
});

app.get('/ranking/amigos/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    
    // Busca o usuário e a sua lista de amigos
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(usuarioId) },
      include: { 
        amigos: {
          select: { id: true, nomeUsuario: true, fotoPerfil: true, xpTotal: true }
        } 
      }
    });

    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });

    // Junta o próprio usuário à lista de amigos para montar o ranking comparativo
    const eu = { 
      id: usuario.id, 
      nomeUsuario: usuario.nomeUsuario, 
      fotoPerfil: usuario.fotoPerfil, 
      xpTotal: usuario.xpTotal 
    };
    
    // Ordena a lista do maior XP para o menor
    const listaRanking = [...usuario.amigos, eu].sort((a, b) => b.xpTotal - a.xpTotal);

    res.json(listaRanking);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar ranking de amigos.", detalhes: error.message });
  }
});

const PORT = process.env.PORT || 3001; // Ajuste crucial para o Render escolher a porta correta
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT} com suporte completo a Perfis, Amigos, Grupos, Alarmes e Rankings.`);
});