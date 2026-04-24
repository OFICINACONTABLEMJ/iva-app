import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

export async function POST(req: NextRequest) {
  try {
    const { xml, nit } = await req.json();

    if (!xml) {
      return NextResponse.json(
        { error: "XML vacío" },
        { status: 400 }
      );
    }

    const result = await parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: false,
    });

    // 🔥 Soporte múltiples estructuras FEL Guatemala
    const dte =
      result?.["dte:GTDocumento"]?.["dte:SAT"]?.["dte:DTE"] ||
      result?.GTDocumento?.SAT?.DTE;

    if (!dte) {
      return NextResponse.json(
        { error: "XML no válido FEL Guatemala" },
        { status: 400 }
      );
    }

    const datos =
      dte?.["dte:DatosEmision"] ||
      dte?.DatosEmision;

    const emisor =
      datos?.["dte:Emisor"] ||
      datos?.Emisor;

    const receptor =
      datos?.["dte:Receptor"] ||
      datos?.Receptor;

    // 🧾 NITs
    const emisorNIT = emisor?.$?.NITEmisor || null;
    const receptorNIT = receptor?.$?.IDReceptor || null;

    // 🔥 Validación cliente
    const perteneceCliente = nit ? receptorNIT === nit : true;

    // 📦 ITEMS (soporta uno o varios)
    const itemsRaw =
      datos?.["dte:Items"]?.["dte:Item"] ||
      datos?.Items?.Item ||
      [];

    const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];

    let descripcionPrincipal = "Factura";

    let baseTotal = 0;
    let ivaTotal = 0;
    let totalGeneral = 0;

    // 🔍 Procesar items (nivel contable real)
    for (const item of items) {
      const desc =
        item?.["dte:Descripcion"] ||
        item?.Descripcion ||
        "Item";

      const totalItem = Number(
        item?.["dte:Total"] ||
        item?.Total ||
        0
      );

      const baseItem = totalItem / 1.12;
      const ivaItem = totalItem - baseItem;

      baseTotal += baseItem;
      ivaTotal += ivaItem;
      totalGeneral += totalItem;

      if (descripcionPrincipal === "Factura") {
        descripcionPrincipal = desc;
      }
    }

    // 🧠 Clasificación básica
    const text = descripcionPrincipal.toLowerCase();

    let categoria:
      | "Combustible"
      | "Servicios"
      | "Otras compras"
      | "Otros" = "Otros";

    if (
      text.includes("gasolina") ||
      text.includes("diesel") ||
      text.includes("combustible")
    ) {
      categoria = "Combustible";
    } else if (
      text.includes("restaurante") ||
      text.includes("hotel") ||
      text.includes("internet") ||
      text.includes("telefono") ||
      text.includes("servicio")
    ) {
      categoria = "Servicios";
    } else if (
      text.includes("repuesto") ||
      text.includes("material") ||
      text.includes("valvula") ||
      text.includes("computadora") ||
      text.includes("equipo")
    ) {
      categoria = "Otras compras";
    }

    return NextResponse.json({
      descripcion: descripcionPrincipal,
      categoria,

      total: totalGeneral,
      base: baseTotal,
      iva: ivaTotal,

      // 🧾 auditoría
      emisorNIT,
      receptorNIT,
      perteneceCliente,

      itemsCount: items.length,
    });

  } catch (error: any) {
    console.error("ERROR XML:", error);

    return NextResponse.json(
      {
        error: "Error procesando XML FEL",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}