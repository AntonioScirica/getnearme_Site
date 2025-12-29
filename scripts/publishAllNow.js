#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Variabili d\'ambiente mancanti');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function publishAllNow() {
    console.log('Pubblicazione immediata di tutti gli articoli con status="published"...\n');
    
    const now = new Date().toISOString();
    console.log(`Data di pubblicazione: ${now}\n`);
    
    // Aggiorna tutti gli articoli con status="published" impostando published_at a ora
    const { data, error } = await supabase
        .from('articles')
        .update({ published_at: now })
        .eq('status', 'published')
        .select('id, slug, published_at');
    
    if (error) {
        console.error('Errore:', error.message);
        process.exit(1);
    }
    
    console.log(`✓ Pubblicati immediatamente ${data?.length || 0} articoli\n`);
    
    if (data && data.length > 0) {
        console.log('Articoli aggiornati:');
        data.forEach(article => {
            console.log(`  - ${article.slug}`);
        });
    }
}

publishAllNow().catch(err => {
    console.error('Errore fatale:', err.message);
    process.exit(1);
});

