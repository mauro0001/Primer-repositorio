"use client";

import { FormEvent, useEffect, useState } from "react";
import { CsvImportBox } from "@/components/CsvImportBox";

type Escuela = { id: string; nombre: string };
type Director = {
  id: string;
  escuelaId: string;
  escuela: Escuela;
  carreraNombre: string;
  personaNombre: string;
  personaEmail: string;
  jefaturaEmail: string | null;
  activo: boolean;
};

const VACIO = { escuelaId: "", carreraNombre: "", personaNombre: "", personaEmail: "", jefaturaEmail: "" };

export default function DirectoresPage() {
  const [directores, setDirectores] = useState<Director[]>([]);
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    const [rd, re] = await Promise.all([fetch("/api/admin/directores"), fetch("/api/escuelas")]);
    const directoresData = await rd.json();
    setDirectores(directoresData);
    const escuelasData = await re.json();
    setEscuelas(escuelasData);
    if (!form.escuelaId && escuelasData[0]) setForm((f) => ({ ...f, escuelaId: escuelasData[0].id }));
  }
  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function editar(d: Director) {
    setEditandoId(d.id);
    setForm({
      escuelaId: d.escuelaId,
      carreraNombre: d.carreraNombre,
      personaNombre: d.personaNombre,
      personaEmail: d.personaEmail,
      jefaturaEmail: d.jefaturaEmail || "",
    });
  }

  function cancelar() {
    setEditandoId(null);
    setForm({ ...VACIO, escuelaId: escuelas[0]?.id || "" });
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = editandoId
        ? await fetch(`/api/admin/directores/${editandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, activo: true }),
          })
        : await fetch("/api/admin/directores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      cancelar();
      cargar();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function desactivar(id: string) {
    if (!confirm("¿Desactivar este director/a?")) return;
    await fetch(`/api/admin/directores/${id}`, { method: "DELETE" });
    cargar();
  }

  async function reactivar(d: Director) {
    await fetch(`/api/admin/directores/${d.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, activo: true }),
    });
    cargar();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Directores de Carrera (13, en 6 escuelas)</h1>
        <CsvImportBox
          endpoint="/api/admin/import/directores"
          formatoAyuda="CSV: escuelaNombre,carreraNombre,personaNombre,personaEmail,jefaturaEmail. escuelaNombre debe coincidir con el nombre exacto de una escuela existente."
          onImportado={cargar}
        />
      </div>

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
          <label className="label">Carrera que dirige</label>
          <input
            className="input"
            required
            value={form.carreraNombre}
            onChange={(e) => setForm({ ...form, carreraNombre: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Nombre del director/a</label>
          <input
            className="input"
            required
            value={form.personaNombre}
            onChange={(e) => setForm({ ...form, personaNombre: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Correo</label>
          <input
            type="email"
            className="input"
            required
            value={form.personaEmail}
            onChange={(e) => setForm({ ...form, personaEmail: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Correo de jefatura (escalamiento, opcional)</label>
          <input
            type="email"
            className="input"
            value={form.jefaturaEmail}
            onChange={(e) => setForm({ ...form, jefaturaEmail: e.target.value })}
          />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={cargando} className="btn-primary">
            {editandoId ? "Guardar cambios" : "Agregar director/a"}
          </button>
          {editandoId && (
            <button type="button" className="btn-secondary" onClick={cancelar}>
              Cancelar
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      </form>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 pr-2">Escuela</th>
              <th className="py-2 pr-2">Carrera</th>
              <th className="py-2 pr-2">Director/a</th>
              <th className="py-2 pr-2">Correo</th>
              <th className="py-2 pr-2">Estado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {directores.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="py-2 pr-2">{d.escuela.nombre}</td>
                <td className="py-2 pr-2">{d.carreraNombre}</td>
                <td className="py-2 pr-2">{d.personaNombre}</td>
                <td className="py-2 pr-2">{d.personaEmail}</td>
                <td className="py-2 pr-2">{d.activo ? "Activo" : "Inactivo"}</td>
                <td className="py-2 flex gap-2">
                  <button className="text-duoc underline" onClick={() => editar(d)}>
                    Editar
                  </button>
                  {d.activo ? (
                    <button className="text-red-600 underline" onClick={() => desactivar(d.id)}>
                      Desactivar
                    </button>
                  ) : (
                    <button className="text-green-600 underline" onClick={() => reactivar(d)}>
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
