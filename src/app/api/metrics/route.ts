import { NextRequest, NextResponse } from "next/server";
import { isMetricsRequest } from "@/lib/metricsAuth";

// Accesso al dashboard /metrics: verifica la chiave. I dati li chiede ogni pagina alla sua API.
export async function GET(request: NextRequest) {
  if (!isMetricsRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ timestamp: new Date().toISOString() });
}
