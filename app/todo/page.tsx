"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Plus, 
  Check, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Calendar,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Navbar } from '@/components/navbar'
import { useToast } from '@/hooks/use-toast'
import { TodoItem, User as UserType } from '@/types'
import { getPriorityBadgeColor, formatDate } from '@/lib/utils'
import { hasPermission } from '@/lib/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function TodoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTodo, setNewTodo] = useState({
    titolo: '',
    descrizione: '',
    priorita: 'media' as const,
    assegnato_a: '',
  })

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
        setCurrentUser(profile as UserType)
      }

      // Check permission
      if (!hasPermission(profile?.ruolo, 'GESTISCI_TODO')) {
        toast({
          title: 'Accesso negato',
          description: 'Non hai i permessi per accedere a questa pagina.',
          variant: 'destructive',
        })
        router.push('/dashboard')
        return
      }

      // Get todos
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select(`
          *,
          creato_da_utente:profiles!todos_creato_da_fkey(*),
          assegnato_a_utente:profiles!todos_assegnato_a_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (todosError) throw todosError
      setTodos(todosData as TodoItem[] || [])

      // Get users for assignment
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('nome', { ascending: true })

      setUsers(usersData as UserType[] || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel('todos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, supabase, fetchData])

  const handleAddTodo = async () => {
    if (!newTodo.titolo.trim()) {
      toast({
        title: 'Errore',
        description: 'Il titolo è obbligatorio.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert({
          titolo: newTodo.titolo,
          descrizione: newTodo.descrizione,
          priorita: newTodo.priorita,
          creato_da: currentUser?.id,
          assegnato_a: newTodo.assegnato_a || null,
        })
        .select()
        .single()

      if (error) throw error

      // Notify assigned user
      if (newTodo.assegnato_a && newTodo.assegnato_a !== currentUser?.id) {
        await supabase.from('notifications').insert({
          utente_id: newTodo.assegnato_a,
          tipo: 'todo_assegnato',
          titolo: 'Nuovo compito assegnato',
          messaggio: `${currentUser?.nome} ${currentUser?.cognome} ti ha assegnato un nuovo compito: "${newTodo.titolo}"`,
          data_riferimento: data.id,
        })
      }

      setNewTodo({
        titolo: '',
        descrizione: '',
        priorita: 'media',
        assegnato_a: '',
      })

      toast({
        title: 'Compito aggiunto',
        description: 'Il compito è stato aggiunto con successo.',
      })
      fetchData()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile aggiungere il compito.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleComplete = async (todo: TodoItem) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({
          completato: !todo.completato,
          updated_at: new Date().toISOString(),
        })
        .eq('id', todo.id)

      if (error) throw error

      setTodos((prev) =>
        prev.map((t) =>
          t.id === todo.id ? { ...t, completato: !t.completato } : t
        )
      )

      toast({
        title: todo.completato ? 'Compito ripristinato' : 'Compito completato',
        description: todo.completato
          ? 'Il compito è stato segnato come da fare.'
          : 'Il compito è stato segnato come completato.',
      })
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare il compito.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId)

      if (error) throw error

      setTodos((prev) => prev.filter((t) => t.id !== todoId))

      toast({
        title: 'Compito eliminato',
        description: 'Il compito è stato eliminato con successo.',
      })
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il compito.',
        variant: 'destructive',
      })
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'Alta'
      case 'media':
        return 'Media'
      case 'bassa':
        return 'Bassa'
      default:
        return priority
    }
  }

  const pendingTodos = todos.filter((t) => !t.completato)
  const completedTodos = todos.filter((t) => t.completato)

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
          <h1 className="text-3xl font-bold">To-Do List</h1>
          <p className="text-muted-foreground">
            Gestisci i compiti e le attività del team
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add New Todo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Nuovo Compito
              </CardTitle>
              <CardDescription>
                Aggiungi un nuovo compito alla lista
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titolo">Titolo *</Label>
                <Input
                  id="titolo"
                  placeholder="Titolo del compito"
                  value={newTodo.titolo}
                  onChange={(e) => setNewTodo({ ...newTodo, titolo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descrizione">Descrizione</Label>
                <Textarea
                  id="descrizione"
                  placeholder="Descrizione del compito..."
                  value={newTodo.descrizione}
                  onChange={(e) => setNewTodo({ ...newTodo, descrizione: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorita">Priorità</Label>
                <Select
                  value={newTodo.priorita}
                  onValueChange={(value: 'bassa' | 'media' | 'alta') =>
                    setNewTodo({ ...newTodo, priorita: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bassa">Bassa</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assegnato_a">Assegna a</Label>
                <Select
                  value={newTodo.assegnato_a}
                  onValueChange={(value) =>
                    setNewTodo({ ...newTodo, assegnato_a: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona un utente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nessuno</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome} {u.cognome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddTodo}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Aggiungi Compito
              </Button>
            </CardContent>
          </Card>

          {/* Todo Lists */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
                  Da Fare ({pendingTodos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {pendingTodos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nessun compito in sospeso!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pendingTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            checked={todo.completato}
                            onCheckedChange={() => handleToggleComplete(todo)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{todo.titolo}</span>
                              <Badge variant="outline" className={getPriorityBadgeColor(todo.priorita)}>
                                {getPriorityLabel(todo.priorita)}
                              </Badge>
                            </div>
                            {todo.descrizione && (
                              <p className="text-sm text-muted-foreground">
                                {todo.descrizione}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <User className="mr-1 h-3 w-3" />
                                Creato da {todo.creato_da_utente?.nome} {todo.creato_da_utente?.cognome}
                              </span>
                              {todo.assegnato_a_utente && (
                                <span className="flex items-center">
                                  <User className="mr-1 h-3 w-3" />
                                  Assegnato a {todo.assegnato_a_utente.nome} {todo.assegnato_a_utente.cognome}
                                </span>
                              )}
                              <span className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {formatDate(todo.created_at, 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTodo(todo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Completed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-green-500" />
                  Completati ({completedTodos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {completedTodos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nessun compito completato
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {completedTodos.map((todo) => (
                        <div
                          key={todo.id}
                          className="flex items-start gap-3 p-3 border rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Checkbox
                            checked={todo.completato}
                            onCheckedChange={() => handleToggleComplete(todo)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium line-through">
                                {todo.titolo}
                              </span>
                              <Badge variant="outline" className={getPriorityBadgeColor(todo.priorita)}>
                                {getPriorityLabel(todo.priorita)}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTodo(todo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
