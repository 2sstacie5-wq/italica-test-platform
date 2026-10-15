// Test di livello (A1–C1): 36 domande a scelta multipla.
// `correct` è l'indice (0 = A, 1 = B, 2 = C, 3 = D) dell'opzione giusta.
// Le opzioni vengono mescolate per ogni studente, quindi la posizione della
// risposta giusta non si ripete. Per modificare una domanda basta cambiare qui.
// Le domande vanno in ordine di difficoltà, dalle più facili alle più difficili.
// Gli id q1–q30 sono i numeri del PDF originale; e1–e4 sono domande A1 molto facili aggiunte all’inizio; e5–e6 sono domande sul condizionale.

module.exports = {
  meta: {
    title: "Test di livello",
    version: 3,
    durationMin: 30,
    // il livello si calcola dal numero di risposte giuste
    scale: [
      { max: 10, level: "A1" },
      { max: 17, level: "A2" },
      { max: 24, level: "B1" },
      { max: 30, level: "B2" },
      { max: 36, level: "C1" },
    ],
    // se il punteggio è vicino al confine tra due livelli, consigliamo un colloquio orale
    borderline: [[17, 18], [24, 25]],
    showResultToStudent: true,
  },
  items: [
    { id: "e1", level: "A1", text: "Ciao! Io ___ Anna, e tu?", options: ["mi chiamo", "ti chiami", "si chiama", "mi chiami"], correct: 0 },
    { id: "e2", level: "A1", text: "Marco ___ italiano, di Roma.", options: ["è", "sono", "sei", "siamo"], correct: 0 },
    { id: "e3", level: "A1", text: "Ho ___ gatto e due cani.", options: ["un", "una", "uno", "un’"], correct: 0 },
    { id: "e4", level: "A1", text: "— ___ anni hai? — Ho venticinque anni.", options: ["Quanti", "Quanto", "Quale", "Come"], correct: 0 },
    { id: "q4", level: "A1", text: "I miei fratelli ___ a Bologna, ma studiano a Firenze.", options: ["vive", "viviamo", "vivete", "vivono"], correct: 3 },
    { id: "q5", level: "A1", text: "Stasera non ___ uscire perché sono stanco.", options: ["voglio", "vuoi", "volete", "vuole"], correct: 0 },
    { id: "q1", level: "A1", text: "Signora, ___ ripetere il Suo cognome, per favore?", options: ["puoi", "potete", "può", "possono"], correct: 2 },
    { id: "q2", level: "A1", text: "Ragazzi, a che ora ___ domani mattina?", options: ["vi alzate", "si alzano", "alziamo", "ti alzi"], correct: 0 },
    { id: "q3", level: "A1", text: "Marta non trova le chiavi. ___ cerca da mezz’ora.", options: ["Li", "Le", "La", "Lo"], correct: 1 },

    { id: "q13", level: "A2", text: "Mio fratello è più paziente ___ me.", options: ["di", "che", "come a", "da"], correct: 0 },
    { id: "q11", level: "A2", text: "Per arrivare in centro, ___ prendere l’autobus numero 12.", options: ["devi", "devi a", "hai", "devi di"], correct: 0 },
    { id: "q10", level: "A2", text: "Da bambina, Giulia ___ spesso le estati dai nonni.", options: ["ha trascorso", "trascorrerà", "trascorre", "trascorreva"], correct: 3 },
    { id: "q14", level: "A2", text: "Ieri sera Luca e Sara ___ al ristorante, poi ___ una passeggiata.", options: ["sono andati / hanno fatto", "hanno andato / sono fatto", "sono andati / sono fatto", "hanno andati / hanno fatto"], correct: 0 },
    { id: "q7", level: "A2", text: "Se domani ___ bel tempo, andremo al lago.", options: ["farà", "facesse", "fa", "farebbe"], correct: 2 },
    { id: "q8", level: "A2", text: "Ragazze, ___ già ___ i biglietti per il concerto?", options: ["avete / comprato", "avete / comprati", "siete / comprati", "avete / comprare"], correct: 0 },
    { id: "q9", level: "A2", text: "Non vedo Paolo da giorni. ___ hai parlato ultimamente?", options: ["Lo", "Gli", "Ne", "Ci"], correct: 1 },
    { id: "q12", level: "A2", text: "Non abbiamo più pane. ___ compri un po’ tornando a casa?", options: ["Lo", "Li", "Ne", "Ci"], correct: 2 },
    { id: "e5", level: "A2", text: "___ volentieri con voi al cinema, ma stasera devo lavorare.", options: ["Verrei", "Vengo", "Venivo", "Verrò"], correct: 0 },
    { id: "q6", level: "A2", text: "Quando siamo arrivati alla stazione, il treno ___ già ___.", options: ["è / partito", "aveva / partito", "ha / partito", "era / partito"], correct: 3 },
    { id: "q15", level: "A2", text: "Nonostante ___ molto stanca, Francesca ha continuato a lavorare.", options: ["fosse", "era", "essere", "è stata"], correct: 0 },

    { id: "q17", level: "B1", text: "Il professore ci ha consigliato ___ più articoli in italiano.", options: ["di leggere", "che leggiamo", "a leggere", "leggiamo"], correct: 0 },
    { id: "q21", level: "B1", text: "Non riesco a trovare il documento: ___ l’ho messo ieri sera?", options: ["dove", "che", "a cui", "quando"], correct: 0 },
    { id: "q19", level: "B1", text: "Quando sono entrato in ufficio, i colleghi ___ la riunione.", options: ["iniziano già", "avevano già iniziato", "hanno già iniziato", "inizierebbero già"], correct: 1 },
    { id: "q18", level: "B1", text: "È una persona ___ puoi sempre contare.", options: ["che", "di cui", "su cui", "con cui"], correct: 2 },
    { id: "q20", level: "B1", text: "Credo che i tuoi amici ___ ragione, ma vorrei sentire anche l’altra versione.", options: ["hanno", "avranno", "avessero", "abbiano"], correct: 3 },
    { id: "q16", level: "B1", text: "Se avessi saputo che venivate, ___ qualcosa da mangiare.", options: ["preparerò", "preparavo", "avrei preparato", "avessi preparato"], correct: 2 },
    { id: "e6", level: "B1", text: "Ti ___, ma non avevo il tuo numero di telefono.", options: ["avrei chiamato", "chiamerei", "ho chiamato", "chiamassi"], correct: 0 },
    { id: "q22", level: "B1", text: "Benché ___ molto, Marco non è riuscito a superare l’esame.", options: ["ha studiato", "studiasse", "abbia studiato", "studierà"], correct: 2 },

    { id: "q24", level: "B2", text: "La candidata ha parlato con tanta sicurezza ___ tutti si sono convinti della sua competenza.", options: ["affinché", "sebbene", "purché", "al punto che"], correct: 3 },
    { id: "q25", level: "B2", text: "Non penso che una decisione così importante ___ senza consultare il team.", options: ["debba prendere", "debba essere presa", "deve essere presa", "sia prendere"], correct: 1 },
    { id: "q23", level: "B2", text: "Se il direttore ___ prima della riunione, avremmo potuto modificare la proposta.", options: ["ci avesse avvisati", "ci avrebbe avvisato", "ci avvisava", "ci abbia avvisati"], correct: 0 },
    { id: "q26", level: "B2", text: "Qualora ___ ulteriori informazioni, non esiti a contattarci.", options: ["avrà bisogno di", "ha bisogno di", "avesse bisogno di", "avrebbe bisogno di"], correct: 2 },
    { id: "q27", level: "B2", text: "È una questione ___ conseguenze non dovremmo sottovalutare.", options: ["le cui", "di cui le", "che le", "le quali"], correct: 0 },

    { id: "q28", level: "C1", text: "Per quanto ___ le ragioni della direzione, ritengo che la decisione sia stata affrettata.", options: ["comprendo", "comprendessi", "comprendendo", "comprenda"], correct: 3 },
    { id: "q29", level: "C1", text: "La proposta è stata respinta, non già perché ___ priva di meriti, bensì perché mancavano le risorse necessarie.", options: ["fosse", "era stata", "sia", "sarebbe"], correct: 0 },
    { id: "q30", level: "C1", text: "Che il progetto ___ successo era tutt’altro che scontato, viste le difficoltà iniziali.", options: ["avrebbe avuto", "avesse avuto", "avrebbe", "abbia"], correct: 0 },
  ],
};
