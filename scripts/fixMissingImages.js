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
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const FALLBACK_IMAGE = '/blog/default.webp';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variabili Supabase mancanti');
    process.exit(1);
}

if (!UNSPLASH_ACCESS_KEY) {
    console.error('❌ UNSPLASH_ACCESS_KEY mancante');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Genera query di ricerca dal titolo
function generateSearchQuery(title, tags) {
    const keywords = [];
    
    // Estrai parole chiave dal titolo (prime 4-5 parole significative)
    if (title) {
        const words = title
            .toLowerCase()
            .replace(/[^a-zàèéìòù\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3)
            .filter(w => !['come', 'cosa', 'quando', 'perché', 'dove', 'quale', 'della', 'dello', 'delle', 'degli', 'nella', 'nello', 'nelle', 'negli', 'anche', 'ancora', 'sempre', 'tutto', 'tutti', 'questa', 'questo', 'queste', 'questi', 'essere', 'avere', 'fare', 'stai', 'scegliere', 'confrontare', 'valutare', 'capire'].includes(w))
            .slice(0, 4);
        keywords.push(...words);
    }
    
    // Aggiungi alcuni tag
    if (Array.isArray(tags) && tags.length > 0) {
        keywords.push(...tags.slice(0, 2));
    }
    
    // Aggiungi contesto immobiliare
    const contextWords = ['apartment', 'home', 'interior', 'living room', 'house'];
    const randomContext = contextWords[Math.floor(Math.random() * contextWords.length)];
    keywords.push(randomContext);
    
    return keywords.join(' ').trim();
}

// Cerca immagine su Unsplash
async function fetchUnsplashImage(query) {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('per_page', '5');

    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
        });

        if (!response.ok) {
            console.log(`  ⚠️ Unsplash API error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            // Prendi un'immagine random tra i primi 5 risultati
            const randomIndex = Math.floor(Math.random() * Math.min(data.results.length, 5));
            return data.results[randomIndex].urls.regular;
        }

        return null;
    } catch (err) {
        console.log(`  ⚠️ Errore fetch Unsplash: ${err.message}`);
        return null;
    }
}

async function fixMissingImages() {
    console.log('\n🔍 Ricerca articoli con immagini mancanti...\n');
    
    // Trova articoli senza immagine o con immagine di fallback
    const { data: articles, error } = await supabase
        .from('articles')
        .select('id, slug, title, tags, image_url')
        .or(`image_url.is.null,image_url.eq.${FALLBACK_IMAGE},image_url.eq.`);
    
    if (error) {
        console.error('❌ Errore query:', error.message);
        process.exit(1);
    }
    
    // Filtra anche immagini che potrebbero essere broken (URL Unsplash source vecchi)
    const { data: allArticles } = await supabase
        .from('articles')
        .select('id, slug, title, tags, image_url');
    
    const articlesToFix = (allArticles || []).filter(a => {
        if (!a.image_url) return true;
        if (a.image_url === FALLBACK_IMAGE) return true;
        if (a.image_url === '') return true;
        // Vecchi URL source.unsplash.com che potrebbero non funzionare
        if (a.image_url.includes('source.unsplash.com')) return true;
        return false;
    });
    
    if (articlesToFix.length === 0) {
        console.log('✅ Tutti gli articoli hanno già un\'immagine valida!\n');
        return;
    }
    
    console.log(`📷 Trovati ${articlesToFix.length} articoli da aggiornare\n`);
    
    let updated = 0;
    let failed = 0;
    
    for (let i = 0; i < articlesToFix.length; i++) {
        const article = articlesToFix[i];
        console.log(`[${i + 1}/${articlesToFix.length}] ${article.slug}`);
        
        const searchQuery = generateSearchQuery(article.title, article.tags);
        console.log(`  🔎 Query: "${searchQuery}"`);
        
        const imageUrl = await fetchUnsplashImage(searchQuery);
        
        if (imageUrl) {
            const { error: updateError } = await supabase
                .from('articles')
                .update({ image_url: imageUrl })
                .eq('id', article.id);
            
            if (updateError) {
                console.log(`  ❌ Errore update: ${updateError.message}`);
                failed++;
            } else {
                console.log(`  ✅ Immagine aggiornata`);
                updated++;
            }
        } else {
            // Fallback: usa l'immagine di default
            const { error: updateError } = await supabase
                .from('articles')
                .update({ image_url: FALLBACK_IMAGE })
                .eq('id', article.id);
            
            if (!updateError) {
                console.log(`  ⚠️ Usato fallback`);
            }
            failed++;
        }
        
        // Rate limiting: aspetta 200ms tra le richieste
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Risultato:`);
    console.log(`  ✅ Aggiornati: ${updated}`);
    console.log(`  ❌ Falliti: ${failed}`);
    console.log(`  📷 Totale: ${articlesToFix.length}\n`);
}

fixMissingImages().catch(err => {
    console.error('❌ Errore fatale:', err.message);
    process.exit(1);
});

