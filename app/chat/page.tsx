"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  Users,
  MoreVertical,
  Pencil,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Navbar } from '@/components/navbar'
import { useToast } from '@/hooks/use-toast'
import { ChatMessage, User } from '@/types'
import { formatDateRelative, formatDate } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function ChatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [editContent, setEditContent] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch user and messages
  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Get user
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser(profile as User)
      }

      // Get messages with authors
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          autore:profiles(*)
        `)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      setMessages(messagesData as ChatMessage[] || [])

      // Get online users (users who logged in recently)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .gte('ultimo_accesso', fiveMinutesAgo)
        .neq('id', session.user.id)

      setOnlineUsers(usersData as User[] || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage
          
          // Get author info
          const { data: authorData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.autore_id)
            .single()

          const messageWithAuthor = {
            ...newMsg,
            autore: authorData,
          }

          setMessages((prev) => [...prev, messageWithAuthor])

          // Send notification if not from current user
          if (newMsg.autore_id !== user.id) {
            await supabase.from('notifications').insert({
              utente_id: user.id,
              tipo: 'chat_message',
              titolo: 'Nuovo messaggio in chat',
              messaggio: `${authorData?.nome} ${authorData?.cognome}: ${newMsg.contenuto.substring(0, 50)}...`,
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const deletedMsg = payload.old as ChatMessage
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedMsg.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return

    setIsSending(true)
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          contenuto: newMessage,
          autore_id: user.id,
        })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile inviare il messaggio.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          contenuto: editContent,
          edited_at: new Date().toISOString(),
        })
        .eq('id', editingMessage.id)
        .eq('autore_id', user?.id)

      if (error) throw error

      setEditingMessage(null)
      setEditContent('')
      toast({
        title: 'Messaggio modificato',
        description: 'Il messaggio è stato modificato con successo.',
      })
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile modificare il messaggio.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('autore_id', user?.id)

      if (error) throw error

      toast({
        title: 'Messaggio eliminato',
        description: 'Il messaggio è stato eliminato con successo.',
      })
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il messaggio.',
        variant: 'destructive',
      })
    }
  }

  const getInitials = (nome: string, cognome: string) => {
    return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar user={user} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Online Users Sidebar */}
          <Card className="lg:col-span-1 hidden lg:flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Utenti Online
              </CardTitle>
              <CardDescription>
                {onlineUsers.length + 1} utenti attivi
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {/* Current user */}
              <div className="flex items-center gap-3 mb-4 p-2 bg-accent rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url || ''} />
                  <AvatarFallback>
                    {user ? getInitials(user.nome, user.cognome) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Tu</p>
                  <p className="text-xs text-green-500">Online</p>
                </div>
              </div>

              {onlineUsers.map((onlineUser) => (
                <div key={onlineUser.id} className="flex items-center gap-3 mb-3 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={onlineUser.avatar_url || ''} />
                    <AvatarFallback>
                      {getInitials(onlineUser.nome, onlineUser.cognome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {onlineUser.nome} {onlineUser.cognome}
                    </p>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Chat del Team
              </CardTitle>
              <CardDescription>
                Comunica con gli altri membri del giornalino
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                    <p>Nessun messaggio ancora</p>
                    <p className="text-sm">Sii il primo a scrivere!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.autore_id === user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${
                              isOwn ? 'flex-row-reverse' : ''
                            }`}
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.autore?.avatar_url || ''} />
                              <AvatarFallback>
                                {message.autore
                                  ? getInitials(message.autore.nome, message.autore.cognome)
                                  : '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium opacity-70">
                                  {message.autore?.nome} {message.autore?.cognome}
                                </span>
                                <span className="text-xs opacity-50">
                                  {formatDateRelative(message.created_at)}
                                  {message.edited_at && ' (modificato)'}
                                </span>
                              </div>
                              <p className="text-sm">{message.contenuto}</p>
                            </div>
                            {isOwn && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingMessage(message)
                                      setEditContent(message.contenuto)
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Modifica
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteMessage(message.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Elimina
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Scrivi un messaggio..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Message Dialog */}
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Messaggio</DialogTitle>
            <DialogDescription>
              Modifica il contenuto del tuo messaggio
            </DialogDescription>
          </DialogHeader>
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEditMessage()
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMessage(null)}>
              Annulla
            </Button>
            <Button onClick={handleEditMessage} disabled={!editContent.trim()}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
