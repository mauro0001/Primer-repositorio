"use client";

import { FormEvent, useEffect, useState } from "react";

type Usuario = {
  id: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "RESPONSABLE";
  activo: boolean;
};

const VACIO = { email: "", nombre: "", password: "", rol: "RESPONSABLE" as "ADMIN" | "RESPONSABLE" };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState("");

  async function cargar() {
    const res = await fetch("/api/admin/usuarios");
    setUsuarios(await res.json());
  }
  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setForm(VACIO);
    cargar();
  }

  async function cambiarRol(u: Usuario, rol: "ADMIN" | "RESPONSABLE") {
    await fetch(`/api/admin/usuarios/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...u, rol }),
    });
    cargar();
  }

  async function desactivar(id: string) {
    if (!confirm("¿Desactivar esta cuenta? La persona no podra iniciar sesion.")) return;
    await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
    cargar();
  }

  async function guardarPassword(u: Usuario) {
    if (nuevaPassword.length < 8) {
      alert("La contrasena debe tener al menos 8 caracteres");
      return;
    }
    await fetch(`/api/admin/usuarios/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...u, password: nuevaPassword }),
    });
    setResetId(null);
    setNuevaPassword("");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-slate-800">Cuentas de usuario</h1>
      <p className="text-sm text-slate-500">
        Crea una cuenta para cada persona que debe iniciar sesion (correo @duoc.cl). El correo debe coincidir con el
        que aparece en Cargos Institucionales o Directores de Escuela para que vea sus puntos asignados.
      </p>

      <form onSubmit={crear} className="card grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Correo institucional</label>
          <input
            type="email"
            className="input"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Nombre</label>
          <input className="input" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div>
          <label className="label">Contrasena inicial (minimo 8 caracteres)</label>
          <input
            type="text"
            className="input"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Rol</label>
          <select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as any })}>
            <option value="RESPONSABLE">Responsable</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary">
            Crear cuenta
          </button>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      </form>

      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 pr-2">Correo</th>
              <th className="py-2 pr-2">Nombre</th>
              <th className="py-2 pr-2">Rol</th>
              <th className="py-2 pr-2">Estado</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b last:border-0 align-top">
                <td className="py-2 pr-2">{u.email}</td>
                <td className="py-2 pr-2">{u.nombre}</td>
                <td className="py-2 pr-2">
                  <select className="input !py-1" value={u.rol} onChange={(e) => cambiarRol(u, e.target.value as any)}>
                    <option value="RESPONSABLE">Responsable</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </td>
                <td className="py-2 pr-2">{u.activo ? "Activa" : "Inactiva"}</td>
                <td className="py-2">
                  <div className="flex flex-col gap-1">
                    {resetId === u.id ? (
                      <div className="flex gap-1">
                        <input
                          className="input !py-1 w-32"
                          placeholder="Nueva clave"
                          value={nuevaPassword}
                          onChange={(e) => setNuevaPassword(e.target.value)}
                        />
                        <button className="text-duoc underline text-xs" onClick={() => guardarPassword(u)}>
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <button className="text-duoc underline text-left" onClick={() => setResetId(u.id)}>
                        Resetear clave
                      </button>
                    )}
                    {u.activo && (
                      <button className="text-red-600 underline text-left" onClick={() => desactivar(u.id)}>
                        Desactivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
