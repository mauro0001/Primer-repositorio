import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { requireAdmin } from "@/lib/adminGuard";
import { prisma } from "@/lib/prisma";

// CSV esperado (encabezados exactos): escuelaNombre,carreraNombre,personaNombre,personaEmail,jefaturaEmail
// escuelaNombre debe coincidir exactamente con el nombre de una de las 6 escuelas ya creadas.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { csv } = await req.json();
  if (!csv) return NextResponse.json({ error: "Falta el contenido CSV" }, { status: 400 });

  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: `Error al leer CSV: ${parsed.errors[0].message}` }, { status: 400 });
  }

  const escuelas = await prisma.escuela.findMany();
  const escuelasPorNombre = new Map(escuelas.map((e) => [e.nombre.trim().toLowerCase(), e.id]));

  let creados = 0;
  const errores: string[] = [];

  for (const [i, fila] of parsed.data.entries()) {
    const escuelaNombre = fila.escuelaNombre?.trim();
    const escuelaId = escuelaNombre ? escuelasPorNombre.get(escuelaNombre.toLowerCase()) : undefined;
    if (!escuelaId) {
      errores.push(`Fila ${i + 2}: no se encontro la escuela "${escuelaNombre}"`);
      continue;
    }
    if (!fila.carreraNombre || !fila.personaNombre || !fila.personaEmail) {
      errores.push(`Fila ${i + 2}: faltan campos obligatorios`);
      continue;
    }
    try {
      await prisma.directorEscuela.create({
        data: {
          escuelaId,
          carreraNombre: fila.carreraNombre.trim(),
          personaNombre: fila.personaNombre.trim(),
          personaEmail: fila.personaEmail.trim().toLowerCase(),
          jefaturaEmail: fila.jefaturaEmail?.trim() || null,
        },
      });
      creados++;
    } catch (e: any) {
      errores.push(`Fila ${i + 2}: ${e.message}`);
    }
  }

  return NextResponse.json({ creados, errores });
}
