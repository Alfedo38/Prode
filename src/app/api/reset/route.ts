// src/app/api/reset/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db"; 

export async function GET() {
  try {
    // Eliminamos todas las predicciones y equipos de prueba
    await db.prediction.deleteMany();
    await db.fantasyTeam.deleteMany();

    return NextResponse.json({ 
      success: true, 
      message: "¡BASE DE DATOS 100% FORMATEADA PARA EL OPENING DAY!"
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error limpiando" }, { status: 500 });
  }
}