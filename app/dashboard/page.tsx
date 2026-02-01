"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  MessageSquare,
  Filter,
  Search,
  Loader2,
  Pencil,
  Trash2,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Navbar } from '@/components/navbar'
import { useToast } from '@/hooks/use-toast'
import { Article, Comment, User, CATEGORIE_ARTICOLO } from '@/types'
import { getStatusBadgeColor, getStatusLabel, formatDate, getRoleBadgeColor, truncateText } from '@/lib/utils'
import { hasPermission, canEditArticle, canDeleteArticle } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch user and articles
  const fetchData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser(profile as User)
      }

      // Get articles based on role
      let query = supabase
        .from('articles')
        .select(`
          *,
          autore:profiles(*)
        `)
        .order('created_at', { ascending: false })

      // Scrittori vedono solo i propri articoli (a meno che non siano anche verificatori)
      if (profile?.ruolo === 'scrittore') {
        query = query.eq('autore_id', session.user.id)
      }

      const { data: articlesData, error } = await query

      if (error) throw error
      setArticles(articlesData as Article[] || [])
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

  // Fetch comments for selected article
  const fetchComments = async (articleId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          autore:profiles(*)
        `)
        .eq('articolo_id', articleId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data as Comment[] || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmitForReview = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ status: 'in_revisione', updated_at: new Date().toISOString() })
        .eq('id', articleId)

      if (error) throw error

      toast({
        title: 'Articolo inviato',
        description: 'L\'articolo è stato inviato per la revisione.',
      })

      // Notifica i verificatori
      const verificatori = await supabase
        .from('profiles')
        .select('id')
        .in('ruolo', ['verificatore', 'amministratore'])

      if (verificatori.data) {
        for (const v of verificatori.data) {
          if (v.id !== user?.id) {
            await supabase.from('notifications').insert({
              utente_id: v.id,
              tipo: 'nuovo_articolo',
              titolo: 'Nuovo articolo da revisionare',
              messaggio: `${user?.nome} ${user?.cognome} ha inviato un articolo per la revisione`,
              data_riferimento: articleId,
            })
          }
        }
      }

      fetchData()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile inviare l\'articolo.',
        variant: 'destructive',
      })
    }
  }

  const handleApprove = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ 
          status: 'approvato', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', articleId)

      if (error) throw error

      // Get article author
      const article = articles.find(a => a.id === articleId)
      
      // Notify author
      if (article && article.autore_id !== user?.id) {
        await supabase.from('notifications').insert({
          utente_id: article.autore_id,
          tipo: 'articolo_approvato',
          titolo: 'Articolo approvato!',
          messaggio: `Il tuo articolo "${article.titolo}" è stato approvato`,
          data_riferimento: articleId,
        })
      }

      toast({
        title: 'Articolo approvato',
        description: 'L\'articolo è stato approvato con successo.',
      })
      fetchData()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile approvare l\'articolo.',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ 
          status: 'rifiutato', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', articleId)

      if (error) throw error

      // Get article author
      const article = articles.find(a => a.id === articleId)
      
      // Notify author
      if (article && article.autore_id !== user?.id) {
        await supabase.from('notifications').insert({
          utente_id: article.autore_id,
          tipo: 'articolo_rifiutato',
          titolo: 'Articolo rifiutato',
          messaggio: `Il tuo articolo "${article.titolo}" è stato rifiutato`,
          data_riferimento: articleId,
        })
      }

      toast({
        title: 'Articolo rifiutato',
        description: 'L\'articolo è stato rifiutato.',
      })
      fetchData()
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile rifiutare l\'articolo.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (articleId: string) => {
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

  const handleAddComment = async () => {
    if (!selectedArticle || !newComment.trim()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          articolo_id: selectedArticle.id,
          autore_id: user?.id,
          contenuto: newComment,
        })

      if (error) throw error

      // Notify article author
      if (selectedArticle.autore_id !== user?.id) {
        await supabase.from('notifications').insert({
          utente_id: selectedArticle.autore_id,
          tipo: 'nuovo_commento',
          titolo: 'Nuovo commento sul tuo articolo',
          messaggio: `${user?.nome} ${user?.cognome} ha commentato il tuo articolo`,
          data_riferimento: selectedArticle.id,
        })
      }

      setNewComment('')
      fetchComments(selectedArticle.id)
      toast({
        title: 'Commento aggiunto',
        description: 'Il tuo commento è stato aggiunto con successo.',
      })
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile aggiungere il commento.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredArticles = articles.filter(article =>
    article.titolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.contenuto.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getArticleStats = () => {
    return {
      totali: articles.length,
      bozze: articles.filter(a => a.status === 'bozza').length,
      inRevisione: articles.filter(a => a.status === 'in_revisione').length,
      approvati: articles.filter(a => a.status === 'approvato' || a.status === 'pubblicato').length,
      rifiutati: articles.filter(a => a.status === 'rifiutato').length,
    }
  }

  const stats = getArticleStats()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Gestisci i tuoi articoli e collabora con il team
            </p>
          </div>
          {hasPermission(user?.ruolo, 'CREA_ARTICOLO') && (
            <Button onClick={() => router.push('/dashboard/articoli/nuovo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Articolo
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Totali</CardDescription>
              <CardTitle className="text-2xl">{stats.totali}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bozze</CardDescription>
              <CardTitle className="text-2xl text-muted-foreground">{stats.bozze}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Revisione</CardDescription>
              <CardTitle className="text-2xl text-yellow-500">{stats.inRevisione}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approvati</CardDescription>
              <CardTitle className="text-2xl text-green-500">{stats.approvati}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rifiutati</CardDescription>
              <CardTitle className="text-2xl text-red-500">{stats.rifiutati}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cerca articoli..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Articles List */}
        <Tabs defaultValue="tutti" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tutti">Tutti</TabsTrigger>
            <TabsTrigger value="bozze">Bozze</TabsTrigger>
            <TabsTrigger value="revisione">In Revisione</TabsTrigger>
            <TabsTrigger value="approvati">Approvati</TabsTrigger>
          </TabsList>

          {['tutti', 'bozze', 'revisione', 'approvati'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {filteredArticles
                .filter((article) => {
                  if (tab === 'tutti') return true
                  if (tab === 'bozze') return article.status === 'bozza'
                  if (tab === 'revisione') return article.status === 'in_revisione'
                  if (tab === 'approvati') return article.status === 'approvato' || article.status === 'pubblicato'
                  return true
                })
                .map((article) => (
                  <Card key={article.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={getStatusBadgeColor(article.status)}>
                              {getStatusLabel(article.status)}
                            </Badge>
                            {article.categoria && (
                              <Badge variant="secondary">{article.categoria}</Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl">{article.titolo}</CardTitle>
                          <CardDescription>
                            Di {article.autore?.nome} {article.autore?.cognome} • {formatDate(article.created_at)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {canEditArticle(user?.ruolo, user?.id || '', article.autore_id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/dashboard/articoli/${article.id}/modifica`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteArticle(user?.ruolo, user?.id || '', article.autore_id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(article.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {truncateText(article.excerpt || article.contenuto, 200)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-4">
                        {/* Actions based on role */}
                        {article.status === 'bozza' && article.autore_id === user?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSubmitForReview(article.id)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Invia per revisione
                          </Button>
                        )}
                        
                        {hasPermission(user?.ruolo, 'APPROVA_ARTICOLO') && article.status === 'in_revisione' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleApprove(article.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approva
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleReject(article.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Rifiuta
                            </Button>
                          </>
                        )}

                        {/* Comments dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedArticle(article)
                                fetchComments(article.id)
                              }}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Commenti
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Commenti - {article.titolo}</DialogTitle>
                              <DialogDescription>
                                Visualizza e aggiungi commenti per questo articolo
                              </DialogDescription>
                            </DialogHeader>
                            
                            <ScrollArea className="h-64 my-4">
                              {comments.length === 0 ? (
                                <p className="text-center text-muted-foreground">
                                  Nessun commento ancora
                                </p>
                              ) : (
                                <div className="space-y-4">
                                  {comments.map((comment) => (
                                    <div key={comment.id} className="p-3 bg-muted rounded-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">
                                          {comment.autore?.nome} {comment.autore?.cognome}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDate(comment.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-sm">{comment.contenuto}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ScrollArea>

                            {hasPermission(user?.ruolo, 'AGGIUNGI_COMMENTO') && (
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Aggiungi un commento..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                />
                                <Button 
                                  onClick={handleAddComment}
                                  disabled={!newComment.trim() || isSubmitting}
                                  className="w-full"
                                >
                                  {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                  )}
                                  Aggiungi Commento
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {filteredArticles.filter((article) => {
                if (tab === 'tutti') return true
                if (tab === 'bozze') return article.status === 'bozza'
                if (tab === 'revisione') return article.status === 'in_revisione'
                if (tab === 'approvati') return article.status === 'approvato' || article.status === 'pubblicato'
                return true
              }).length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Nessun articolo trovato</p>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  )
}
