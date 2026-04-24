/*
  Warnings:

  - You are about to drop the `Factura` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `Compra` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `usuarioId` to the `Compra` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Factura";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Resumen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "ventas" REAL NOT NULL DEFAULT 0,
    "debito" REAL NOT NULL,
    "credito" REAL NOT NULL,
    "iva" REAL NOT NULL,
    "retenciones" REAL NOT NULL DEFAULT 0,
    "bloqueado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Compra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "base" REAL NOT NULL,
    "iva" REAL NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "avatar" TEXT,
    "usuarioId" TEXT NOT NULL,
    CONSTRAINT "Compra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Compra" ("anio", "base", "categoria", "descripcion", "id", "iva", "mes", "total") SELECT "anio", "base", "categoria", "descripcion", "id", "iva", "mes", "total" FROM "Compra";
DROP TABLE "Compra";
ALTER TABLE "new_Compra" RENAME TO "Compra";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Resumen_userId_mes_anio_key" ON "Resumen"("userId", "mes", "anio");
