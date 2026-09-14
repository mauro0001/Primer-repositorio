"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const esAdmin = session?.user?.rol === "ADMIN";

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      pathname?.startsWith(href) ? "bg-duoc text-white" : "text-slate-700 hover:bg-slate-100"
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="font-bold text-duoc">Cumplimiento SSO</div>
        <nav className="flex flex-wrap gap-1">
          {esAdmin ? (
            <>
              <Link href="/admin" className={linkClass("/admin")}>
                Panel
              </Link>
              <Link href="/admin/cargos" className={linkClass("/admin/cargos")}>
                Cargos
              </Link>
              <Link href="/admin/directores" className={linkClass("/admin/directores")}>
                Directores
              </Link>
              <Link href="/admin/puntos" className={linkClass("/admin/puntos")}>
                Puntos
              </Link>
              <Link href="/admin/campos-escuela" className={linkClass("/admin/campos-escuela")}>
                Campos por escuela
              </Link>
              <Link href="/admin/proveedores" className={linkClass("/admin/proveedores")}>
                Proveedores
              </Link>
              <Link href="/admin/calendario" className={linkClass("/admin/calendario")}>
                Calendario
              </Link>
              <Link href="/admin/usuarios" className={linkClass("/admin/usuarios")}>
                Usuarios
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className={linkClass("/dashboard")}>
                Mis puntos
              </Link>
              <Link href="/registros" className={linkClass("/registros")}>
                Historial
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hidden sm:inline">{session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-secondary !py-1 !px-3">
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
