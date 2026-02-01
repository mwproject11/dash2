-- MatteiWeekly Manager - Database Schema
-- Versione 1.2.0 Primarina

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    ruolo TEXT DEFAULT 'scrittore' CHECK (ruolo IN ('scrittore', 'verificatore', 'amministratore')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_accesso TIMESTAMP WITH TIME ZONE
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titolo TEXT NOT NULL,
    contenuto TEXT NOT NULL,
    excerpt TEXT,
    autore_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'bozza' CHECK (status IN ('bozza', 'in_revisione', 'approvato', 'rifiutato', 'pubblicato')),
    categoria TEXT,
    tags TEXT[],
    immagine_copertina TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    views INTEGER DEFAULT 0
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    articolo_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
    autore_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    contenuto TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Todos table
CREATE TABLE IF NOT EXISTS todos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titolo TEXT NOT NULL,
    descrizione TEXT,
    completato BOOLEAN DEFAULT FALSE,
    priorita TEXT DEFAULT 'media' CHECK (priorita IN ('bassa', 'media', 'alta')),
    creato_da UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    assegnato_a UUID REFERENCES profiles(id) ON DELETE SET NULL,
    articolo_riferimento UUID REFERENCES articles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contenuto TEXT NOT NULL,
    autore_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    utente_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('chat_message', 'articolo_approvato', 'articolo_rifiutato', 'nuovo_commento', 'nuovo_articolo', 'todo_assegnato', 'sistema')),
    titolo TEXT NOT NULL,
    messaggio TEXT NOT NULL,
    letta BOOLEAN DEFAULT FALSE,
    data_riferimento UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_articles_autore ON articles(autore_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_comments_articolo ON comments(articolo_id);
CREATE INDEX IF NOT EXISTS idx_todos_creato_da ON todos(creato_da);
CREATE INDEX IF NOT EXISTS idx_todos_assegnato_a ON todos(assegnato_a);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_utente ON notifications(utente_id);
CREATE INDEX IF NOT EXISTS idx_notifications_letta ON notifications(letta);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
