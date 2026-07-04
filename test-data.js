// Contenuto del test A1 (con chiave di correzione).
// QUESTO FILE NON VA MAI SERVITO AL CLIENT COSÌ COM'È: server.js rimuove le risposte
// corrette prima di inviare i dati allo studente.

module.exports = {
  meta: {
    title: "Test di fine corso A1",
    totalPoints: 100,
    passPercent: 60,
    writtenDurationMin: 90,
  },

  parts: [
    // ---------------- PARTE 1 — Scelta multipla ----------------
    {
      id: "p1",
      title: "Parte 1 — Scegli la risposta corretta",
      type: "mc",
      durationMin: 18,
      pointsPerQ: 1,
      items: [
        { id: "q1", group: "Essere/avere", text: "Lei ___ italiana, ma i suoi nonni ___ ucraini.", options: { a: "è / sono", b: "è / hanno", c: "ha / sono" }, correct: "a" },
        { id: "q2", group: "Essere/avere", text: "Loro ___ due bambini, ma noi non ___.", options: { a: "hanno / siamo", b: "sono / siamo", c: "hanno / abbiamo" }, correct: "c" },
        { id: "q3", group: "Articoli indeterminativi / determinativi", text: "Ho ___ amica simpatica che vive a Torino.", options: { a: "un", b: "una", c: "un’" }, correct: "c" },
        { id: "q4", group: "Articoli indeterminativi / determinativi", text: "___ zaino sulla sedia è di Marco.", options: { a: "Il", b: "Lo", c: "L’" }, correct: "b" },
        { id: "q5", group: "Presente indicativo verbi regolari", text: "Tu a che ora ___ (finire) di lavorare di solito?", options: { a: "finisci", b: "finiscono", c: "finiamo" }, correct: "a" },
        { id: "q6", group: "Presente indicativo verbi irregolari", text: "Noi ___ (bere) sempre acqua ai pasti, loro invece ___ (bere) vino.", options: { a: "beviamo / bevono", b: "bevono / beviamo", c: "beviamo / bevete" }, correct: "a" },
        { id: "q7", group: "Presente indicativo verbi irregolari", text: "Voi ___ (uscire) stasera o restate a casa?", options: { a: "esci", b: "escite", c: "uscite" }, correct: "c" },
        { id: "q8", group: "Andare / venire", text: "Noi ___ (andare) al mare domani, ma i nostri amici non ___.", options: { a: "andiamo / vengono", b: "andiamo / vanno", c: "vanno / andiamo" }, correct: "b" },
        { id: "q9", group: "Andare / venire", text: "Voi ___ (venire) alla festa sabato?", options: { a: "venite", b: "veniamo", c: "venire" }, correct: "a" },
        { id: "q10", group: "Preposizioni semplici", text: "Sono ___ Napoli, ma vivo ___ Firenze da tre anni.", options: { a: "da / a", b: "di / a", c: "a / da" }, correct: "b" },
        { id: "q11", group: "Preposizioni semplici", text: "Questo regalo è ___ mia sorella, non è ___ te.", options: { a: "per / per", b: "di / da", c: "a / di" }, correct: "a" },
        { id: "q12", group: "Preposizioni articolate", text: "Io vado ___ letto ___ 11 di sera.", options: { a: "nel / a", b: "sul / alle", c: "a / alle" }, correct: "c" },
        { id: "q13", group: "Preposizioni articolate", text: "La maestra dà i compiti ___ studenti nuovi.", options: { a: "ai", b: "agli", c: "alle" }, correct: "b" },
        { id: "q14", group: "Bar (vocabolario)", text: "Il cameriere ci porta il conto: adesso dobbiamo ___.", options: { a: "pagare", b: "prenotare", c: "noleggiare" }, correct: "a" },
        { id: "q15", group: "Verbo fare", text: "Che cosa ___ (fare) i tuoi amici sabato sera, di solito?", options: { a: "fai", b: "fanno", c: "facciamo" }, correct: "b" },
        { id: "q16", group: "Verbi modali", text: "Noi non ___ venire alla festa perché ___ studiare.", options: { a: "possiamo / dobbiamo", b: "potete / dobbiamo", c: "dobbiamo / possiamo" }, correct: "a" },
        { id: "q17", group: "Verbi modali", text: "Ragazzi, ___ (volere) un caffè?", options: { a: "vogliono", b: "volete", c: "vuoi" }, correct: "b" },
        { id: "q18", group: "Tempo libero", text: "Nel tempo libero preferisco un’attività rilassante, come ___.", options: { a: "rispondere alle email", b: "fare la fila in banca", c: "fare yoga" }, correct: "c" },
        { id: "q19", group: "Verbi riflessivi", text: "Noi ___ (vestirsi) sempre in fretta perché siamo in ritardo.", options: { a: "ci vestiamo / siamo", b: "vi vestite / siamo", c: "ci vestiamo / abbiamo" }, correct: "a" },
        { id: "q20", group: "Verbi riflessivi", text: "Tu a che ora ___ (addormentarsi) di solito la sera?", options: { a: "ti addormenta", b: "si addormenta", c: "ti addormenti" }, correct: "c" },
        { id: "q21", group: "Le ore", text: "Sono le ___ (13:45).", options: { a: "due meno un quarto", b: "una e quarantacinque", c: "entrambe le risposte sono corrette" }, correct: "a" },
        { id: "q22", group: "La famiglia", text: "La moglie di mio zio è ___.", options: { a: "la mia zia", b: "mia zia", c: "mio zio" }, correct: "b" },
        { id: "q23", group: "La casa/preposizioni articolate", text: "Metto i piatti puliti ___.", options: { a: "nell’armadio", b: "nel armadio", c: "all’armadio" }, correct: "a" },
        { id: "q24", group: "Piacere + pronomi indiretti", text: "(A noi) ___ piacciono molto i film italiani.", options: { a: "vi", b: "gli", c: "ci" }, correct: "c" },
        { id: "q25", group: "Piacere + pronomi indiretti", text: "___ piace svegliarsi presto la domenica.", options: { a: "non le piace", b: "non le piacciono", c: "le non piace" }, correct: "a" },
        { id: "q26", group: "Abbigliamento", text: "Per andare a un colloquio di lavoro è meglio indossare ___.", options: { a: "una tuta da ginnastica", b: "un completo elegante", c: "il costume da bagno" }, correct: "b" },
        { id: "q27", group: "Pronomi diretti", text: "Compri i biglietti per il concerto? Sì, ___ compro domani.", options: { a: "li", b: "le", c: "lo" }, correct: "a" },
        { id: "q28", group: "Pronomi diretti", text: "Inviti le tue amiche alla festa? Sì, ___ invito volentieri.", options: { a: "gli", b: "le", c: "la" }, correct: "b" },
        { id: "q29", group: "La spesa", text: "Per fare la spesa in modo economico, controllo sempre ___ prima di comprare.", options: { a: "i prezzi", b: "i biglietti", c: "le valigie" }, correct: "a" },
        { id: "q30", group: "La forma impersonale", text: "La domenica, in molte famiglie italiane, ___ pranza tutti insieme dai nonni.", options: { a: "si", b: "ci", c: "li" }, correct: "a" },
        { id: "q31", group: "Viaggi", text: "Prima di partire ___ un viaggio all’estero, è importante controllare ___.", options: { a: "per / il passaporto", b: "in / il passaporto", c: "in / il conto" }, correct: "a" },
        { id: "q32", group: "Viaggi", text: "Vuoi andare al mare in estate?", options: { a: "voglio ci andare", b: "ci voglio andare", c: "ci voglio andarci" }, correct: "b" },
        { id: "q33", group: "Passato prossimo", text: "Ieri sera noi ___ (guardare) un film insieme.", options: { a: "abbiamo guardato", b: "siamo guardati", c: "siamo guardato" }, correct: "a" },
        { id: "q34", group: "Passato prossimo", text: "Le mie amiche ___ (partire) ieri mattina per Parigi.", options: { a: "hanno partito", b: "sono partite", c: "sono partito" }, correct: "b" },
      ],
    },

    // ---------------- PARTE 2 — Vero o Falso ----------------
    {
      id: "p2",
      title: "Parte 2 — Vero o Falso",
      type: "tf",
      durationMin: 4,
      pointsPerQ: 1,
      items: [
        { id: "q1", text: "Il \"supermercato\" è il posto dove di solito si comprano i vestiti.", correct: false },
        { id: "q2", text: "La \"gonna\" è un capo di abbigliamento che di solito portano le donne.", correct: true },
        { id: "q3", text: "Il \"carrello\" serve per portare i prodotti mentre si fa la spesa.", correct: true },
        { id: "q4", text: "In panetteria si comprano i dolci.", correct: false },
        { id: "q5", text: "Lo \"sconto\" è il documento che il cliente riceve dopo aver pagato.", correct: false },
        { id: "q6", text: "Per pagare in contanti si usa la carta di credito.", correct: false },
        { id: "q7", text: "In macelleria si compra la carne.", correct: true },
        { id: "q8", text: "Il \"cappotto\" si porta di solito in estate, quando fa caldo.", correct: false },
      ],
    },

    // ---------------- PARTE 3 — Abbinamento ----------------
    {
      id: "p3",
      title: "Parte 3 — Abbinamento",
      type: "match",
      durationMin: 4,
      pointsPerQ: 1,
      prompts: [
        { id: "q1", text: "Come ti chiami?" },
        { id: "q2", text: "Come stai?" },
        { id: "q3", text: "Quanti anni hai?" },
        { id: "q4", text: "Che ore sono?" },
        { id: "q5", text: "Dove abiti?" },
        { id: "q6", text: "Cosa ti piace fare nel tempo libero?" },
        { id: "q7", text: "Come vai al lavoro?" },
        { id: "q8", text: "Cosa hai fatto ieri sera?" },
      ],
      options: {
        a: "Sono andato al cinema con un amico.",
        b: "Sto bene, grazie, e tu?",
        c: "Abito in centro, vicino alla stazione.",
        d: "Mi chiamo Anna.",
        e: "Vado al lavoro in autobus.",
        f: "Sono le tre e mezza.",
        g: "Ho ventisei anni.",
        h: "Mi piace leggere e ascoltare musica.",
      },
      correct: { q1: "d", q2: "b", q3: "g", q4: "f", q5: "c", q6: "h", q7: "e", q8: "a" },
    },

    // ---------------- PARTE 4 — Riordina le parole ----------------
    {
      id: "p4",
      title: "Parte 4 — Riordina le parole",
      type: "reorder",
      durationMin: 5,
      pointsPerQ: 2,
      items: [
        { id: "q1", words: "sette / mi / la mattina / sveglio / alle", accepted: ["la mattina mi sveglio alle sette"] },
        { id: "q2", words: "andati / ieri / siamo / al mare", accepted: ["ieri siamo andati al mare", "siamo andati al mare ieri"] },
        { id: "q3", words: "piacciono / ci / italiani / i film", accepted: ["ci piacciono i film italiani"] },
        { id: "q4", words: "supermercato / vado / spesso / al", accepted: ["vado spesso al supermercato"] },
        { id: "q5", words: "dobbiamo / stasera / studiare / noi", accepted: ["stasera noi dobbiamo studiare", "noi dobbiamo studiare stasera"] },
      ],
    },

    // ---------------- PARTE 5 — Completa le frasi ----------------
    {
      id: "p5",
      title: "Parte 5 — Completa le frasi",
      type: "fillblank",
      durationMin: 15,
      pointsPerBlank: 1,
      groups: [
        {
          id: "5A",
          title: "Verbi (essere, avere, riflessivi, modali)",
          items: [
            { id: "q1", text: "Io ___ (essere) stanco oggi.", blanks: [{ accepted: ["sono"] }] },
            { id: "q2", text: "Noi ___ (dovere) partire presto domani.", blanks: [{ accepted: ["dobbiamo"] }] },
            { id: "q3", text: "Mia sorella ___ (chiamarsi) Elena.", blanks: [{ accepted: ["si chiama"] }] },
            { id: "q4", text: "Tu ___ (potere) aiutarmi un momento?", blanks: [{ accepted: ["puoi"] }] },
          ],
        },
        {
          id: "5B",
          title: "Preposizioni",
          items: [
            { id: "q1", text: "Noi abitiamo ___ Roma ___ due anni.", blanks: [{ accepted: ["a"] }, { accepted: ["da"] }] },
            { id: "q2", text: "Vado ___ dentista.", blanks: [{ accepted: ["dal"] }] },
            { id: "q3", text: "Il treno parte ___ 20 minuti.", blanks: [{ accepted: ["tra", "fra"] }] },
            { id: "q4", text: "Andiamo ___ mare ogni estate.", blanks: [{ accepted: ["al"] }] },
          ],
        },
        {
          id: "5C",
          title: "Pronomi (diretti, indiretti, piacere)",
          items: [
            { id: "q1", text: "Vado ___ vacanza ogni anno perché ___ piace molto viaggiare.", blanks: [{ accepted: ["in"] }, { accepted: ["mi"] }] },
            { id: "q2", text: "Bevi molta acqua? ___ bevo almeno 2 litri al giorno.", blanks: [{ accepted: ["ne"] }] },
            { id: "q3", text: "Compri il pane? Sì, ___ compro.", blanks: [{ accepted: ["lo"] }] },
            { id: "q4", text: "Vi piace leggere? Si, ___ piace leggere.", blanks: [{ accepted: ["ci"] }] },
          ],
        },
        {
          id: "5D",
          title: "Le ore e la routine quotidiana",
          items: [
            { id: "q1", text: "7:15 – Sono le sette e ___.", blanks: [{ accepted: ["un quarto", "quindici"] }] },
            { id: "q2", text: "La sera io ___ (addormentarsi) verso le undici.", blanks: [{ accepted: ["mi addormento"] }] },
            { id: "q3", text: "Il sabato noi ___ (svegliarsi) più tardi del solito.", blanks: [{ accepted: ["ci svegliamo"] }] },
            { id: "q4", text: "Il pranzo è ___ mezzogiorno.", blanks: [{ accepted: ["a"] }] },
          ],
        },
      ],
    },

    // ---------------- PARTE 6 — Completa il testo ----------------
    {
      id: "p6",
      title: "Parte 6 — Completa il testo",
      type: "cloze",
      durationMin: 10,
      pointsPerBlank: 1,
      template:
        "Mi chiamo Anna. Ogni giorno (1. svegliarsi) {{1}} alle sette, (2. fare) {{2}} colazione e (3. prendere) {{3}} un caffè al bar. Di solito (4. andare) {{4}} al lavoro in autobus e (5. tornare) {{5}} a casa verso le sei. Ieri, però, non (6. andare) {{6}} al lavoro perché (7. avere) {{7}} il mal di testa. Per questo motivo, (8. prendere) {{8}} un giorno libero e (9. dormire) {{9}} molto. La sera mio marito mi (10. portare) {{10}} una minestra calda. Oggi (11. stare) {{11}} meglio e domani (12. tornare) {{12}} al lavoro.",
      blanks: [
        { id: "1", accepted: ["mi sveglio"] },
        { id: "2", accepted: ["faccio"] },
        { id: "3", accepted: ["prendo"] },
        { id: "4", accepted: ["vado"] },
        { id: "5", accepted: ["torno"] },
        { id: "6", accepted: ["sono andata", "sono andato"] },
        { id: "7", accepted: ["ho avuto"] },
        { id: "8", accepted: ["ho preso"] },
        { id: "9", accepted: ["ho dormito"] },
        { id: "10", accepted: ["ha portato"] },
        { id: "11", accepted: ["sto"] },
        { id: "12", accepted: ["torno"] },
      ],
    },

    // ---------------- PARTE 7 — Continua la frase (valutazione manuale) ----------------
    {
      id: "p7",
      title: "Parte 7 — Continua la frase",
      type: "open",
      durationMin: 4,
      pointsPerQ: 2,
      manualGrade: true,
      instructions: "Completa le frasi in modo personale (almeno una frase completa per ogni punto).",
      items: [
        { id: "q1", text: "Di solito, la mattina io…" },
        { id: "q2", text: "Nel tempo libero mi piace… perché…" },
        { id: "q3", text: "La settimana scorsa sono andato/a… e ho…" },
        { id: "q4", text: "Se ho fame, vado al bar e ordino…" },
        { id: "q5", text: "Quando viaggio, preferisco… perché…" },
      ],
    },
  ],

  // Valutata separatamente dall'insegnante, non rientra nei 100 punti ma è obbligatoria per il certificato
  finalProduction: {
    title: "Parte finale — Produzione orale / scritta",
    written: [
      { id: "w1", text: "Scrivi un messaggio a un amico per invitarlo a fare qualcosa insieme questo weekend (dove, quando, cosa volete fare). (6-8 frasi)" },
      { id: "w2", text: "Descrivi la tua casa: le stanze, i mobili e cosa ti piace di più della tua casa. (6–8 frasi)" },
      { id: "w3", text: "Racconta come hai passato la giornata di ieri (usa il passato prossimo: cosa hai fatto, dove sei andato/a, con chi). (6–8 frasi)" },
    ],
    oral: [
      { id: "o1", text: "Parla della tua famiglia: quante persone ci sono, chi sono, quanti anni hanno e cosa gli piace fare. (6-8 frasi)" },
      { id: "o2", text: "Descrivi la tua giornata tipica: a che ora ti svegli, cosa fai la mattina, il pomeriggio e la sera. Usa i verbi riflessivi e le ore. (6–8 frasi)" },
      { id: "o3", text: "Racconta un viaggio che hai fatto: dove sei andato/a, come hai viaggiato e cosa hai fatto. Usa il passato prossimo. (6–8 frasi)" },
    ],
  },
};
