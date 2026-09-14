"use client";

import { FormEvent, useEffect, useState } from "react";
import { CsvImportBox } from "@/components/CsvImportBox";

type Escuela = { id: string; nombre: string };
type Punto = { id: string; codigo: string; nombre: string; tipoFormulario: string };
type Campo = {
  id: string;
  escuelaId: string;
  escuela: Escuela;
  puntoControlId: string;
  puntoControl: Punto;
  nombreCampo: string;
  tipoCampo: "TEXTO" | "SI_NO" | "LISTA" | "FECHA";
  opcionesLista: string | null;
  orden: number;
  obligatorio: boolean;
};

const VACIO = {
  escuelaId: "",
  puntoControlId: "",
  nombreCampo: "",
  tipoCampo: "TEXTO" as Campo["tipoCampo"],
  opcionesLista: "",
  orden: 0,
  obligatorio: true,
};

export default function CamposEscuelaPage() {
  const [campos, setCampos] = useState<Campo[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [puntosB, setPuntosB] = useState<Punto[]>([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [filtroEscuela, setFiltroEscuela] = useState("");

  async function cargar() {
    const [rc, re, rp] = await Promise.all([
      fetch("/api/admin/campos-escuela"),
      fetch("/api/escuelas"),
      fetch("/api/admin/puntos"),
    ]);
    setCampos(await rc.json());
    const escuelasData: Escuela[] = await re.json();
    setEscuelas(escuelasData);
    const puntos: Punto[] = await rp.json();
    const soloB = puntos.filter((p) => p.tipoFormulario === "B");
    setPuntosB(soloB);
    setForm((f) => ({ ...f, escuelaId: f.escuelaId || escuelasData[0]?.id || "", puntoControlId: f.puntoControlId || soloB[0]?.id || "" }));
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/admin/campos-escuela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...VACIO, escuelaId: f.escuelaId, puntoControlId: f.puntoControlId }));
      cargar();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este campo del protocolo de la escuela?")) return;
    await fetch(`/api/admin/campos-escuela/${id}`, { method: "DELETE" });
    cargar();
  }

  const camposFiltrados = filtroEscuela ? campos.filter((c) => c.escuelaId === filtroEscuela) : campos;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-800">Campos requeridos por escuela (Tipo B)</h1>
        <p className="text-sm text-slate-500">
          Define, para cada escuela y cada punto de control Tipo B, los campos adicionales que su protocolo exige.
          El formulario de los directores los mostrara automaticamente al elegir su escuela.
        </p>
      </div>

      <CsvImportBox
        endpoint="/api/admin/import/campos-escuela"
        formatoAyuda="CSV: escuelaNombre,puntoCodigo,nombreCampo,tipoCampo(TEXTO/SI_NO/LISTA/FECHA),opcionesLista(separadas por |),orden,obligatorio(true/false). Si la combinacion escuela+punto+nombreCampo ya existe, se actualiza."
        onImportado={cargar}
      />

      <form onSubmit={guardar} className="card grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Escuela</label>
          <select className="input" value={form.escuelaId} onChange={(e) => setForm({ ...form, escuelaId: e.target.value })}>
            {escuelas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Punto de control (Tipo B)</label>
          <select className="input" value={form.puntoControlId} onChange={(e) => setForm({ ...form, puntoControlId: e.target.value })}>
            {puntosB.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} - {p.nombre}
              </option>
            ))}
          </select>
          {puntosB.length === 0 && <p className="text-xs text-amber-600 mt-1">Primero crea puntos de control Tipo B en /admin/puntos.</p>}
        </div>
        <div>
          <label className="label">Nombre del campo</label>
          <input className="input" required value={form.nombreCampo} onChange={(e) => setForm({ ...form, nombreCampo: e.target.value })} />
        </div>
        <div>
          <label className="label">Tipo de dato</label>
          <select className="input" value={form.tipoCampo} onChange={(e) => setForm({ ...form, tipoCampo: e.target.value as any })}>
            <option value="TEXTO">Texto libre</option>
            <option value="SI_NO">Si / No</option>
            <option value="LISTA">Lista desplegable</option>
            <option value="FECHA">Fecha</option>
          </select>
        </div>
        {form.tipoCampo === "LISTA" && (
          <div>
            <label className="label">Opciones (separadas por |)</label>
            <input
              className="input"
              placeholder="Ej: Bajo|Medio|Alto"
              value={form.opcionesLista}
              onChange={(e) => setForm({ ...form, opcionesLista: e.target.value })}
            />
          </div>
        )}
        <div>
          <label className="label">Orden</label>
          <input
            type="number"
            className="input"
            value={form.orden}
            onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="obligatorio"
            checked={form.obligatorio}
            onChange={(e) => setForm({ ...form, obligatorio: e.target.checked })}
          />
          <label htmlFor="obligatorio" className="text-sm">
            Obligatorio
          </label>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary">
            Agregar campo
          </button>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      </form>

      <select className="input max-w-xs" value={filtroEscuela} onChange={(e) => setFiltroEscuela(e.target.value)}>
        <option value="">Todas las escuelas</option>
        {escuelas.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre}
          </option>
        ))}
      </select>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 pr-2">Escuela</th>
              <th className="py-2 pr-2">Punto</th>
              <th className="py-2 pr-2">Campo</th>
              <th className="py-2 pr-2">Tipo</th>
              <th className="py-2 pr-2">Obligatorio</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {camposFiltrados.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-2 pr-2">{c.escuela.nombre}</td>
                <td className="py-2 pr-2">{c.puntoControl.codigo}</td>
                <td className="py-2 pr-2">{c.nombreCampo}</td>
                <td className="py-2 pr-2">{c.tipoCampo}</td>
                <td className="py-2 pr-2">{c.obligatorio ? "Si" : "No"}</td>
                <td className="py-2">
                  <button className="text-red-600 underline" onClick={() => eliminar(c.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
