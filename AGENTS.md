# MatteiWeekly Manager - AGENTS.md

## Informazioni Progetto

**Nome:** MatteiWeekly Manager  
**Versione:** 1.2.0  
**Codename:** Primarina  
**Istituzione:** ITIS E. Mattei, San Donato Milanese  
**Tipo:** Giornalino Scolastico - Piattaforma di Gestione

## Stack Tecnologico

- **Framework:** Next.js 14 (App Router)
- **Linguaggio:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **Backend:** Supabase (Auth, PostgreSQL, Realtime)
- **Deploy Target:** Vercel

## Architettura Ruoli

### Scrittori
- Creano/modificano propri articoli
- Salvano bozze
- Inviano per revisione
- Vedono solo i propri articoli
- Accesso chat

### Verificatori
- Tutti i permessi degli Scrittori
- Vedono tutti gli articoli in revisione
- Approvano/rifiutano articoli
- Aggiungono commenti sugli articoli
- Gestiscono la To-Do list

### Amministratori
- Tutti i permessi
- Gestione utenti e ruoli
- Elimina qualsiasi articolo
- Accesso pannello admin
- Statistiche complete

## Struttura Database

Tabelle principali:
- `profiles` - Utenti
- `articles` - Articoli
- `comments` - Commenti
- `todos` - Compiti
- `chat_messages` - Messaggi chat
- `notifications` - Notifiche

## Ambiente di Sviluppo

### Setup
```bash
npm install
# Crea .env.local con:
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
npm run dev
```

### Build
```bash
npm run build
```

## Convenzioni Codice

- Componenti in PascalCase
- File in kebab-case
- Hooks personalizzati prefisso `use-`
- Types in `types/` folder
- Utility in `lib/` folder

## Colori Brand

- Primary: Blue (#3b82f6)
- Secondary: Purple (#8b5cf6)
- Success: Green (#22c55e)
- Warning: Yellow (#eab308)
- Error: Red (#ef4444)

## Note Deployment

- Richiede configurazione Supabase
- Eseguire schema SQL prima del deploy
- Configurare RLS policies
- Abilitare Realtime per chat e notifiche
