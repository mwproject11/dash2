"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Users, 
  FileText, 
  CheckSquare, 
  MessageSquare,
  Shield,
  Loader2,
  MoreVertical,
  UserPlus,
  UserMinus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Navbar } from '@/components/navbar'
import { useToast } from '@/hooks/use-toast'
import { User, Article, TodoItem, ChatMessage, UserRole } from '@/types'
import { getRoleBadgeColor, getRoleLabel, formatDate } from '@/lib/utils'
import { hasPermission } from '@/lib/auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<UserRole>('scrittore')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
        setCurrentUser(profile as User)
      }

      // Check admin permission
      if (!hasPermission(profile?.ruolo, 'ACCESSO_ADMIN')) {
        toast({
          title: 'Accesso negato',
          description: 'Non hai i permessi per accedere a questa pagina.',
          variant: 'destructive',
        })
        router.push('/dashboard')
        return
      }

      // Fetch all users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setUsers(usersData as User[] || [])

      // Fetch all articles
      const { data: articlesData } = await supabase
        .from('articles')
        .select(`
          *,
          autore:profiles(*)
        `)
        .order('created_at', { ascending: false })
      setArticles(articlesData as Article[] || [])

      // Fetch all todos
      const { data: todosData } = await supabase
        .from('todos')
        .select(`
          *,
          creato_da_utente:profiles!todos_creato_da_fkey(*),
          assegnato_a_utente:profiles!todos_assegnato_a_fkey(*)
        `)
        .order('created_at', { ascending: false })
      setTodos(todosData as TodoItem[] || [])

      // Fetch recent messages
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select(`
          *,
          autore:profiles(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
      setMessages(messagesData as ChatMessage[] || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleChangeRole = async () => {
    if (!selectedUser) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ruolo: newRole })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Send notification to user
      await supabase.from('notifications').insert({
        utente_id: selectedUser.id,
        tipo: 'sistema',
        titolo: 'Ruolo aggiornato',
        messaggio: `Il tuo ruolo è stato aggiornato a: ${getRoleLabel(newRole)}`,
      })

      toast({
        title: 'Ruolo aggiornato',
        description: `Il ruolo di ${selectedUser.nome} ${selectedUser.cognome} è stato aggiornato.`,
      })

      setSelectedUser(null)
      fetchData()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare il ruolo.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return

    try {
      // Delete profile (cascade will handle related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      toast({
        title: 'Utente eliminato',
        description: 'L\'utente è stato eliminato con successo.',
      })
      fetchData()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare l\'utente.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo articolo?')) return

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)

      if (error) throw error

      toast({
        title: 'Articolo eliminato',
        description: 'L\'articolo è stato eliminato con successo.',
      })
      fetchData()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare l\'articolo.',
        variant: 'destructive',
      })
    }
  }

  const getStats = () => {
    return {
      totalUsers: users.length,
      totalArticles: articles.length,
      pendingTodos: todos.filter(t => !t.completato).length,
      totalMessages: messages.length,
      scrittori: users.filter(u => u.ruolo === 'scrittore').length,
      verificatori: users.filter(u => u.ruolo === 'verificatore').length,
      amministratori: users.filter(u => u.ruolo === 'amministratore').length,
    }
  }

  const stats = getStats()

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
    <div className="min-h-screen bg-background">
      <Navbar user={currentUser} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center">
            <Shield className="mr-3 h-8 w-8 text-primary" />
            Pannello Amministratore
          </h1>
          <p className="text-muted-foreground">
            Gestisci utenti, articoli e monitora l'attività della piattaforma
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Utenti Totali</CardDescription>
              <CardTitle className="text-2xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {stats.scrittori} scrittori • {stats.verificatori} verificatori • {stats.amministratori} admin
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Articoli</CardDescription>
              <CardTitle className="text-2xl">{stats.totalArticles}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {articles.filter(a => a.status === 'approvato').length} approvati
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Compiti in Sospeso</CardDescription>
              <CardTitle className="text-2xl">{stats.pendingTodos}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {todos.filter(t => t.completato).length} completati
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Messaggi Chat</CardDescription>
              <CardTitle className="text-2xl">{stats.totalMessages}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Ultime 24 ore
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="utenti" className="space-y-4">
          <TabsList>
            <TabsTrigger value="utenti">Utenti</TabsTrigger>
            <TabsTrigger value="articoli">Articoli</TabsTrigger>
            <TabsTrigger value="todo">To-Do</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="utenti">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Gestione Utenti
                </CardTitle>
                <CardDescription>
                  Visualizza e gestisci gli utenti della piattaforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>
                            {getInitials(user.nome, user.cognome)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.nome} {user.cognome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getRoleBadgeColor(user.ruolo)}>
                              {getRoleLabel(user.ruolo)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Registrato il {formatDate(user.created_at, 'dd/MM/yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setNewRole(user.ruolo)
                          }}
                        >
                          Cambia Ruolo
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.id}
                        >
                          Elimina
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articoli">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Gestione Articoli
                </CardTitle>
                <CardDescription>
                  Visualizza e gestisci tutti gli articoli
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{article.titolo}</p>
                        <p className="text-sm text-muted-foreground">
                          Di {article.autore?.nome} {article.autore?.cognome} • {formatDate(article.created_at)}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {article.status}
                        </Badge>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteArticle(article.id)}
                      >
                        Elimina
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Todo Tab */}
          <TabsContent value="todo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckSquare className="mr-2 h-5 w-5" />
                  Gestione To-Do
                </CardTitle>
                <CardDescription>
                  Visualizza tutti i compiti
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        todo.completato ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-medium ${todo.completato ? 'line-through' : ''}`}>
                          {todo.titolo}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Creato da {todo.creato_da_utente?.nome} {todo.creato_da_utente?.cognome}
                          {todo.assegnato_a_utente && (
                            <> • Assegnato a {todo.assegnato_a_utente.nome} {todo.assegnato_a_utente.cognome}</>
                          )}
                        </p>
                      </div>
                      <Badge variant={todo.completato ? 'default' : 'secondary'}>
                        {todo.completato ? 'Completato' : 'In sospeso'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Messaggi Chat
                </CardTitle>
                <CardDescription>
                  Visualizza i messaggi recenti della chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.autore?.avatar_url || ''} />
                        <AvatarFallback>
                          {message.autore ? getInitials(message.autore.nome, message.autore.cognome) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {message.autore?.nome} {message.autore?.cognome}
                        </p>
                        <p className="text-sm">{message.contenuto}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Change Role Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambia Ruolo</DialogTitle>
              <DialogDescription>
                Cambia il ruolo di {selectedUser?.nome} {selectedUser?.cognome}
              </DialogDescription>
            </DialogHeader>
            <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scrittore">Scrittore</SelectItem>
                <SelectItem value="verificatore">Verificatore</SelectItem>
                <SelectItem value="amministratore">Amministratore</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Annulla
              </Button>
              <Button onClick={handleChangeRole}>
                Salva Modifiche
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
