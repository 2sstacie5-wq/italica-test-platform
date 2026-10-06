// Test rapido di livello (A1–C1): 50 domande a scelta multipla, 15 minuti.
// `correct` è l'indice (0 = A, 1 = B, 2 = C, 3 = D) dell'opzione giusta.
// Le opzioni vengono mescolate per ogni studente, quindi la posizione della
// risposta giusta non si ripete. Per modificare una domanda basta cambiare qui.

module.exports = {
  meta: {
    title: "Test rapido di livello",
    durationMin: 15,
    // il livello si calcola dal numero di risposte giuste
    scale: [
      { max: 10, level: "A1" },
      { max: 20, level: "A2" },
      { max: 32, level: "B1" },
      { max: 42, level: "B2" },
      { max: 50, level: "C1" },
    ],
    // se il punteggio è vicino al confine tra due livelli, consigliamo un colloquio orale
    borderline: [[20, 22], [32, 34]],
    showResultToStudent: true,
  },
  items: [
    { id: "q1", level: "A1", text: "Come ___, Signora Rossi?", options: ["si chiama", "ti chiami", "vi chiamate", "si chiamano"], correct: 0 },
    { id: "q2", level: "A1", text: "Io ___ Kyiv.", options: ["sono di", "sono da", "ho di", "ho da"], correct: 0 },
    { id: "q3", level: "A1", text: "___ fratelli hai?", options: ["Quanti", "Quanto", "Quale", "Che cosa"], correct: 0 },
    { id: "q4", level: "A1", text: "Ogni mattina ___ alle sette.", options: ["alzare", "ci alziamo", "alzarsi", "alziamoci"], correct: 1 },
    { id: "q5", level: "A1", text: "Mangi le caramelle? — Sì, ___ mangio.", options: ["le", "ne", "lo", "li"], correct: 0 },
    { id: "q6", level: "A1", text: "Loro ___ italiani, ma abitano in Germania.", options: ["sono", "è", "siete", "sei"], correct: 0 },
    { id: "q7", level: "A1", text: "Signora, ___ a Roma?", options: ["abita", "abiti", "abite", "abitare"], correct: 0 },
    { id: "q8", level: "A1", text: "Ragazzi, ___ stasera?", options: ["uscite", "escono", "esci", "uscita"], correct: 0 },
    { id: "q9", level: "A1", text: "Marco e Anna ___ una casa in centro.", options: ["hanno", "ha", "avete", "ho"], correct: 0 },
    { id: "q10", level: "A1", text: "Noi ___ al ristorante ogni venerdì.", options: ["andiamo", "andate", "vanno", "vai"], correct: 0 },

    { id: "q11", level: "A2", text: "Ieri noi ___ al cinema.", options: ["siamo andati", "abbiamo andato", "andavamo", "andremo"], correct: 0 },
    { id: "q12", level: "A2", text: "Quando eravate bambini, ___ spesso al mare?", options: ["andavate", "andavano", "andavamo", "siete andati"], correct: 0 },
    { id: "q13", level: "A2", text: "Voi ___ a Firenze in estate.", options: ["andrete", "andremo", "andranno", "andresti"], correct: 0 },
    { id: "q14", level: "A2", text: "Loro non ___ mai a Napoli.", options: ["sono stati", "hanno stati", "stavano", "saranno"], correct: 0 },
    { id: "q15", level: "A2", text: "Mentre io cucinavo, voi ___ la televisione.", options: ["guardavate", "avete visto", "guardate", "guardaverete"], correct: 0 },
    { id: "q16", level: "A2", text: "Avete già comprato i biglietti? — Sì, ___ abbiamo comprati ieri.", options: ["li", "le", "ne", "gli"], correct: 0 },
    { id: "q17", level: "A2", text: "Avete bisogno di acqua? — Sì, ___ abbiamo bisogno.", options: ["ne", "la", "lo", "le"], correct: 0 },
    { id: "q18", level: "A2", text: "Voi ___ lavorare domani mattina?", options: ["dovete", "devono", "devi", "dobbiamo"], correct: 0 },
    { id: "q19", level: "A2", text: "Queste scarpe sono ___ di quelle nere.", options: ["più comode", "molto comode", "la più comoda", "comodissime"], correct: 0 },
    { id: "q20", level: "A2", text: "Abbiamo organizzato una festa ___ i nostri amici.", options: ["per", "da", "di", "su"], correct: 0 },

    { id: "q21", level: "B1", text: "Quando sono arrivato, loro ___ già mangiato.", options: ["avevano", "hanno", "mangiavano", "avranno"], correct: 0 },
    { id: "q22", level: "B1", text: "Se abbiamo tempo, ___ una passeggiata.", options: ["facciamo", "faremmo", "facessimo", "avremmo fatto"], correct: 0 },
    { id: "q23", level: "B1", text: "Ho comprato i libri, ma non ___ ancora letti.", options: ["li ho", "gli ho", "le ho", "ne ho"], correct: 0 },
    { id: "q24", level: "B1", text: "Mentre voi ___ per strada, avete incontrato Luca.", options: ["camminavate", "avete camminato", "camminerete", "camminereste"], correct: 0 },
    { id: "q25", level: "B1", text: "Non ci sono più biglietti: ___ tutti.", options: ["li hanno venduti", "gli hanno venduti", "ne hanno venduti", "li vendevano"], correct: 0 },
    { id: "q26", level: "B1", text: "Penso che Maria ___ ragione.", options: ["abbia", "ha", "avrà", "avrebbe"], correct: 0 },
    { id: "q27", level: "B1", text: "È possibile che loro ___ in ritardo.", options: ["siano", "sono", "saranno", "erano"], correct: 0 },
    { id: "q28", level: "B1", text: "Se tu avessi più tempo, ___ più spesso l’italiano.", options: ["studieresti", "studi", "studiavi", "avresti studiato"], correct: 0 },
    { id: "q29", level: "B1", text: "Al posto vostro, ___ così.", options: ["farei", "faremmo", "fareste", "fanno"], correct: 0 },
    { id: "q30", level: "B1", text: "Non credo che lui ___ venire alla festa.", options: ["possa", "può", "potrà", "poteva"], correct: 0 },
    { id: "q31", level: "B1", text: "Da quanto tempo voi ___ italiano?", options: ["studiate", "avete studiato", "studiavate", "studierete"], correct: 0 },
    { id: "q32", level: "B1", text: "È da tre anni che loro ___ qui.", options: ["vivono", "hanno vissuto", "vivevano", "vivranno"], correct: 0 },
    { id: "q33", level: "B1", text: "Nonostante ___ stanco, è uscito.", options: ["fosse", "era", "è", "sarà"], correct: 0 },
    { id: "q34", level: "B1", text: "Mi ha detto che ___ a casa più tardi.", options: ["sarebbe tornato", "torna", "tornò", "tornerà"], correct: 0 },
    { id: "q35", level: "B1", text: "È importante che voi ___ puntuali.", options: ["siate", "siete", "sarete", "eravate"], correct: 0 },

    { id: "q36", level: "B2", text: "Se non fosse stato per voi, non ci ___ mai riuscito.", options: ["sarei", "sono", "ero", "sarò"], correct: 0 },
    { id: "q37", level: "B2", text: "Avrei accettato il lavoro, se me lo ___ prima.", options: ["aveste detto", "dicevate", "avreste detto", "avete detto"], correct: 0 },
    { id: "q38", level: "B2", text: "Quando arriverete, noi ___ già finito il lavoro.", options: ["avremo", "avevamo", "abbiamo", "finivamo"], correct: 0 },
    { id: "q39", level: "B2", text: "Non vedo l’ora che voi ___ in Italia.", options: ["veniate", "venite", "verrete", "venivate"], correct: 0 },
    { id: "q40", level: "B2", text: "Benché ___ poco tempo, hanno accettato l’incarico.", options: ["avessero", "avevano", "avranno", "hanno"], correct: 0 },
    { id: "q41", level: "B2", text: "A meno che non ___ qualcosa, partiremo domani.", options: ["succeda", "succede", "succederà", "succedeva"], correct: 0 },
    { id: "q42", level: "B2", text: "Avrei preferito che lei me lo ___.", options: ["avesse detto", "ha detto", "dicesse", "direbbe"], correct: 0 },
    { id: "q43", level: "B2", text: "Non è detto che la situazione ___ presto.", options: ["migliori", "migliora", "migliorerà", "migliorava"], correct: 0 },
    { id: "q44", level: "B2", text: "Per quanto ___ difficile, bisogna trovare una soluzione.", options: ["possa sembrare", "può sembrare", "sembrerà", "sembrava"], correct: 0 },
    { id: "q45", level: "B2", text: "Quale frase è più naturale in un registro formale?", options: ["Le sarei grato se potesse inviarmi i documenti.", "Mi mandi i documenti.", "Mandami i documenti.", "Mi dai i documenti?"], correct: 0 },

    { id: "q46", level: "C1", text: "Se avessero ascoltato i nostri consigli, probabilmente ___ evitato il problema.", options: ["avrebbero", "avrebbero avuto", "avessero", "hanno"], correct: 0 },
    { id: "q47", level: "C1", text: "Pur ___ le difficoltà, hanno deciso di proseguire.", options: ["conoscendo", "conosciuto", "conoscono", "conoscere"], correct: 0 },
    { id: "q48", level: "C1", text: "Non appena ___ la conferma, procederemo con l’organizzazione.", options: ["avremo ricevuto", "riceveremo", "abbiamo ricevuto", "ricevevamo"], correct: 0 },
    { id: "q49", level: "C1", text: "È una questione sulla quale non mi sentirei ___ con certezza.", options: ["di esprimermi", "a esprimermi", "da esprimere", "per esprimermi"], correct: 0 },
    { id: "q50", level: "C1", text: "A giudicare dai risultati, si direbbe che il progetto ___ dato i frutti sperati.", options: ["abbia", "ha", "avrà", "avrebbe"], correct: 0 },
  ],
};
