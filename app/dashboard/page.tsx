"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Line, Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/resumen/all")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const meses = [
    "Ene","Feb","Mar","Abr","May","Jun",
    "Jul","Ago","Sep","Oct","Nov","Dic"
  ];

  const labels = data.map((d) => meses[d.mes - 1]);

  // 📊 IVA por mes
  const ivaData = {
    labels,
    datasets: [
      {
        label: "IVA a pagar",
        data: data.map((d) => d.iva),
        borderWidth: 2,
      },
    ],
  };

  // 📊 Ventas vs Crédito
  const ventasCompras = {
    labels,
    datasets: [
      {
        label: "Ventas",
        data: data.map((d) => d.ventas),
      },
      {
        label: "Crédito (Compras)",
        data: data.map((d) => d.credito),
      },
    ],
  };

  // 💰 KPIs
  const totalVentas = data.reduce((acc, d) => acc + (d.ventas || 0), 0);
  const totalIVA = data.reduce((acc, d) => acc + (d.iva || 0), 0);
  const totalCredito = data.reduce((acc, d) => acc + (d.credito || 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          ← Volver al inicio
        </button>

        <h1 className="text-2xl font-bold">📊 Dashboard Contable</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Total Ventas</p>
          <h2 className="text-xl font-bold">
            Q{totalVentas.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Total Crédito</p>
          <h2 className="text-xl font-bold">
            Q{totalCredito.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Total IVA</p>
          <h2 className="text-xl font-bold">
            Q{totalIVA.toFixed(2)}
          </h2>
        </div>
      </div>

      {/* 📈 GRÁFICA IVA */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-2">IVA por mes</h2>
        <Line data={ivaData} />
      </div>

      {/* 📊 GRÁFICA VENTAS VS CRÉDITO */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold mb-2">Ventas vs Crédito</h2>
        <Bar data={ventasCompras} />
      </div>

    </div>
  );
}