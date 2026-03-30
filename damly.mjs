// damly.mjs
import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const DAMLY_ID = "33629e99-bb97-438b-a546-db3aaedaa5da";
const API = "https://wuynrxitsifvltcjoivx.supabase.co/functions/v1/canvas-server";
const SKIP = ['node_modules', '.next', '.git', 'dist', 'build'];

function scan(dir, base = dir) {
    const files = [];
    for (const e of readdirSync(dir)) {
        if (SKIP.includes(e)) continue;
        const full = join(dir, e);
        if (statSync(full).isDirectory()) files.push(...scan(full, base));
        else if (/\.(tsx?|jsx?)$/.test(e) && !/\.(test|spec|stories|d)\./i.test(e))
            files.push(relative(base, full));
    }
    return files;
}

const res = await fetch(`${API}/projects/${DAMLY_ID}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: scan('.') })
});
const data = await res.json();
console.log(data.success ? `Sync: ${data.created} creati, ${data.updated} aggiornati, ${data.deleted} rimossi` : `Errore: ${data.error}`);