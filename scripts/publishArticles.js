#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const ARTICLES_FILE = path.join(__dirname, 'articles.json');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const FALLBACK_IMAGE = '/blog/default.webp';

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString().slice(11, 19);
    const prefix = `${colors.dim}[${timestamp}]${colors.reset}`;

    switch (type) {
        case 'success':
            console.log(`${prefix} ${colors.green}✓${colors.reset} ${message}`);
            break;
        case 'skip':
            console.log(`${prefix} ${colors.yellow}→${colors.reset} ${message}`);
            break;
        case 'error':
            console.log(`${prefix} ${colors.red}✗${colors.reset} ${message}`);
            break;
        case 'info':
        default:
            console.log(`${prefix} ${colors.cyan}ℹ${colors.reset} ${message}`);
            break;
    }
}

function logSeparator() {
    console.log(colors.dim + '─'.repeat(60) + colors.reset);
}

function validateEnvironment() {
    const missing = [];

    if (!SUPABASE_URL) {
        missing.push('SUPABASE_URL');
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        missing.push('SUPABASE_SERVICE_ROLE_KEY');
    }

    if (!UNSPLASH_ACCESS_KEY) {
        missing.push('UNSPLASH_ACCESS_KEY');
    }

    if (missing.length > 0) {
        log(`Variabili d'ambiente mancanti: ${missing.join(', ')}`, 'error');
        log('Imposta le variabili prima di eseguire lo script:', 'info');
        console.log('\n  export SUPABASE_URL="https://xxx.supabase.co"');
        console.log('  export SUPABASE_SERVICE_ROLE_KEY="eyJ..."');
        console.log('  export UNSPLASH_ACCESS_KEY="your_unsplash_access_key"\n');
        process.exit(1);
    }
}

function readArticlesFile() {
    if (!fs.existsSync(ARTICLES_FILE)) {
        log(`File non trovato: ${ARTICLES_FILE}`, 'error');
        log('Crea il file articles.json con un array di articoli', 'info');
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(ARTICLES_FILE, 'utf-8');
        const articles = JSON.parse(content);

        if (!Array.isArray(articles)) {
            log('Il file JSON deve contenere un array di articoli', 'error');
            process.exit(1);
        }

        return articles;
    } catch (err) {
        log(`Errore parsing JSON: ${err.message}`, 'error');
        process.exit(1);
    }
}

function validateArticle(article) {
    const required = ['slug', 'locale', 'title', 'excerpt', 'content', 'image_query'];
    const missing = required.filter(field => !article[field]);

    if (missing.length > 0) {
        return { valid: false, error: `Campi mancanti: ${missing.join(', ')}` };
    }

    const validLocales = ['it', 'en', 'es', 'fr', 'ru', 'uk'];
    if (!validLocales.includes(article.locale)) {
        return { valid: false, error: `Locale non valido: ${article.locale}` };
    }

    if (article.status && !['draft', 'published'].includes(article.status)) {
        return { valid: false, error: `Status non valido: ${article.status}` };
    }

    return { valid: true };
}

function formatContent(content) {
    let formatted = content;

    // Trasforma "1) Testo", "2) Testo", ecc. in "**1) Testo**" (bold)
    formatted = formatted.replace(/^(\d+)\) (.+)$/gm, (match, num, text) => {
        if (text.startsWith('**') || match.includes('###')) {
            return match;
        }
        return `**${num}) ${text}**`;
    });

    // Trasforma "Casa A", "Casa B", ecc. in "**Casa A**", "**Casa B**" (bold)
    // Solo se non sono già in bold
    formatted = formatted.replace(/(?<!\*\*)Casa ([A-Z])(?!\*\*)/g, '**Casa $1**');

    return formatted;
}

async function fetchUnsplashImage(imageQuery) {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', imageQuery);
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('per_page', '1');

    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            return data.results[0].urls.regular;
        }

        return null;
    } catch {
        return null;
    }
}

async function publishArticles() {
    console.log('\n');
    log('AVVIO PUBBLICAZIONE ARTICOLI', 'info');
    logSeparator();

    validateEnvironment();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    log('Connesso a Supabase', 'success');

    const articles = readArticlesFile();
    log(`Trovati ${articles.length} articoli in articles.json`, 'info');
    logSeparator();

    const { data: existingArticles, error: fetchError } = await supabase
        .from('articles')
        .select('slug');

    if (fetchError) {
        log(`Errore fetch articoli esistenti: ${fetchError.message}`, 'error');
        process.exit(1);
    }

    const existingSlugs = new Set(existingArticles?.map(a => a.slug) || []);
    log(`${existingSlugs.size} articoli già presenti nel database`, 'info');
    logSeparator();

    let published = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const label = `[${i + 1}/${articles.length}] ${article.slug || 'SLUG_MANCANTE'}`;

        const validation = validateArticle(article);
        if (!validation.valid) {
            log(`${label} - ${validation.error}`, 'error');
            errors++;
            continue;
        }

        if (existingSlugs.has(article.slug)) {
            log(`${label} - già esistente, saltato`, 'skip');
            skipped++;
            continue;
        }

        const unsplashUrl = await fetchUnsplashImage(article.image_query);
        const imageUrl = unsplashUrl || FALLBACK_IMAGE;

        if (unsplashUrl) {
            log(`Immagine Unsplash: ${unsplashUrl}`, 'info');
        } else {
            log(`Fallback immagine: ${FALLBACK_IMAGE}`, 'skip');
        }

        // Se published_at è nel JSON, usalo (permette programmazione)
        // Altrimenti usa la data corrente (pubblicazione immediata)
        let publishedAt = null;
        if (article.status !== 'draft') {
            if (article.published_at) {
                try {
                    let dateStr = article.published_at.trim();
                    
                    // Se la data NON ha timezone (non finisce con Z o +/-), 
                    // assumiamo che sia ora italiana e convertiamo in UTC
                    if (!dateStr.match(/[Z+-]\d{2}:?\d{2}$/)) {
                        // Aggiungi formato completo se manca l'ora
                        if (!dateStr.includes('T')) {
                            dateStr += 'T00:00:00';
                        }
                        
                        // Determina se siamo in periodo estivo (ora legale)
                        // In Italia: ultima domenica di marzo -> ultima domenica di ottobre
                        const [datePart, timePart] = dateStr.split('T');
                        const [year, month, day] = datePart.split('-').map(Number);
                        const testDate = new Date(Date.UTC(year, month - 1, day));
                        
                        // Approssimazione: marzo-ottobre = estate (UTC+2), resto = inverno (UTC+1)
                        const isDST = month >= 4 && month <= 9;
                        const italianOffset = isDST ? 2 : 1;
                        
                        // Crea la data come se fosse italiana (aggiungi offset) e convertila in UTC
                        const dateWithItalianTZ = new Date(dateStr + `+0${italianOffset}:00`);
                        publishedAt = dateWithItalianTZ.toISOString();
                        log(`${label} - Data italiana ${dateStr} (UTC+${italianOffset}) convertita in UTC: ${publishedAt}`, 'info');
                    } else {
                        // Ha già timezone, usala così com'è
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) {
                            log(`${label} - Data published_at non valida: ${dateStr}, uso data corrente`, 'skip');
                            publishedAt = new Date().toISOString();
                        } else {
                            publishedAt = date.toISOString();
                        }
                    }
                } catch (e) {
                    log(`${label} - Errore parsing published_at: ${article.published_at}, errore: ${e.message}`, 'skip');
                    publishedAt = new Date().toISOString();
                }
            } else {
                publishedAt = new Date().toISOString();
            }
        }

        const insertData = {
            slug: article.slug,
            locale: article.locale,
            title: article.title,
            excerpt: article.excerpt,
            content: formatContent(article.content),
            tags: article.tags || [],
            image_url: imageUrl,
            image_alt: article.image_alt || article.title,
            author: article.author || 'GetNearMe',
            status: article.status || 'published',
            published_at: publishedAt,
        };

        const { error: insertError } = await supabase
            .from('articles')
            .insert(insertData);

        if (insertError) {
            log(`${label} - Errore: ${insertError.message}`, 'error');
            errors++;
            continue;
        }

        // Log con indicazione se programmato
        if (publishedAt && new Date(publishedAt) > new Date()) {
            const now = new Date().toISOString();
            log(`${label} - PROGRAMMATO per ${publishedAt} (ora: ${now})`, 'success');
        } else {
            log(`${label} - PUBBLICATO (published_at: ${publishedAt})`, 'success');
        }
        published++;

        existingSlugs.add(article.slug);
    }

    logSeparator();
    console.log('\n');
    log('PUBBLICAZIONE COMPLETATA', 'info');
    console.log(`
  ${colors.green}Pubblicati:${colors.reset}  ${published}
  ${colors.yellow}Saltati:${colors.reset}     ${skipped}
  ${colors.red}Errori:${colors.reset}      ${errors}
  ${colors.dim}Totale:${colors.reset}      ${articles.length}
  `);

    if (errors > 0) {
        process.exit(1);
    }
}

publishArticles().catch(err => {
    log(`Errore fatale: ${err.message}`, 'error');
    process.exit(1);
});
