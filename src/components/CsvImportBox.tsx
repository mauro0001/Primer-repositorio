"use client";

import { useState } from "react";

export function CsvImportBox({
  endpoint,
  formatoAyuda,
  onImportado,
}: {
  endpoint: string;
  formatoAyuda: string;
  onImportado: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  async function importar() {
    setCargando(true);
    setResultado(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: texto }),
      });
      const data = await res.json();
      setResultado(data);
      if (res.ok) onImportado();
    } finally {
      setCargando(false);
    }
  }

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTexto(String(reader.result || ""));
    reader.readAsText(file, "utf-8");
  }

  if (!abierto) {
    return (
      <button className="btn-secondary" onClick={() => setAbierto(true)}>
        Importar desde CSV
      </button>
    );
  }

  return (
    <div className="card space-y-3">
      <p className="text-sm text-slate-600">{formatoAyuda}</p>
      <input type="file" accept=".csv" onChange={onArchivo} className="input" />
      <textarea
        className="input font-mono text-xs"
        rows={6}
        placeholder="O pega aqui el contenido CSV..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="flex gap-2">
        <button className="btn-primary" disabled={!texto || cargando} onClick={importar}>
          {cargando ? "Importando..." : "Importar"}
        </button>
        <button className="btn-secondary" onClick={() => setAbierto(false)}>
          Cerrar
        </button>
      </div>
      {resultado && (
        <div className="text-sm">
          {"creados" in resultado && <p>Creados: {resultado.creados}</p>}
          {"actualizados" in resultado && <p>Actualizados: {resultado.actualizados}</p>}
          {resultado.errores?.length > 0 && (
            <div className="text-red-600 mt-1">
              <p>Errores:</p>
              <ul className="list-disc pl-5">
                {resultado.errores.map((e: string, i: number) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {resultado.error && <p className="text-red-600">{resultado.error}</p>}
        </div>
      )}
    </div>
  );
}
