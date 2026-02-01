export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nome: string
          cognome: string
          ruolo: 'scrittore' | 'verificatore' | 'amministratore'
          avatar_url: string | null
          created_at: string
          ultimo_accesso: string | null
        }
        Insert: {
          id: string
          email: string
          nome: string
          cognome: string
          ruolo?: 'scrittore' | 'verificatore' | 'amministratore'
          avatar_url?: string | null
          created_at?: string
          ultimo_accesso?: string | null
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          cognome?: string
          ruolo?: 'scrittore' | 'verificatore' | 'amministratore'
          avatar_url?: string | null
          created_at?: string
          ultimo_accesso?: string | null
        }
      }
      articles: {
        Row: {
          id: string
          titolo: string
          contenuto: string
          excerpt: string | null
          autore_id: string
          status: 'bozza' | 'in_revisione' | 'approvato' | 'rifiutato' | 'pubblicato'
          categoria: string | null
          tags: string[] | null
          immagine_copertina: string | null
          created_at: string
          updated_at: string
          published_at: string | null
          views: number
        }
        Insert: {
          id?: string
          titolo: string
          contenuto: string
          excerpt?: string | null
          autore_id: string
          status?: 'bozza' | 'in_revisione' | 'approvato' | 'rifiutato' | 'pubblicato'
          categoria?: string | null
          tags?: string[] | null
          immagine_copertina?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          views?: number
        }
        Update: {
          id?: string
          titolo?: string
          contenuto?: string
          excerpt?: string | null
          autore_id?: string
          status?: 'bozza' | 'in_revisione' | 'approvato' | 'rifiutato' | 'pubblicato'
          categoria?: string | null
          tags?: string[] | null
          immagine_copertina?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string | null
          views?: number
        }
      }
      comments: {
        Row: {
          id: string
          articolo_id: string
          autore_id: string
          contenuto: string
          created_at: string
        }
        Insert: {
          id?: string
          articolo_id: string
          autore_id: string
          contenuto: string
          created_at?: string
        }
        Update: {
          id?: string
          articolo_id?: string
          autore_id?: string
          contenuto?: string
          created_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          titolo: string
          descrizione: string | null
          completato: boolean
          priorita: 'bassa' | 'media' | 'alta'
          creato_da: string
          assegnato_a: string | null
          articolo_riferimento: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titolo: string
          descrizione?: string | null
          completato?: boolean
          priorita?: 'bassa' | 'media' | 'alta'
          creato_da: string
          assegnato_a?: string | null
          articolo_riferimento?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titolo?: string
          descrizione?: string | null
          completato?: boolean
          priorita?: 'bassa' | 'media' | 'alta'
          creato_da?: string
          assegnato_a?: string | null
          articolo_riferimento?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          contenuto: string
          autore_id: string
          created_at: string
          edited_at: string | null
        }
        Insert: {
          id?: string
          contenuto: string
          autore_id: string
          created_at?: string
          edited_at?: string | null
        }
        Update: {
          id?: string
          contenuto?: string
          autore_id?: string
          created_at?: string
          edited_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          utente_id: string
          tipo: 'chat_message' | 'articolo_approvato' | 'articolo_rifiutato' | 'nuovo_commento' | 'nuovo_articolo' | 'todo_assegnato' | 'sistema'
          titolo: string
          messaggio: string
          letta: boolean
          data_riferimento: string | null
          created_at: string
        }
        Insert: {
          id?: string
          utente_id: string
          tipo: 'chat_message' | 'articolo_approvato' | 'articolo_rifiutato' | 'nuovo_commento' | 'nuovo_articolo' | 'todo_assegnato' | 'sistema'
          titolo: string
          messaggio: string
          letta?: boolean
          data_riferimento?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          utente_id?: string
          tipo?: 'chat_message' | 'articolo_approvato' | 'articolo_rifiutato' | 'nuovo_commento' | 'nuovo_articolo' | 'todo_assegnato' | 'sistema'
          titolo?: string
          messaggio?: string
          letta?: boolean
          data_riferimento?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
