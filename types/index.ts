export type UserRole = 'scrittore' | 'verificatore' | 'amministratore';

export interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: UserRole;
  avatar_url?: string;
  created_at: string;
  ultimo_accesso?: string;
}

export type ArticleStatus = 'bozza' | 'in_revisione' | 'approvato' | 'rifiutato' | 'pubblicato';

export interface Article {
  id: string;
  titolo: string;
  contenuto: string;
  excerpt?: string;
  autore_id: string;
  autore?: User;
  status: ArticleStatus;
  categoria?: string;
  tags?: string[];
  immagine_copertina?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  views?: number;
}

export interface Comment {
  id: string;
  articolo_id: string;
  autore_id: string;
  autore?: User;
  contenuto: string;
  created_at: string;
}

export interface TodoItem {
  id: string;
  titolo: string;
  descrizione?: string;
  completato: boolean;
  priorita: 'bassa' | 'media' | 'alta';
  creato_da: string;
  creato_da_utente?: User;
  assegnato_a?: string;
  assegnato_a_utente?: User;
  articolo_riferimento?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  contenuto: string;
  autore_id: string;
  autore?: User;
  created_at: string;
  edited_at?: string;
}

export type NotificationType = 
  | 'chat_message' 
  | 'articolo_approvato' 
  | 'articolo_rifiutato' 
  | 'nuovo_commento' 
  | 'nuovo_articolo' 
  | 'todo_assegnato'
  | 'sistema';

export interface Notification {
  id: string;
  utente_id: string;
  tipo: NotificationType;
  titolo: string;
  messaggio: string;
  letta: boolean;
  data_riferimento?: string;
  created_at: string;
}

export interface DashboardStats {
  totali_articoli: number;
  articoli_in_revisione: number;
  articoli_approvati: number;
  articoli_rifiutati: number;
  miei_articoli: number;
  articoli_da_verificare: number;
}

export const CATEGORIE_ARTICOLO = [
  'Attualità',
  'Scienza e Tecnologia',
  'Sport',
  'Cultura',
  'Eventi Scolastici',
  'Interviste',
  'Opinioni',
  'Recensioni',
] as const;
