-- CreateTable
CREATE TABLE "MesCerrado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "MesCerrado_usuarioId_mes_anio_key" ON "MesCerrado"("usuarioId", "mes", "anio");
