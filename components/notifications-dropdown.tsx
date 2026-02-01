"use client"

import { useRouter } from 'next/navigation'
import { Bell, Check, Trash2, MessageSquare, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { User, Notification, NotificationType } from '@/types'
import { useNotifications } from '@/hooks/use-notifications'
import { formatDateRelative } from '@/lib/utils'

interface NotificationsDropdownProps {
  user: User
}

const notificationIcons: Record<NotificationType, typeof Bell> = {
  chat_message: MessageSquare,
  articolo_approvato: CheckCircle,
  articolo_rifiutato: XCircle,
  nuovo_commento: MessageSquare,
  nuovo_articolo: FileText,
  todo_assegnato: AlertCircle,
  sistema: Bell,
}

const notificationColors: Record<NotificationType, string> = {
  chat_message: 'text-blue-500',
  articolo_approvato: 'text-green-500',
  articolo_rifiutato: 'text-red-500',
  nuovo_commento: 'text-yellow-500',
  nuovo_articolo: 'text-purple-500',
  todo_assegnato: 'text-orange-500',
  sistema: 'text-gray-500',
}

export function NotificationsDropdown({ user }: NotificationsDropdownProps) {
  const router = useRouter()
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification 
  } = useNotifications(user)

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.letta) {
      await markAsRead(notification.id)
    }

    // Navigate based on notification type
    switch (notification.tipo) {
      case 'chat_message':
        router.push('/chat')
        break
      case 'articolo_approvato':
      case 'articolo_rifiutato':
      case 'nuovo_commento':
        if (notification.data_riferimento) {
          router.push(`/dashboard?articolo=${notification.data_riferimento}`)
        } else {
          router.push('/dashboard')
        }
        break
      case 'nuovo_articolo':
        router.push('/dashboard')
        break
      case 'todo_assegnato':
        router.push('/todo')
        break
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifiche</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation()
                markAllAsRead()
              }}
            >
              <Check className="mr-1 h-3 w-3" />
              Segna tutte lette
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-64">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nessuna notifica</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = notificationIcons[notification.tipo]
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer ${
                    !notification.letta ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`mt-0.5 ${notificationColors[notification.tipo]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.letta ? 'font-medium' : ''}`}>
                      {notification.titolo}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {notification.messaggio}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateRelative(notification.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!notification.letta && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
