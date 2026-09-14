"use client";

import { FormEvent, useEffect, useState } from "react";

type Config = {
  periodicidad: string;
  mesesVencimiento: string;
  diaVencimiento: number;
  diasRecordatorioAntes: number;
  diasEscalamientoDespues: number;
  recordatorioActivo: boolean;
};
type Global = { emailEscalamientoDefault: string; nombreInstitucion: string };

const NOMBRES: Record<string, string> = {
  MENSUAL: "Mensual",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  EVENTUAL: "Eventual",
};

export default function CalendarioPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [global, setGlobal] = useState<Global>({ emailEscalamientoDefault: "", nombreInstitucion: "" });
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function cargar() {
    const res = await fetch("/api/admin/calendario");
    const data = await res.json();
    setConfigs(data.configs);
    setGlobal(data.global);
  }
  useEffect(() => {
    cargar();
  }, []);

  function actualizarCampo(periodicidad: string, campo: keyof Config, valor: any) {
    setConfigs((prev) => prev.map((c) => (c.periodicidad === periodicidad ? { ...c, [campo]: valor } : c)));
  }

  async function guardarConfig(c: Config) {
    await fetch(`/api/admin/calendario/${c.periodicidad}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c),
    });
    setMensaje(`Configuracion de "${NOMBRES[c.periodicidad]}" guardada.`);
    setTimeout(() => setMensaje(null), 3000);
  }

  async function guardarGlobal(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/config-global", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(global),
    });
    setMensaje("Configuracion global guardada.");
    setTimeout(() => setMensaje(null), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Calendario de vencimientos y escalamiento</h1>
        <p className="text-sm text-slate-500">
          El vencimiento de cada punto es el dia indicado, en los meses marcados. El recordatorio se envia
          automaticamente esos dias antes del vencimiento; el escalamiento a jefatura, esos dias despues si no hay
          respuesta. "Eventual" no usa calendario.
        </p>
      </div>

      {mensaje && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">{mensaje}</p>}

      <div className="grid gap-3">
        {configs.map((c) => (
          <div key={c.periodicidad} className="card space-y-3">
            <h2 className="font-semibold text-slate-800">{NOMBRES[c.periodicidad] || c.periodicidad}</h2>
            {c.periodicidad !== "EVENTUAL" ? (
              <div className="grid sm:grid-cols-4 gap-3">
                <div>
                  <label className="label">Meses (1-12, separados por coma)</label>
                  <input
                    className="input"
                    value={c.mesesVencimiento}
                    onChange={(e) => actualizarCampo(c.periodicidad, "mesesVencimiento", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Dia del mes</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    className="input"
                    value={c.diaVencimiento}
                    onChange={(e) => actualizarCampo(c.periodicidad, "diaVencimiento", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Dias de recordatorio antes</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={c.diasRecordatorioAntes}
                    onChange={(e) => actualizarCampo(c.periodicidad, "diasRecordatorioAntes", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Dias de escalamiento despues</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={c.diasEscalamientoDespues}
                    onChange={(e) => actualizarCampo(c.periodicidad, "diasEscalamientoDespues", Number(e.target.value))}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Se activa por evento; no tiene fecha de vencimiento ni recordatorio.</p>
            )}
            <button className="btn-primary" onClick={() => guardarConfig(c)}>
              Guardar
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={guardarGlobal} className="card space-y-3">
        <h2 className="font-semibold text-slate-800">Configuracion general</h2>
        <div>
          <label className="label">Correo de escalamiento por defecto (Gestion de la Operacion)</label>
          <input
            type="email"
            className="input"
            value={global.emailEscalamientoDefault}
            onChange={(e) => setGlobal({ ...global, emailEscalamientoDefault: e.target.value })}
          />
          <p className="text-xs text-slate-400 mt-1">
            Se usa cuando un cargo o director no tiene un correo de jefatura especifico configurado.
          </p>
        </div>
        <button type="submit" className="btn-primary">
          Guardar
        </button>
      </form>
    </div>
  );
}
