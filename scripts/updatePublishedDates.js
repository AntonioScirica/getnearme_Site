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

async function updateDates() {
    console.log('Aggiornamento date published_at da UTC a ora italiana...\n');
    
    // Trova tutti gli articoli con published_at alle 18:00 UTC (che dovrebbero essere 19:00 italiane)
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, slug, published_at')
        .eq('status', 'published')
        .not('published_at', 'is', null);
    
    if (error) {
        console.error('Errore:', error.message);
        process.exit(1);
    }
    
    let updated = 0;
    
    for (const article of articles || []) {
        if (!article.published_at) continue;
        
        const publishedDate = new Date(article.published_at);
        const hour = publishedDate.getUTCHours();
        
        // Se è alle 18:00 UTC, converti a 17:00 UTC (18:00 italiane in inverno)
        if (hour === 18) {
            publishedDate.setUTCHours(17);
            const newDate = publishedDate.toISOString();
            
            const { error: updateError } = await supabase
                .from('articles')
                .update({ published_at: newDate })
                .eq('id', article.id);
            
            if (updateError) {
                console.error(`Errore aggiornamento ${article.slug}:`, updateError.message);
            } else {
                console.log(`✓ ${article.slug}: ${article.published_at} → ${newDate}`);
                updated++;
            }
        }
    }
    
    console.log(`\nAggiornati ${updated} articoli`);
}

updateDates().catch(err => {
    console.error('Errore fatale:', err.message);
    process.exit(1);
});

