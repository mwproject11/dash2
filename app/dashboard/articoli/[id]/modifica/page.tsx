"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, Save, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Navbar } from '@/components/navbar'
import { useToast } from '@/hooks/use-toast'
import { CATEGORIE_ARTICOLO, User, Article } from '@/types'
import { generateExcerpt } from '@/lib/utils'
import { canEditArticle, canDeleteArticle } from '@/lib/auth'

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    titolo: '',
    contenuto: '',
    categoria: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchData = async () => {
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

        // Get article
        const { data: articleData, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', articleId)
          .single()

        if (error || !articleData) {
          toast({
            title: 'Errore',
            description: 'Articolo non trovato.',
            variant: 'destructive',
          })
          router.push('/dashboard')
          return
        }

        // Check permissions
        if (!canEditArticle(profile?.ruolo, profile?.id, articleData.autore_id)) {
          toast({
            title: 'Accesso negato',
            description: 'Non hai i permessi per modificare questo articolo.',
            variant: 'destructive',
          })
          router.push('/dashboard')
          return
        }

        setArticle(articleData as Article)
        setFormData({
          titolo: articleData.titolo,
          contenuto: articleData.contenuto,
          categoria: articleData.categoria || '',
        })
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [articleId, supabase, router, toast])

  const handleSubmit = async (submitForReview: boolean = false) => {
    if (!formData.titolo.trim() || !formData.contenuto.trim()) {
      toast({
        title: 'Errore',
        description: 'Titolo e contenuto sono obbligatori.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const excerpt = generateExcerpt(formData.contenuto, 250)
      
      const { error } = await supabase
        .from('articles')
        .update({
          titolo: formData.titolo,
          contenuto: formData.contenuto,
          excerpt,
          status: submitForReview ? 'in_revisione' : article?.status,
          categoria: formData.categoria || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId)

      if (error) throw error

      // Notify verificatori if submitted for review
      if (submitForReview) {
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
                titolo: 'Articolo aggiornato e inviato',
                messaggio: `${user?.nome} ${user?.cognome} ha aggiornato e inviato un articolo per la revisione`,
                data_riferimento: articleId,
              })
            }
          }
        }
      }

      toast({
        title: submitForReview ? 'Articolo inviato!' : 'Modifiche salvate!',
        description: submitForReview 
          ? 'Il tuo articolo è stato inviato per la revisione.' 
          : 'Le modifiche sono state salvate con successo.',
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving article:', error)
      toast({
        title: 'Errore',
        description: 'Impossibile salvare l\'articolo.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo articolo? Questa azione non può essere annullata.')) {
      return
    }

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
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare l\'articolo.',
        variant: 'destructive',
      })
    }
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
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla Dashboard
          </Button>
          {canDeleteArticle(user?.ruolo, user?.id || '', article?.autore_id || '') && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Elimina
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Modifica Articolo</CardTitle>
            <CardDescription>
              Modifica il tuo articolo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titolo">Titolo *</Label>
              <Input
                id="titolo"
                placeholder="Inserisci il titolo dell'articolo"
                value={formData.titolo}
                onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona una categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIE_ARTICOLO.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contenuto">Contenuto *</Label>
              <Textarea
                id="contenuto"
                placeholder="Scrivi qui il contenuto del tuo articolo..."
                value={formData.contenuto}
                onChange={(e) => setFormData({ ...formData, contenuto: e.target.value })}
                rows={15}
                disabled={isSaving}
                className="min-h-[300px] resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salva Modifiche
              </Button>
              {article?.status === 'bozza' && (
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Invia per Revisione
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
