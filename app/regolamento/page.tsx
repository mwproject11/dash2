"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  BookOpen, 
  FileText, 
  Users, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  PenTool
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { User } from '@/types'

export default function RegolamentoPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      setIsLoading(false)
    }

    checkAuth()
  }, [supabase, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Regolamento</h1>
            <p className="text-xl text-muted-foreground">
              MatteiWeekly Manager - ITIS E. Mattei
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Introduzione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Benvenuto nella piattaforma di gestione del giornalino scolastico <strong>MatteiWeekly</strong> 
                dell&apos;ITIS E. Mattei di San Donato Milanese. Questo regolamento definisce le regole e le 
                linee guida per l&apos;utilizzo della piattaforma da parte di tutti i membri del team.
              </p>
              <p>
                La piattaforma è uno strumento dedicato alla creazione, revisione e gestione degli articoli 
                per il giornalino scolastico. L&apos;accesso è riservato esclusivamente agli studenti e 
                ai docenti autorizzati.
              </p>
            </CardContent>
          </Card>

          {/* Roles */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Ruoli e Responsabilità
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center">
                    <PenTool className="mr-2 h-4 w-4 text-blue-500" />
                    Scrittori
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Possono creare nuovi articoli e salvarli come bozze</li>
                    <li>Possono modificare i propri articoli in stato di bozza</li>
                    <li>Possono inviare gli articoli per la revisione</li>
                    <li>Vedono solo i propri articoli nella dashboard</li>
                    <li>Possono partecipare alla chat del team</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg bg-yellow-500/5 border-yellow-500/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-yellow-500" />
                    Verificatori delle Informazioni
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Hanno tutti i permessi degli scrittori</li>
                    <li>Possono vedere tutti gli articoli in revisione</li>
                    <li>Possono approvare o rifiutare articoli</li>
                    <li>Possono aggiungere commenti agli articoli per suggerire modifiche</li>
                    <li>Possono creare e gestire la To-Do list</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg bg-red-500/5 border-red-500/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center">
                    <Shield className="mr-2 h-4 w-4 text-red-500" />
                    Amministratori Generali
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Hanno tutti i permessi di gestione del sito</li>
                    <li>Possono gestire gli utenti e i loro ruoli</li>
                    <li>Possono eliminare qualsiasi articolo</li>
                    <li>Hanno accesso alle statistiche e al pannello admin</li>
                    <li>Possono moderare la chat</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Flusso di Lavoro degli Articoli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white text-sm font-medium">1</div>
                  <div>
                    <h4 className="font-semibold">Bozza</h4>
                    <p className="text-sm text-muted-foreground">
                      Lo scrittore crea l&apos;articolo e lo salva come bozza. Può continuare a modificarlo 
                      finché non è pronto per la revisione.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-white text-sm font-medium">2</div>
                  <div>
                    <h4 className="font-semibold">In Revisione</h4>
                    <p className="text-sm text-muted-foreground">
                      Lo scrittore invia l&apos;articolo per la revisione. I verificatori possono ora 
                      leggerlo, aggiungere commenti e decidere se approvarlo o rifiutarlo.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white text-sm font-medium">3</div>
                  <div>
                    <h4 className="font-semibold">Approvato / Rifiutato</h4>
                    <p className="text-sm text-muted-foreground">
                      Il verificatore decide lo stato finale dell&apos;articolo. Se approvato, è pronto 
                      per la pubblicazione. Se rifiutato, lo scrittore può modificarlo e reinviarlo.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Guidelines */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Regole della Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Rispetta sempre gli altri membri del team</li>
                <li>La chat è dedicata esclusivamente a discussioni sul giornalino</li>
                <li>Non condividere informazioni personali o sensibili</li>
                <li>Non utilizzare linguaggio offensivo o inappropriato</li>
                <li>Gli amministratori possono moderare e rimuovere messaggi non conformi</li>
                <li>Ogni utente è responsabile dei propri messaggi</li>
              </ul>
            </CardContent>
          </Card>

          {/* Sanctions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Sanzioni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                In caso di violazione del regolamento, gli amministratori possono applicare 
                le seguenti sanzioni:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Richiamo verbale o scritto</li>
                <li>Sospensione temporanea dall&apos;accesso alla piattaforma</li>
                <li>Rimozione dei contenuti non conformi</li>
                <li>Revoca dell&apos;accesso alla piattaforma in casi gravi</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contatti</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Per qualsiasi domanda o problema relativo alla piattaforma, contatta gli 
                amministratori attraverso la chat o rivolgiti ai docenti referenti del 
                giornalino scolastico.
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-12 text-sm text-muted-foreground">
            <p>MatteiWeekly Manager v1.2.0 &quot;Primarina&quot;</p>
            <p>ITIS E. Mattei - San Donato Milanese</p>
            <p className="mt-2">Ultimo aggiornamento: Febbraio 2025</p>
          </div>
        </div>
      </main>
    </div>
  )
}
