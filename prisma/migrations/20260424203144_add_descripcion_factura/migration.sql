/*
  Warnings:

  - Added the required column `descripcion` to the `Factura` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "descripcion" TEXT NOT NULL;
