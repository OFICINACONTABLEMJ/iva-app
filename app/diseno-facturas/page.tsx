  "use client";

  import { useState, useRef } from "react";
  import html2canvas from "html2canvas";
  import html2pdf from "html2pdf.js";
  import jsPDF from "jspdf";
  import QRCode from "qrcode";

  export default function DisenoFacturas() {
    const [xmlData, setXmlData] = useState<any>(null);
    const [qr, setQr] = useState("");
    const [logo, setLogo] = useState<string | null>(null);

    const xmlRef = useRef<HTMLInputElement>(null);
    const logoRef = useRef<HTMLInputElement>(null);

    // XML
    const handleXML = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");

      // 🔥 HELPERS
      const getText = (tag: string) =>
        xml.getElementsByTagName(tag)[0]?.textContent || "";

      const getAttr = (tag: string, attr: string) =>
        xml.getElementsByTagName(tag)[0]?.getAttribute(attr) || "";

      // 🔥 AUTORIZACIÓN
      const auth =
        xml.getElementsByTagName("dte:NumeroAutorizacion")[0] ||
        xml.getElementsByTagName("NumeroAutorizacion")[0];

      const uuid = auth?.textContent || "";
      const serie = auth?.getAttribute("Serie") || "";
      const numero = auth?.getAttribute("Numero") || "";

      // 🔥 EMISOR
      const emisorNode =
        xml.getElementsByTagName("dte:Emisor")[0] ||
        xml.getElementsByTagName("Emisor")[0];

      const nitEmisor = emisorNode?.getAttribute("NITEmisor") || "";

      const nombreEmisor =
        emisorNode?.getAttribute("NombreComercial") ||
        emisorNode?.getAttribute("NombreEmisor") ||
        "";

      // 🔥 DIRECCIÓN
      const dirNode =
        emisorNode?.getElementsByTagName("dte:DireccionEmisor")[0] ||
        emisorNode?.getElementsByTagName("DireccionEmisor")[0];

      const direccionCompleta = dirNode
        ? [
            dirNode.getElementsByTagName("dte:Direccion")[0]?.textContent ||
              dirNode.getElementsByTagName("Direccion")[0]?.textContent,

            dirNode.getElementsByTagName("dte:Municipio")[0]?.textContent ||
              dirNode.getElementsByTagName("Municipio")[0]?.textContent,

            dirNode.getElementsByTagName("dte:Departamento")[0]?.textContent ||
              dirNode.getElementsByTagName("Departamento")[0]?.textContent,
          ]
            .filter(Boolean)
            .join(", ")
        : "";

      // 🔥 RECEPTOR
      const receptorNode =
        xml.getElementsByTagName("dte:Receptor")[0] ||
        xml.getElementsByTagName("Receptor")[0];

      const nitReceptor = receptorNode?.getAttribute("IDReceptor") || "";
      const nombreReceptor = receptorNode?.getAttribute("NombreReceptor") || "";

      // 🔥 TOTALES
      const total =
    getText("dte:GranTotal") ||
    getText("GranTotal") ||
    getText("dte:Total") ||
    getText("Total") ||
    "0";
      const fecha =
        xml
          .getElementsByTagName("dte:DatosGenerales")[0]
          ?.getAttribute("FechaHoraEmision") ||
        xml
          .getElementsByTagName("DatosGenerales")[0]
          ?.getAttribute("FechaHoraEmision") ||
        "";
        const itemsNodes = [
    ...xml.getElementsByTagName("dte:Item"),
    ...xml.getElementsByTagName("Item"),
  ];
      // 🔥 ITEMS
      const items = itemsNodes.map((item: any) => {
    const descripcion =
      item.getElementsByTagName("dte:Descripcion")[0]?.textContent ||
      item.getElementsByTagName("Descripcion")[0]?.textContent ||
      item.getAttribute("Descripcion") ||
      "Item";

    const precioUnitario =
      item.getElementsByTagName("dte:PrecioUnitario")[0]?.textContent ||
      item.getElementsByTagName("PrecioUnitario")[0]?.textContent ||
      item.getAttribute("PrecioUnitario") ||
      "0";

    const precio =
      item.getElementsByTagName("dte:Total")[0]?.textContent ||
      item.getElementsByTagName("Total")[0]?.textContent ||
      item.getAttribute("Total") ||
      "0";

    const descuento =
      item.getElementsByTagName("dte:Descuento")[0]?.textContent ||
      item.getElementsByTagName("Descuento")[0]?.textContent ||
      item.getAttribute("Descuento") ||
      "0";

    return {
      descripcion,
      precioUnitario,
      precio,
      descuento
    };
  });

      // 🔥 QR
      const qrData = `https://felpub.c.sat.gob.gt/verificador-web/publico/vistas/verificacionDte.jsf?tipo=autorizacion&numero=${uuid}&emisor=${nitEmisor}&receptor=${nitReceptor}&monto=${total}`;

      QRCode.toDataURL(qrData)
        .then(setQr)
        .catch(console.error);

      // 🔥 SET DATA
      setXmlData({
        nombreEmisor,
        nitEmisor,
        nombreReceptor,
        nitReceptor,
        direccion: direccionCompleta,
        total,
        fecha,
        serie,
        numero,
        uuid,
        items,
      });
    };

    // LOGO
    const handleLogo = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    };

    // PDF
    const exportPDF = async () => {
      const el = document.getElementById("factura");
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const img = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      const pdfWidth = 216;
      const pdfHeight = 279;

      pdf.addImage(img, "PNG", 0, 0, pdfWidth, pdfHeight);

      pdf.save("factura.pdf");
    };

    return (
      <div className="flex h-screen">
        {/* PANEL */}
        <div className="w-72 bg-white p-5 space-y-4 shadow">
          <button onClick={() => xmlRef.current?.click()} className="bg-blue-600 text-white w-full py-2 rounded">
            Cargar XML
          </button>

          <button onClick={() => logoRef.current?.click()} className="bg-purple-600 text-white w-full py-2 rounded">
            Subir Logo
          </button>

          <button onClick={exportPDF} className="bg-black text-white w-full py-2 rounded">
            Exportar PDF
          </button>

          <input ref={xmlRef} type="file" accept=".xml" hidden onChange={handleXML} />
          <input ref={logoRef} type="file" accept="image/*" hidden onChange={handleLogo} />
        </div>

        {/* FACTURA */}
        <div className="flex-1 flex justify-center bg-gray-200 py-10">
          <div
            id="factura"
            className="w-[216mm] h-[279mm] bg-white relative overflow-hidden shadow-lg"
          >
            <img src="/fooder.png" className="absolute bottom-0 w-full z-0" />
            <img src="/fooder.png" className="absolute top-0 w-full rotate-180 z-0" />

            <div className="relative z-10 px-12 pt-40">

              {logo && (
                <div className="absolute top-[-10px] right-4 w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-xl">
                  <img src={logo} className="w-32 h-32 object-contain" />
                </div>
              )}

              <h2 className="font-bold text-lg mb-1">
                FACTURA ELECTRONICA.
              </h2>

              <p className="text-sm mb-8">
                <b>No.</b> {xmlData?.numero} &nbsp;&nbsp;
                <b>Serie:</b> {xmlData?.serie}
              </p>

              <div className="grid grid-cols-2 gap-10 text-sm">
                <div>
                  <h3 className="font-bold mb-2">DATOS DEL CLIENTE</h3>
                  <p><b>Nombre:</b> {xmlData?.nombreReceptor}</p>
                  <p><b>NIT:</b> {xmlData?.nitReceptor}</p>
                </div>

                <div>
                  <h3 className="font-bold mb-2">DATOS DE LA EMPRESA</h3>
                  <p><b>Nombre:</b> {xmlData?.nombreEmisor}</p>
                  <p><b>NIT:</b> {xmlData?.nitEmisor}</p>
                  <p><b>Dirección:</b> {xmlData?.direccion}</p>
                </div>
              </div>

              <p className="mt-6 mb-6 text-sm">
                <b>Fecha:</b> {xmlData?.fecha}
              </p>

              <table className="w-full text-sm border-collapse">
                <thead>
    <tr className="bg-[#6BA539] text-white">
      <th className="p-2 text-left">Concepto</th>
      <th className="text-center">Cantidad</th>
      <th className="text-center">Precio Unitario</th>
      <th className="text-center">Descuento</th>
      <th className="text-right pr-2">Total</th>
    </tr>
  </thead>

                <tbody>
    {xmlData?.items?.map((item: any, i: number) => (
      <tr key={i} className="border-b">
        <td className="p-2">{item.descripcion}</td>

        <td className="text-center">1</td>

        <td className="text-center">
          Q{Number(item.precioUnitario).toFixed(2)}
        </td>

        <td className="text-center">
          Q{Number(item.descuento).toFixed(2)}
        </td>

        <td className="text-right pr-2">
          Q{Number(item.precio).toFixed(2)}
        </td>
      </tr>
    ))}
  </tbody>
              </table>

              <div className="flex justify-end mt-10 font-bold">
                Total &nbsp; Q{Number(xmlData?.total || 0).toFixed(2)}
              </div>

              <div className="flex justify-between mt-10 items-end">
                <div className="text-xs w-80 leading-5">
                  <p><b>NUMERO DE AUTORIZACION:</b></p>
                  <p>{xmlData?.uuid}</p>

                  <br />

                  <p>SUJETO A RETENCION DEFINITIVA</p>
                  <p>AGENTE DE RETENCION DEL IVA</p>
                  <p>SUPERINTENDENCIA DE ADMINISTRACION TRIBUTARIA NIT: 16693949</p>
                </div>

                {qr && <img src={qr} className="w-32 h-32" />}
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }