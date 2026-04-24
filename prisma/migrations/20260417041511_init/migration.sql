-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "base" REAL NOT NULL,
    "iva" REAL NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "emisorNIT" TEXT,
    "receptorNIT" TEXT,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "deducible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
