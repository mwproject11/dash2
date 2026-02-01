"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Navbar } from '@/components/navbar'
import { useToast } from '@/hooks/use-toast'
import { CATEGORIE_ARTICOLO, User } from '@/types'
import { generateExcerpt } from '@/lib/utils'

export default function NewArticlePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser(profile as User)
      }
    }

    checkAuth()
  }, [supabase, router])

  const handleSubmit = async (submitForReview: boolean = false) => {
    if (!formData.titolo.trim() || !formData.contenuto.trim()) {
      toast({
        title: 'Errore',
        description: 'Titolo e contenuto sono obbligatori.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const excerpt = generateExcerpt(formData.contenuto, 250)
      
      const { data, error } = await supabase
        .from('articles')
        .insert({
          titolo: formData.titolo,
          contenuto: formData.contenuto,
          excerpt,
          autore_id: user?.id,
          status: submitForReview ? 'in_revisione' : 'bozza',
          categoria: formData.categoria || null,
        })
        .select()
        .single()

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
                titolo: 'Nuovo articolo da revisionare',
                messaggio: `${user?.nome} ${user?.cognome} ha inviato un articolo per la revisione`,
                data_riferimento: data.id,
              })
            }
          }
        }
      }

      toast({
        title: submitForReview ? 'Articolo inviato!' : 'Bozza salvata!',
        description: submitForReview 
          ? 'Il tuo articolo è stato inviato per la revisione.' 
          : 'La bozza è stata salvata con successo.',
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
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna alla Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nuovo Articolo</CardTitle>
            <CardDescription>
              Scrivi un nuovo articolo per il giornalino scolastico
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
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                disabled={isLoading}
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
                disabled={isLoading}
                className="min-h-[300px] resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salva Bozza
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Invia per Revisione
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
