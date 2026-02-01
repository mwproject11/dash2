import { UserRole } from '@/types';

export const PERMISSIONS = {
  // Articoli
  CREA_ARTICOLO: ['scrittore', 'verificatore', 'amministratore'],
  MODIFICA_ARTICOLO: ['scrittore', 'verificatore', 'amministratore'],
  ELIMINA_ARTICOLO: ['amministratore'],
  APPROVA_ARTICOLO: ['verificatore', 'amministratore'],
  VEDI_TUTTI_ARTICOLI: ['verificatore', 'amministratore'],
  
  // Commenti
  AGGIUNGI_COMMENTO: ['verificatore', 'amministratore'],
  ELIMINA_COMMENTO: ['amministratore'],
  
  // To-Do
  GESTISCI_TODO: ['verificatore', 'amministratore'],
  
  // Admin
  GESTISCI_UTENTI: ['amministratore'],
  VEDI_STATISTICHE: ['amministratore'],
  ACCESSO_ADMIN: ['amministratore'],
};

export function hasPermission(
  userRole: UserRole | string | undefined,
  permission: keyof typeof PERMISSIONS
): boolean {
  if (!userRole) return false;
  return PERMISSIONS[permission].includes(userRole);
}

export function canEditArticle(
  userRole: UserRole | string | undefined,
  userId: string,
  articleAuthorId: string
): boolean {
  if (!userRole) return false;
  if (userRole === 'amministratore') return true;
  if (userRole === 'verificatore') return true;
  return userId === articleAuthorId;
}

export function canDeleteArticle(
  userRole: UserRole | string | undefined,
  userId: string,
  articleAuthorId: string
): boolean {
  if (!userRole) return false;
  if (userRole === 'amministratore') return true;
  // Gli scrittori possono eliminare solo i propri bozze
  if (userRole === 'scrittore') {
    return userId === articleAuthorId;
  }
  return false;
}
