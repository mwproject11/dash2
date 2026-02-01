import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { it } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = "dd MMMM yyyy 'alle' HH:mm"): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: it });
}

export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Adesso';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minut${minutes === 1 ? 'o' : 'i'} fa`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} or${hours === 1 ? 'a' : 'e'} fa`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} giorn${days === 1 ? 'o' : 'i'} fa`;
  } else {
    return formatDate(date, "dd/MM/yyyy");
  }
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'amministratore':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'verificatore':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'scrittore':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'amministratore':
      return 'Amministratore';
    case 'verificatore':
      return 'Verificatore';
    case 'scrittore':
      return 'Scrittore';
    default:
      return role;
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'pubblicato':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'approvato':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'in_revisione':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'bozza':
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    case 'rifiutato':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'pubblicato':
      return 'Pubblicato';
    case 'approvato':
      return 'Approvato';
    case 'in_revisione':
      return 'In Revisione';
    case 'bozza':
      return 'Bozza';
    case 'rifiutato':
      return 'Rifiutato';
    default:
      return status;
  }
}

export function getPriorityBadgeColor(priority: string): string {
  switch (priority) {
    case 'alta':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'media':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'bassa':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateExcerpt(content: string, maxLength: number = 150): string {
  // Rimuovi HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  return truncateText(plainText, maxLength);
}
