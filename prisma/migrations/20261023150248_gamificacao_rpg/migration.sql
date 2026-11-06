/*
  Warnings:

  - You are about to drop the `Refeicao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `ativo` on the `Alarme` table. All the data in the column will be lost.
  - You are about to drop the column `caloriasGastas` on the `Treino` table. All the data in the column will be lost.
  - You are about to drop the column `distanciaKm` on the `Treino` table. All the data in the column will be lost.
  - You are about to drop the column `tempoMinutos` on the `Treino` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `peso` on the `Usuario` table. All the data in the column will be lost.
  - Added the required column `distancia` to the `Treino` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duracao` to the `Treino` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kcal` to the `Treino` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataNascimento` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomeUsuario` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Refeicao";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Grupo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "adminId" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Grupo_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dieta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "alimento" TEXT NOT NULL,
    "repeticao" TEXT NOT NULL DEFAULT 'nenhuma',
    "dataHorario" DATETIME NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dieta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroAgua" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroAgua_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MissaoDiaria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "meta" REAL NOT NULL,
    "progresso" REAL NOT NULL DEFAULT 0,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "recompensaXp" INTEGER NOT NULL,
    "recompensaCoins" INTEGER NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissaoDiaria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemLoja" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorBonus" REAL NOT NULL,
    "icone" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ItemInventario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "equipado" BOOLEAN NOT NULL DEFAULT false,
    "adquiridoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemInventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemInventario_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ItemLoja" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricoTransacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "valor" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistoricoTransacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conquista" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "icone" TEXT NOT NULL,
    "requisitoTipo" TEXT NOT NULL,
    "requisitoValor" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "ConquistaUsuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "conquistaId" INTEGER NOT NULL,
    "dataDesbloqueio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConquistaUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ConquistaUsuario_conquistaId_fkey" FOREIGN KEY ("conquistaId") REFERENCES "Conquista" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_Amizades" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_Amizades_A_fkey" FOREIGN KEY ("A") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_Amizades_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_MembrosGrupo" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_MembrosGrupo_A_fkey" FOREIGN KEY ("A") REFERENCES "Grupo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MembrosGrupo_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alarme" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "repeticao" TEXT NOT NULL DEFAULT 'diariamente',
    CONSTRAINT "Alarme_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Alarme" ("horario", "id", "titulo", "usuarioId") SELECT "horario", "id", "titulo", "usuarioId" FROM "Alarme";
DROP TABLE "Alarme";
ALTER TABLE "new_Alarme" RENAME TO "Alarme";
CREATE TABLE "new_Treino" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "modalidade" TEXT NOT NULL,
    "distancia" REAL NOT NULL,
    "duracao" INTEGER NOT NULL,
    "kcal" INTEGER NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Treino_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Treino" ("data", "id", "modalidade", "usuarioId") SELECT "data", "id", "modalidade", "usuarioId" FROM "Treino";
DROP TABLE "Treino";
ALTER TABLE "new_Treino" RENAME TO "Treino";
CREATE TABLE "new_Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomeUsuario" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dataNascimento" DATETIME NOT NULL,
    "fotoPerfil" TEXT,
    "xpTotal" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cyberCoins" INTEGER NOT NULL DEFAULT 0,
    "streakAtual" INTEGER NOT NULL DEFAULT 0,
    "ultimoCheckin" DATETIME,
    "temaAtivo" TEXT NOT NULL DEFAULT 'padrao'
);
INSERT INTO "new_Usuario" ("email", "id") SELECT "email", "id" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_nomeUsuario_key" ON "Usuario"("nomeUsuario");
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_Amizades_AB_unique" ON "_Amizades"("A", "B");

-- CreateIndex
CREATE INDEX "_Amizades_B_index" ON "_Amizades"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_MembrosGrupo_AB_unique" ON "_MembrosGrupo"("A", "B");

-- CreateIndex
CREATE INDEX "_MembrosGrupo_B_index" ON "_MembrosGrupo"("B");
