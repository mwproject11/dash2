# MatteiWeekly Manager v1.2.0 "Primarina"

Piattaforma di gestione per il giornalino scolastico dell'**ITIS E. Mattei** di San Donato Milanese.

## Caratteristiche

- **Sistema di Autenticazione** completo con ruoli (Scrittori, Verificatori, Amministratori)
- **Gestione Articoli** con flusso di approvazione (Bozza → Revisione → Approvato/Rifiutato)
- **Commenti** sugli articoli per feedback e revisione
- **Chat Globale** in tempo reale per la comunicazione del team
- **To-Do List** condivisa per la gestione dei compiti
- **Sistema Notifiche** realtime (chat, approvazioni, commenti, assegnazioni)
- **Dark/Light Mode** supporto tema chiaro e scuro
- **Responsive Design** ottimizzato per desktop e mobile
- **PWA Ready** con supporto notifiche push

## Tecnologie

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **UI Components:** shadcn/ui, Radix UI
- **Backend:** Supabase (Auth, PostgreSQL, Realtime)
- **Deploy:** Ottimizzato per Vercel

## Requisiti

- Node.js 18+
- Account Supabase
- Account Vercel (per deployment)

## Setup Locale

1. **Clona il repository:**
```bash
git clone <repository-url>
cd matteiweekly-manager
```

2. **Installa le dipendenze:**
```bash
npm install
```

3. **Configura le variabili d'ambiente:**
Crea un file `.env.local` nella root del progetto:
```env
NEXT_PUBLIC_SUPABASE_URL=il-tuo-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=la-tua-anon-key
```

4. **Avvia il server di sviluppo:**
```bash
npm run dev
```

5. **Apri** [http://localhost:3000](http://localhost:3000) nel browser.

## Configurazione Supabase

### 1. Crea un nuovo progetto su Supabase

Vai su [https://supabase.com](https://supabase.com) e crea un nuovo progetto.

### 2. Esegui lo schema SQL

Nella sezione "SQL Editor" di Supabase, esegui i seguenti file in ordine:

1. `supabase/schema.sql` - Crea le tabelle
2. `supabase/rls.sql` - Configura le policy di sicurezza
3. `supabase/triggers.sql` - Crea i trigger e abilita realtime

### 3. Configura l'Auth

Nella sezione "Authentication" → "Settings":

- **Site URL:** `http://localhost:3000` (per sviluppo) o il tuo dominio Vercel
- **Redirect URLs:** Aggiungi i domini di produzione

### 4. Ottieni le credenziali

Vai in "Project Settings" → "API" e copia:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Ruoli Utente

| Ruolo | Permessi |
|-------|----------|
| **Scrittore** | Crea/modifica propri articoli, vede chat, riceve notifiche |
| **Verificatore** | Tutto lo Scrittore + approva/rifiuta articoli, commenta, gestisce To-Do |
| **Amministratore** | Tutti i permessi + gestione utenti, pannello admin completo |

## Deploy su Vercel

### 1. Prepara il progetto

```bash
npm run build
```

### 2. Deploy su Vercel

1. Vai su [https://vercel.com](https://vercel.com)
2. Importa il progetto da GitHub/GitLab/Bitbucket
3. Configura le variabili d'ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

### 3. Configura Supabase per Produzione

Aggiorna l'URL del sito in Supabase Authentication → Settings:
- Site URL: `https://tuo-dominio.vercel.app`

## Struttura del Progetto

```
matteiweekly-manager/
├── app/                    # Next.js App Router
│   ├── login/             # Pagina login
│   ├── register/          # Pagina registrazione
│   ├── dashboard/         # Dashboard principale
│   │   └── articoli/      # Gestione articoli
│   ├── chat/              # Chat globale
│   ├── todo/              # To-Do list
│   ├── admin/             # Pannello admin
│   ├── regolamento/       # Pagina regolamento
│   ├── faq/               # Pagina FAQ
│   └── page.tsx           # Redirect a login/dashboard
├── components/            # Componenti React
│   ├── ui/               # Componenti UI (shadcn)
│   ├── providers/        # Context providers
│   ├── navbar.tsx        # Navbar principale
│   └── notifications-dropdown.tsx
├── hooks/                 # Custom React hooks
├── lib/                   # Utility e configurazioni
│   ├── supabase.ts       # Client Supabase
│   ├── utils.ts          # Utility functions
│   └── auth.ts           # Helper autenticazione
├── types/                 # TypeScript types
├── supabase/              # Schema SQL
└── public/                # File statici
```

## Funzionalità Notifiche

Le notifiche funzionano in tempo reale tramite Supabase Realtime e includono:

- **Notifiche Browser:** Richiedi il permesso per ricevere notifiche anche con il sito chiuso
- **Badge Notifiche:** Indicatore visivo di notifiche non lette nella navbar
- **Toast Notifications:** Messaggi popup per eventi importanti
- **Tipi di Notifiche:**
  - Nuovi messaggi in chat
  - Articoli approvati/rifiutati
  - Nuovi commenti sugli articoli
  - Compiti assegnati

## Personalizzazione

### Colori Tema

Modifica `app/globals.css` per cambiare i colori del tema:

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Cambia questo valore HSL */
}
```

### Categorie Articoli

Modifica `types/index.ts` per aggiungere nuove categorie:

```typescript
export const CATEGORIE_ARTICOLO = [
  'Attualita',
  'Scienza e Tecnologia',
  // Aggiungi qui
] as const;
```

## Sicurezza

- **Row Level Security (RLS):** Tutte le tabelle sono protette con RLS
- **Auth-based Access:** Solo utenti autenticati possono accedere
- **Role-based Permissions:** I permessi sono verificati sia frontend che backend
- **SQL Injection Protection:** Query parametrizzate tramite Supabase client

## Supporto

Per problemi o domande:
- Consulta la pagina **FAQ** nella piattaforma
- Leggi il **Regolamento** per linee guida
- Contatta gli amministratori tramite chat

## Changelog

### v1.2.0 "Primarina"
- Sistema notifiche completo con realtime
- Chat globale con editing messaggi
- To-Do list con assegnazioni
- Pannello admin avanzato
- Supporto dark/light mode
- Design responsive

## Licenza

Progetto proprietario per il giornalino scolastico ITIS E. Mattei.

---

**ITIS E. Mattei - San Donato Milanese**  
MatteiWeekly Team
