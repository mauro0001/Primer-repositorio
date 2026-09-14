import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Nucleo del Tipo B: dado un punto de control y una escuela, devuelve la lista de
// campos adicionales que esa escuela exige, para que el formulario los renderice
// dinamicamente sin necesidad de una pantalla distinta por escuela.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const puntoControlId = req.nextUrl.searchParams.get("puntoControlId");
  const escuelaId = req.nextUrl.searchParams.get("escuelaId");
  if (!puntoControlId || !escuelaId) {
    return NextResponse.json({ error: "Faltan parametros" }, { status: 400 });
  }

  const campos = await prisma.campoRequeridoEscuela.findMany({
    where: { puntoControlId, escuelaId },
    orderBy: { orden: "asc" },
  });

  return NextResponse.json(
    campos.map((c) => ({
      id: c.id,
      nombreCampo: c.nombreCampo,
      tipoCampo: c.tipoCampo,
      opcionesLista: c.opcionesLista ? c.opcionesLista.split("|") : [],
      obligatorio: c.obligatorio,
      orden: c.orden,
    }))
  );
}
