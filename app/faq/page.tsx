"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { 
  HelpCircle, 
  BookOpen,
  MessageCircle,
  FileText,
  Users,
  Lock,
  Bell,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/navbar'
import { User } from '@/types'

const faqs = [
  {
    category: 'Accesso e Account',
    icon: Lock,
    questions: [
      {
        q: 'Come posso accedere alla piattaforma?',
        a: 'Per accedere alla piattaforma è necessario avere un account. Se sei un membro del team del giornalino, puoi registrarti utilizzando la tua email scolastica. Dopo la registrazione, un amministratore dovrà assegnarti il ruolo appropriato.',
      },
      {
        q: 'Ho dimenticato la password, cosa posso fare?',
        a: 'Nella pagina di login, clicca su "Password dimenticata?" per ricevere un link di reset via email. Se non ricevi l&apos;email, contatta un amministratore.',
      },
      {
        q: 'Posso modificare il mio profilo?',
        a: 'Sì, puoi modificare alcune informazioni del tuo profilo cliccando sul tuo avatar in alto a destra. Tuttavia, il ruolo può essere modificato solo dagli amministratori.',
      },
    ],
  },
  {
    category: 'Articoli',
    icon: FileText,
    questions: [
      {
        q: 'Come creo un nuovo articolo?',
        a: 'Vai nella Dashboard e clicca sul pulsante "Nuovo Articolo". Compila il titolo, seleziona una categoria e scrivi il contenuto. Puoi salvare come bozza o inviare direttamente per la revisione.',
      },
      {
        q: 'Quali sono gli stati di un articolo?',
        a: 'Un articolo può trovarsi in questi stati: Bozza (in fase di scrittura), In Revisione (in attesa di approvazione), Approvato (pronto per la pubblicazione), Rifiutato (da modificare), Pubblicato (già pubblicato sul giornalino).',
      },
      {
        q: 'Posso modificare un articolo dopo averlo inviato?',
        a: 'Una volta inviato per la revisione, non puoi più modificarlo finché non viene rifiutato o approvato. Se hai bisogno di fare modifiche urgenti, contatta un verificatore.',
      },
      {
        q: 'Chi può vedere i miei articoli?',
        a: 'Come scrittore, vedi solo i tuoi articoli. I verificatori e gli amministratori possono vedere tutti gli articoli in revisione.',
      },
    ],
  },
  {
    category: 'Revisione',
    icon: CheckCircle,
    questions: [
      {
        q: 'Cosa fa un verificatore?',
        a: 'I verificatori leggono gli articoli inviati per la revisione, possono approvarli, rifiutarli o aggiungere commenti con suggerimenti per migliorare il contenuto.',
      },
      {
        q: 'Come funzionano i commenti?',
        a: 'I verificatori possono aggiungere commenti specifici su ogni articolo in revisione. Questi commenti sono visibili allo scrittore e aiuto a migliorare l&apos;articolo prima dell&apos;approvazione finale.',
      },
      {
        q: 'Quanto tempo ci vuole per la revisione?',
        a: 'Il tempo di revisione dipende dalla disponibilità dei verificatori. Generalmente, cerca di inviare gli articoli con sufficiente anticipo rispetto alla scadenza di pubblicazione.',
      },
    ],
  },
  {
    category: 'Chat e Comunicazione',
    icon: MessageCircle,
    questions: [
      {
        q: 'Chi può usare la chat?',
        a: 'La chat è accessibile a tutti gli utenti registrati e loggati nella piattaforma. Non è visibile agli utenti guest.',
      },
      {
        q: 'I messaggi della chat vengono salvati?',
        a: 'Sì, i messaggi vengono salvati per permettere la consultazione futura. Puoi modificare o eliminare solo i messaggi che hai inviato tu.',
      },
      {
        q: 'Come funzionano le notifiche?',
        a: 'Ricevi notifiche quando: qualcuno ti assegna un compito, il tuo articolo viene approvato/rifiutato, ricevi un commento sul tuo articolo, o arriva un nuovo messaggio in chat.',
      },
    ],
  },
  {
    category: 'To-Do List',
    icon: BookOpen,
    questions: [
      {
        q: 'Chi può usare la To-Do list?',
        a: 'La To-Do list è accessibile ai verificatori e agli amministratori. Gli scrittori non possono accedervi.',
      },
      {
        q: 'A cosa serve la To-Do list?',
        a: 'Serve per organizzare e tracciare i compiti del team, come gli articoli da creare, le scadenze da rispettare e le attività da completare.',
      },
      {
        q: 'Posso assegnare compiti ad altri utenti?',
        a: 'Sì, quando crei un nuovo compito puoi assegnarlo a un altro utente. L&apos;utente assegnato riceverà una notifica.',
      },
    ],
  },
  {
    category: 'Ruoli e Permessi',
    icon: Users,
    questions: [
      {
        q: 'Come ottengo il ruolo di verificatore?',
        a: 'I ruoli vengono assegnati dagli amministratori in base alle responsabilità e all&apos;esperienza nel team. Contatta un amministratore se pensi di dover avere un ruolo diverso.',
      },
      {
        q: 'Posso avere più ruoli?',
        a: 'No, ogni utente ha un singolo ruolo che determina i suoi permessi nella piattaforma.',
      },
    ],
  },
  {
    category: 'Notifiche',
    icon: Bell,
    questions: [
      {
        q: 'Quando ricevo le notifiche?',
        a: 'Ricevi notifiche per: nuovi messaggi in chat, approvazione/rifiuto dei tuoi articoli, nuovi commenti sui tuoi articoli, nuovi compiti assegnati, comunicazioni di sistema.',
      },
      {
        q: 'Le notifiche funzionano anche su mobile?',
        a: 'Sì, se concedi i permessi quando richiesto, riceverai le notifiche anche quando il sito è chiuso (tramite browser notification).',
      },
      {
        q: 'Come segno una notifica come letta?',
        a: 'Clicca sulla campanella in alto a destra per aprire il pannello delle notifiche. Puoi segnare come lette singole notifiche o tutte insieme.',
      },
    ],
  },
]

export default function FaqPage() {
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 mb-6">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">FAQ</h1>
            <p className="text-xl text-muted-foreground">
              Domande frequenti su MatteiWeekly Manager
            </p>
          </div>

          {/* FAQ Content */}
          <div className="space-y-8">
            {faqs.map((category, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <category.icon className="mr-2 h-5 w-5 text-primary" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {category.questions.map((faq, qIdx) => (
                    <div key={qIdx} className="border-b last:border-0 pb-4 last:pb-0">
                      <h4 className="font-semibold text-lg mb-2">{faq.q}</h4>
                      <p className="text-muted-foreground">{faq.a}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Section */}
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardHeader>
              <CardTitle>Hai ancora domande?</CardTitle>
              <CardDescription>
                Non esitare a contattare il team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Se non hai trovato la risposta che cercavi, puoi:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                <li>Chiedere nella chat del team</li>
                <li>Contattare un amministratore</li>
                <li>Consultare il Regolamento per maggiori dettagli</li>
                <li>Rivolgerti ai docenti referenti del giornalino</li>
              </ul>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-12 text-sm text-muted-foreground">
            <p>MatteiWeekly Manager v1.2.0 &quot;Primarina&quot;</p>
            <p>ITIS E. Mattei - San Donato Milanese</p>
          </div>
        </div>
      </main>
    </div>
  )
}
