/*
  Warnings:

  - You are about to drop the column `avatar` on the `Compra` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "avatar" TEXT;

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "uuid" TEXT,
    CONSTRAINT "Compra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Compra" ("anio", "base", "categoria", "descripcion", "id", "iva", "mes", "total", "usuarioId") SELECT "anio", "base", "categoria", "descripcion", "id", "iva", "mes", "total", "usuarioId" FROM "Compra";
DROP TABLE "Compra";
ALTER TABLE "new_Compra" RENAME TO "Compra";
CREATE UNIQUE INDEX "Compra_uuid_usuarioId_key" ON "Compra"("uuid", "usuarioId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
