/*
  Warnings:

  - Added the required column `emisorNIT` to the `Factura` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receptorNIT` to the `Factura` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Factura" ADD COLUMN     "emisorNIT" TEXT NOT NULL,
ADD COLUMN     "receptorNIT" TEXT NOT NULL,
ALTER COLUMN "nit" DROP NOT NULL;
