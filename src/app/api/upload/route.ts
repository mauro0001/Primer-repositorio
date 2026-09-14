import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const EXTENSIONES_PERMITIDAS = [".pdf", ".jpg", ".jpeg", ".png", ".xlsx", ".xls", ".doc", ".docx"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No se envio ningun archivo" }, { status: 400 });

  const maxMb = Number(process.env.MAX_UPLOAD_MB || 10);
  if (file.size > maxMb * 1024 * 1024) {
    return NextResponse.json({ error: `El archivo supera el limite de ${maxMb}MB` }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
    return NextResponse.json(
      { error: `Tipo de archivo no permitido. Formatos aceptados: ${EXTENSIONES_PERMITIDAS.join(", ")}` },
      { status: 400 }
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const nombreUnico = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, nombreUnico), bytes);

  return NextResponse.json({
    url: `/uploads/${nombreUnico}`,
    nombre: file.name,
  });
}
