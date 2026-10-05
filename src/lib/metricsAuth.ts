import type { NextRequest } from 'next/server'

// Stessa chiave del dashboard /metrics (LoginScreen + /api/metrics*), header x-metrics-key.
// ponytail: la chiave e' anche nel bundle del client (LoginScreen); spostarla in env + verifica solo server.
const METRICS_KEY = 'ZuoQ6k*_6wmBbUQQim!B'

export const isMetricsRequest = (req: NextRequest) => req.headers.get('x-metrics-key') === METRICS_KEY
