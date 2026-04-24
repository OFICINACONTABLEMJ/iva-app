/*
  Warnings:

  - You are about to drop the column `cliente` on the `Factura` table. All the data in the column will be lost.
  - Added the required column `base` to the `Factura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iva` to the `Factura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nit` to the `Factura` table without a default value. This is not possible if the table is not empty.
  - Made the column `serie` on table `Factura` required. This step will fail if there are existing NULL values in that column.
  - Made the column `numero` on table `Factura` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Factura" DROP COLUMN "cliente",
ADD COLUMN     "base" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "categoria" TEXT,
ADD COLUMN     "iva" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "nit" TEXT NOT NULL,
ADD COLUMN     "tipo" TEXT,
ALTER COLUMN "serie" SET NOT NULL,
ALTER COLUMN "numero" SET NOT NULL;
