# Wiki plan: platonism

Scope: Bridge collection on the Pythagorean and Platonic line, from Pythagoras to Proclus and the closing of the Academy in 529, carried on through the Christian Platonists and Platonism in Arabic, from Augustine to Ibn Rushd. Twenty pages: the landing page, eighteen entity articles and one topic page on number mysticism. Minor figures (Nicomachus, Numenius, Moderatus, Philolaus, Archytas, Ammonius Saccas) and the Neoplatonists school are record-only: pages mention them and link to the graph, none gets its own page. The works of the later groups (confessions, city-of-god, consolation-of-philosophy, divine-names, incoherence-of-the-philosophers, incoherence-of-the-incoherence, book-of-healing), aristotle, sufism and the places are record-only too: linked with `[[id]]` from the pages, their claims listed under the person page they belong to.

Folder: `apps/site/src/pages/wiki/platonism/`. No page for any of these entities exists elsewhere (the only `entity:` frontmatter under `apps/site/src/pages/wiki/` is in this folder), so no entity is shared. The Theology of Aristotle page also carries the Graeco-Arabic translation movement, which has no entity of its own.

| Page                                        | Path                               | Entity or topic       | Group                      | Order |
| ------------------------------------------- | ---------------------------------- | --------------------- | -------------------------- | ----- |
| Platonism                                   | platonism/index.md                 | topic: the collection | Overview                   | 0     |
| Pythagoras                                  | platonism/Pythagoras.md            | pythagoras            | Pythagorean Beginnings     | 10    |
| Pythagoreans                                | platonism/Pythagoreans.md          | pythagoreans          | Pythagorean Beginnings     | 20    |
| Plato                                       | platonism/Plato.md                 | plato                 | Plato and the Academy      | 30    |
| Academy                                     | platonism/Academy.md               | academy               | Plato and the Academy      | 40    |
| Neopythagoreans                             | platonism/Neopythagoreans.md       | neopythagoreans       | Between Plato and Plotinus | 50    |
| Plotinus                                    | platonism/Plotinus.md              | plotinus              | Late Platonists            | 60    |
| Porphyry                                    | platonism/Porphyry.md              | porphyry              | Late Platonists            | 70    |
| Iamblichus                                  | platonism/Iamblichus.md            | iamblichus            | Late Platonists            | 80    |
| Proclus                                     | platonism/Proclus.md               | proclus               | Late Platonists            | 90    |
| Number Mysticism from Pythagoras to Proclus | platonism/Number-Mysticism.md      | topic                 | Themes                     | 100   |
| Augustine                                   | platonism/Augustine.md             | augustine             | Christian Platonists       | 110   |
| Boethius                                    | platonism/Boethius.md              | boethius              | Christian Platonists       | 120   |
| Pseudo-Dionysius                            | platonism/Pseudo-Dionysius.md      | pseudo-dionysius      | Christian Platonists       | 130   |
| The Theology of Aristotle                   | platonism/Theology-of-Aristotle.md | theology-of-aristotle | Platonism in Arabic        | 140   |
| al-Kindi                                    | platonism/Al-Kindi.md              | al-kindi              | Platonism in Arabic        | 150   |
| al-Farabi                                   | platonism/Al-Farabi.md             | al-farabi             | Platonism in Arabic        | 160   |
| Ibn Sina                                    | platonism/Ibn-Sina.md              | ibn-sina              | Platonism in Arabic        | 170   |
| al-Ghazali                                  | platonism/Al-Ghazali.md            | al-ghazali            | Platonism in Arabic        | 180   |
| Ibn Rushd                                   | platonism/Ibn-Rushd.md             | ibn-rushd             | Platonism in Arabic        | 190   |

## Platonism (index.md)

- Title: Platonism
- Description: A guide to the Platonic line from Pythagoras at Croton through Plotinus and Proclus to the Christian Platonists and the philosophers who read Plato in Arabic, ending with Ibn Rushd.
- Claims: pythagoras.founder-of.pythagoreans, plato.founder-of.academy, plotinus.founder-of.neoplatonists, academy.closed, academy.affected-by.justinian-edict, neoplatonists.active-at.athens, augustine.influenced-by.neoplatonists, boethius.influenced-by.neoplatonists, pseudo-dionysius.member-of.neoplatonists, pseudo-dionysius.influenced-by.proclus, theology-of-aristotle.translates.enneads, theology-of-aristotle.composed, al-kindi.influenced-by.theology-of-aristotle, ibn-sina.influenced-by.al-farabi, incoherence-of-the-philosophers.critiques.ibn-sina, incoherence-of-the-incoherence.critiques.incoherence-of-the-philosophers
- Sources: sep-neoplatonism (preamble, §1, §7, §8), sep-pythagoreanism (§4), mactutor-academy (preamble), sep-arabic-islamic-greek (preamble, §3), sep-theology-aristotle (§1), sep-proclus (§4)
- Links: [[pythagoras]], [[pythagoreans]], [[plato]], [[academy]], [[neopythagoreans]], [[plotinus]], [[porphyry]], [[iamblichus]], [[proclus]], [[neoplatonists]], [[justinian-edict]], [[augustine]], [[boethius]], [[pseudo-dionysius]], [[theology-of-aristotle]], [[al-kindi]], [[al-farabi]], [[ibn-sina]], [[al-ghazali]], [[ibn-rushd]], [[enneads]], [[aristotle]]
- Notes: Landing-page overview only: a timeline of the eighteen articles by group, from Pythagoras to Ibn Rushd, then one paragraph on the number-mysticism thread with a link to the topic page. Shows the teacher-to-student chain (Plotinus, Porphyry, Iamblichus, Proclus) from the stored `student-of` and `influenced-by` claims. Two bridges carry the line past 529: Latin and Greek Christian writers who read the Platonists (sep-neoplatonism §8), and the Arabic paraphrase of the Enneads that circulated as the Theology of Aristotle, which al-Kindi, al-Farabi and Ibn Sina read (sep-theology-aristotle §1, §5). The groups are by tradition, not strict chronology: Augustine (354 to 430) is earlier than Proclus, and Boethius and Pseudo-Dionysius are contemporaries of the 529 closing; the timeline says so rather than implying a succession. The Arabic line ends with the exchange between al-Ghazali's Incoherence of the Philosophers and Ibn Rushd's reply. [[neoplatonists]] and [[aristotle]] are linked, not given pages.

## Pythagoras

- Title: Pythagoras
- Description: Samian philosopher who settled at Croton about 530 BCE and founded the community later called the Pythagoreans.
- Claims: pythagoras.born, pythagoras.active-at.samos, pythagoras.active-at.croton, pythagoras.active-at.metapontum, pythagoras.died, pythagoras.founder-of.pythagoreans
- Sources: sep-pythagoras (preamble, §1, §3, §4.1 to §4.3), diogenes-laertius-lives-hicks (DL 8.1, 8.3, 8.40), iamblichus-pythagoric-life-taylor (ch. V, ch. XXXV)
- Links: [[pythagoreans]], [[croton]], [[samos]], [[metapontum]], [[golden-verses]], [[on-the-pythagorean-way-of-life]], [[philolaus]], [[archytas]]
- Notes: Present the Pythagorean Question (SEP §1, §2): all lives are late, so the page separates what the graph asserts from what later authors report. Birth and death dates are approximate (`-0569~`, `-0489~`). The Golden Verses are attributed to him but composed later (golden-verses.composed, -0349/0400); say so.

## Pythagoreans

- Title: Pythagoreans
- Description: The community around Pythagoras at Croton and its fifth- and fourth-century successors, ending with the school at Tarentum.
- Claims: pythagoreans.opened, pythagoreans.active-at.croton, pythagoreans.active-at.tarentum, pythagoreans.closed, philolaus.member-of.pythagoreans, philolaus.born, archytas.member-of.pythagoreans, archytas.active-at.tarentum, archytas.floruit, plato.influenced-by.pythagoreans
- Sources: sep-pythagoras (§3), sep-pythagoreanism (preamble, §2.1, §2.5, §3.7), diogenes-laertius-lives-hicks (DL 8.3, 8.79, 8.84), sep-archytas (preamble), sep-philolaus (preamble, §7.2), rouse-ball-short-account-history-mathematics (p. 22, p. 36)
- Links: [[pythagoras]], [[plato]], [[croton]], [[tarentum]], [[neopythagoreans]]
- Notes: Philolaus and Archytas are covered inside this page as record-only members. The closing date (-0349~) comes from sep-pythagoreanism's preamble. The acusmatici and mathematici split (SEP §3.4) is a source-only point with no claim.

## Plato

- Title: Plato
- Description: Athenian philosopher, founder of the Academy, and the source of the Platonic tradition the later pages follow.
- Claims: plato.born, plato.active-at.athens, plato.active-at.syracuse, plato.active-at.tarentum, plato.influenced-by.pythagoreans, plato.founder-of.academy, plato.died, republic.attributed-to.plato, timaeus.attributed-to.plato
- Sources: diogenes-laertius-lives-hicks (DL 3.1, 3.2, 3.7, 3.18, 3.41, 3.60), sep-plato (preamble), sep-archytas (§1.4, preamble), sep-philolaus (§7.2), plato-republic-jowett (preamble), rouse-ball-short-account-history-mathematics
- Links: [[academy]], [[pythagoreans]], [[athens]], [[syracuse]], [[tarentum]], [[republic]], [[timaeus]]
- Notes: Birthplace is disputed: DL 3.3 gives Aegina for some, SEP gives 429?; the claim hedges (`-0428/-0426`, Athens). The Tarentum meeting with Philolaus is a possibility, not a fact (plato.active-at.tarentum is graded B/C). The Italian journeys carry the Pythagorean link into the Timaeus and the later tradition.

## Academy

- Title: Academy
- Description: The school Plato founded near Athens around 386 BCE, which a Justinian edict closed in 529.
- Claims: academy.located-at.athens, academy.opened, academy.closed, academy.affected-by.justinian-edict, plato.founder-of.academy, neopythagoreans.influenced-by.academy, neoplatonists.active-at.athens
- Sources: mactutor-academy (preamble), sep-neoplatonism (§7), diogenes-laertius-lives-hicks (DL 3.7, 3.41), sep-pythagoreanism (§4.1)
- Links: [[plato]], [[athens]], [[justinian-edict]], [[proclus]], [[neopythagoreans]]
- Notes: Covers the early Academy (Speusippus, Xenocrates, SEP §4.1) and the 529 end only as the graph supports. The graph holds no claim that Proclus headed the Academy; see Gaps.

## Neopythagoreans

- Title: Neopythagoreans
- Description: Platonists and Pythagorean revivalists of roughly the first two centuries CE who read number and the Monad into Plato.
- Claims: neopythagoreans.influenced-by.pythagoras, neopythagoreans.influenced-by.plato, neopythagoreans.influenced-by.academy, neopythagoreans.active-at.alexandria, neopythagoreans.active-at.rome, neopythagoreans.active-at.apamea, nicomachus.floruit, nicomachus.member-of.neopythagoreans, numenius.active-at.apamea, numenius.member-of.neopythagoreans, moderatus.floruit, moderatus.member-of.neopythagoreans, plotinus.influenced-by.numenius
- Sources: sep-pythagoreanism (§4, §4.3, §4.4, §4.5), sep-numenius (preamble, §1, §2, §3, §5), rouse-ball-short-account-history-mathematics (p. 78)
- Links: [[nicomachus]], [[numenius]], [[moderatus]], [[plotinus]], [[pythagoras]], [[gerasa]], [[gades]], [[apamea]]
- Notes: Nicomachus, Numenius and Moderatus appear in a short section each, with no pages. Numenius's On Numbers (SEP Numenius §1) feeds the topic page.

## Plotinus

- Title: Plotinus
- Description: Third-century philosopher, student of Ammonius Saccas at Alexandria, who taught at Rome and is counted as the founder of Neoplatonism.
- Claims: plotinus.born, plotinus.student-of.ammonius-saccas, plotinus.active-at.alexandria, plotinus.active-at.rome, plotinus.influenced-by.numenius, plotinus.influenced-by.plato, plotinus.founder-of.neoplatonists, plotinus.died, enneads.attributed-to.plotinus, enneads.composed, ammonius-saccas.active-at.alexandria
- Sources: porphyry-life-of-plotinus-mackenna (pp. 2, 3, 4, 14, 24), eunapius-lives-wright (p. 353), sep-plotinus (preamble, §1, §5, §7), sep-neoplatonism (§1)
- Links: [[porphyry]], [[ammonius-saccas]], [[numenius]], [[enneads]], [[life-of-plotinus]], [[lycopolis]], [[alexandria]], [[rome]], [[neoplatonists]]
- Notes: Birth at Lycopolis rests on Porphyry and Eunapius; the date is a one-year range. Porphyry arranged the Enneads into six groups of nine (SEP Plotinus preamble), which ties him to the number topic. The One, Intellect and Soul (SEP §4, §6, §7) are source-only, with no claims.

## Porphyry

- Title: Porphyry
- Description: Plotinus's student and editor, born at Tyre, who wrote the Life of Plotinus and arranged the Enneads.
- Claims: porphyry.born, porphyry.active-at.athens, porphyry.student-of.plotinus, porphyry.active-at.rome, porphyry.active-at.lilybaeum, porphyry.influenced-by.plotinus, porphyry.member-of.neoplatonists, porphyry.died, life-of-plotinus.attributed-to.porphyry, life-of-plotinus.composed, iamblichus.student-of.porphyry
- Sources: porphyry-life-of-plotinus-mackenna (pp. 2, 4, 5, 12), eunapius-lives-wright (pp. 353, 357, 361), sep-porphyry (preamble, §1), sep-plotinus (§1), sep-pythagoreanism (§4.4)
- Links: [[plotinus]], [[iamblichus]], [[tyre]], [[athens]], [[rome]], [[lilybaeum]], [[life-of-plotinus]], [[nicomachus]]
- Notes: Death year is `0305?`, uncertain. Life of Plotinus is dated 0301. Porphyry's Pythagorean writings (SEP Pythagoreanism §4.4) belong to the number topic.

## Iamblichus

- Title: Iamblichus
- Description: Born at Chalcis around 242, student of Porphyry and teacher at Apamea, who made Pythagorean mathematics and theurgy part of Platonism.
- Claims: iamblichus.born, iamblichus.student-of.porphyry, iamblichus.influenced-by.porphyry, iamblichus.active-at.apamea, iamblichus.member-of.neoplatonists, iamblichus.died, on-the-pythagorean-way-of-life.attributed-to.iamblichus, proclus.influenced-by.iamblichus
- Sources: eunapius-lives-wright (p. 363), sep-iamblichus (preamble, §1.1, §1.2, §2.1, §3.1, §4, §6.3), iamblichus-pythagoric-life-taylor (ch. V, ch. XXXV), sep-porphyry (§1)
- Links: [[porphyry]], [[proclus]], [[chalcis]], [[apamea]], [[on-the-pythagorean-way-of-life]], [[nicomachus]]
- Notes: Dates are approximate (`0242~`, `0325~`). SEP calls him the second founder of Neoplatonism (§2.1). His Pythagorean Life is both a source for Pythagoras and a work of this tradition; the drafter says which use a passage makes.

## Proclus

- Title: Proclus
- Description: Born at Constantinople in 412, a Platonist at Athens until his death in 485, and author of the Elements of Theology.
- Claims: proclus.born, proclus.active-at.xanthus, proclus.active-at.alexandria, proclus.active-at.athens, proclus.influenced-by.iamblichus, proclus.member-of.neoplatonists, proclus.died, elements-of-theology.attributed-to.proclus
- Sources: marinus-life-of-proclus-guthrie (Marinus 6, 9, 10, 36), sep-proclus (preamble, §1.1, §1.2), proclus-elements-of-theology-taylor (ET 129), sep-neoplatonism (§1, §7)
- Links: [[iamblichus]], [[academy]], [[athens]], [[alexandria]], [[xanthus]], [[constantinople]], [[elements-of-theology]], [[justinian-edict]]
- Notes: Marinus is a student's biography, so tone and miracles are his. The 529 closing falls after Proclus's death; do not tie him to it.

## Number Mysticism from Pythagoras to Proclus

- Title: Number Mysticism from Pythagoras to Proclus
- Description: How the Pythagorean claim that things are numbers passed through Plato, the Neopythagoreans and the Neoplatonists to Proclus.
- Claims: pythagoras.founder-of.pythagoreans, philolaus.member-of.pythagoreans, nicomachus.member-of.neopythagoreans, numenius.member-of.neopythagoreans, moderatus.member-of.neopythagoreans, porphyry.influenced-by.plotinus, iamblichus.student-of.porphyry, proclus.influenced-by.iamblichus, enneads.composed, on-the-pythagorean-way-of-life.attributed-to.iamblichus, elements-of-theology.attributed-to.proclus
- Sources: sep-pythagoras (§2.2, §4; Monad and Indefinite Dyad, DL 8.25), sep-philolaus (preamble, §7), sep-archytas (preamble), sep-pythagoreanism (§2.4, §4.3, §4.4), sep-numenius (§1, §3), sep-plotinus (preamble, §5), sep-iamblichus (§3.1, §4.1, §4.2), sep-proclus (§3), iamblichus-pythagoric-life-taylor (the tetractys oath and Taylor's note on the tetractys), plato-republic-jowett (the mathematical studies)
- Links: [[pythagoras]], [[pythagoreans]], [[plato]], [[neopythagoreans]], [[plotinus]], [[porphyry]], [[iamblichus]], [[proclus]], [[nicomachus]], [[numenius]]
- Notes: Order the page by the person chain above. The graph has no claim about any doctrine, so every doctrinal statement rests on a source passage, cited through `data/citations/`, not on a new claim. Distinguish what Philolaus argued (limit, unlimited, ratio) from what later authors attribute to Pythagoras (Monad and Dyad as principles). Porphyry's arithmetical arrangement of the Enneads is the clearest case of the topic inside a book's structure. Plotinus's eidetic numbers (SEP Plotinus §5) and Iamblichus's Monad-Dyad-Triad (SEP Iamblichus §3.1, §4.1) are the two Neoplatonic turns. Section locators were taken from the library text.md headings, since `vp run search` could not run in the library checkout (missing dependencies); the drafter should confirm each locator.

## Augustine

- Title: Augustine
- Description: Bishop of Hippo, born at Thagaste in 354, who read the books of the Platonists at Milan and brought Neoplatonism into Latin Christian thought.
- Claims: augustine.born, augustine.active-at.thagaste, augustine.active-at.carthage, augustine.active-at.rome, augustine.active-at.milan, augustine.active-at.hippo, augustine.died, augustine.influenced-by.paul, augustine.influenced-by.plato, augustine.influenced-by.plotinus, augustine.influenced-by.porphyry, augustine.influenced-by.neoplatonists, augustine.critiques.porphyry, augustine.critiques.neoplatonists, confessions.attributed-to.augustine, confessions.composed, city-of-god.attributed-to.augustine, city-of-god.composed, city-of-god.critiques.neoplatonists, city-of-god.critiques.porphyry, boethius.influenced-by.augustine
- Sources: sep-augustine (preamble, §1, §2, §4), eor-augustine-hippo (preamble), augustine-confessions-pusey (bk. IV, bk. V, bk. VII, bk. VIII), augustine-city-of-god-dods (CG 8.5, CG 8.9, CG 8.10, CG 10.29, CG 10.32), sep-neoplatonism (§1, §8), sep-porphyry (§2)
- Links: [[confessions]], [[city-of-god]], [[plotinus]], [[porphyry]], [[plato]], [[neoplatonists]], [[paul]], [[thagaste]], [[carthage]], [[rome]], [[milan]], [[hippo]], [[boethius]]
- Notes: `augustine.active-at.rome` is graded C, and two of its three sources do not support it: the sep-augustine §1 excerpt names Ostia, not Rome, and the Confessions bk. V line ("and I to Rome") is his first voyage of 383, not 387/388. Present the Rome stay cautiously, as a return to Rome after the 387 baptism and Monnica's death, resting on eor-augustine-hippo (preamble, "Returning to Rome, Augustine immersed himself in writing"); give no firm year. Which works made up the "books of the Platonists" is debated (Plotinus or Porphyry, sep-augustine §4); say so. `augustine.critiques.porphyry` and `augustine.critiques.neoplatonists` rest on the same City of God passages (CG 10.29, 10.32) as `city-of-god.critiques.porphyry` and `city-of-god.critiques.neoplatonists`; state each critique once, through the City of God. Search labels Confessions passages `preamble`; bk. IV and bk. V are the locators the stored claims use, and bk. VII and bk. VIII are the books the hits' headings showed for the Platonist books and the conversion. The anecdote that he died with a word of Plotinus on his lips (sep-augustine §1, after Possidius) is source-only.

## Boethius

- Title: Boethius
- Description: Roman aristocrat under Theoderic who translated Aristotle and Porphyry into Latin and wrote the Consolation of Philosophy while awaiting execution.
- Claims: boethius.born, boethius.active-at.pavia, boethius.died, boethius.influenced-by.plato, boethius.influenced-by.porphyry, boethius.influenced-by.iamblichus, boethius.influenced-by.neoplatonists, boethius.influenced-by.augustine, boethius.influenced-by.proclus, consolation-of-philosophy.attributed-to.boethius, consolation-of-philosophy.composed, consolation-of-philosophy.influenced-by.timaeus, consolation-of-philosophy.quotes.timaeus, consolation-of-philosophy.quotes.republic, consolation-of-philosophy.influenced-by.proclus, consolation-of-philosophy.influenced-by.neoplatonists
- Sources: sep-boethius (preamble, §1, §2, §4, §5, §6, §7, §8), boethius-consolation-james (preamble, bk. I, bk. III, ch. III under BOOK I, ch. IV, ch. VI under BOOK V), sep-porphyry (§3.4.1), sep-iamblichus (§4.2), sep-proclus (§3.4), rouse-ball-short-account-history-mathematics (p. 110)
- Links: [[consolation-of-philosophy]], [[plato]], [[timaeus]], [[republic]], [[porphyry]], [[iamblichus]], [[proclus]], [[augustine]], [[neoplatonists]], [[pavia]], [[aristotle]]
- Notes: Excerpts located at consolation-of-philosophy `bk. V` come from H. R. James's translator back matter (epilogue and reference list), not Boethius's text; never attribute those words to Boethius. That touches the bk. V sources of `consolation-of-philosophy.composed` and `consolation-of-philosophy.quotes.republic`; for the quote, use the bk. I source. Search prints Consolation locators as `ch. N` with a `BOOK N. / N.` heading; cite them as printed. The Proclus influence is a scholarly view (`boethius.influenced-by.proclus` graded C, stance `reports`; the Consolation claim graded B); present it as such. Dates are approximate (`0475~/0477~`, `0526?`). Rome and Ravenna appear in sep-boethius §1 but the graph holds no Rome claim for him; see Gaps. The translation programme and the logical commentaries (sep-boethius §2, §8) are source-only.

## Pseudo-Dionysius

- Title: Pseudo-Dionysius
- Description: Christian author of about 485 to 528 who wrote under the name of Dionysius the Areopagite and drew on Proclus.
- Claims: pseudo-dionysius.floruit, pseudo-dionysius.member-of.neoplatonists, pseudo-dionysius.influenced-by.proclus, pseudo-dionysius.influenced-by.plotinus, pseudo-dionysius.student-of.proclus, divine-names.attributed-to.pseudo-dionysius, divine-names.composed, divine-names.influenced-by.proclus
- Sources: sep-pseudo-dionysius-areopagite (preamble, §1, §3.2, §3.4, §4.1, §5), pseudo-dionysius-works-parker (Chapter_1, DN 1.1, DN 3.2, MT 1.1, MT 1.2), sep-proclus (§4), sep-neoplatonism (§8)
- Links: [[divine-names]], [[proclus]], [[plotinus]], [[neoplatonists]], [[paul]], [[athens]]
- Notes: Treat the author as a pseudonymous writer. `divine-names.attributed-to.pseudo-dionysius` cites a salutation in which the persona names himself "Dionysius the Presbyter" (Parker, Chapter_1); that is the persona's voice, not evidence of the author's identity. The persona of Paul's Athenian convert is set out in SEP §1. `pseudo-dionysius.student-of.proclus` is graded B on one SEP passage; present it as a scholarly view, not a fact. The darkness and unknowing passages of the Mystical Theology (MT 1.1, 1.2; SEP §3.4) are source-only, since the work has no entity.

## The Theology of Aristotle

- Title: The Theology of Aristotle
- Description: Ninth-century Arabic paraphrase of parts of Plotinus's Enneads IV to VI, made in al-Kindi's circle and circulated under Aristotle's name, and the translation movement that produced it.
- Claims: theology-of-aristotle.translates.enneads, theology-of-aristotle.attributed-to.aristotle, theology-of-aristotle.composed, theology-of-aristotle.influenced-by.aristotle, theology-of-aristotle.influenced-by.elements-of-theology, enneads.attributed-to.plotinus, al-kindi.influenced-by.theology-of-aristotle, al-farabi.influenced-by.theology-of-aristotle, ibn-sina.influenced-by.theology-of-aristotle
- Sources: sep-theology-aristotle (preamble, §1, §2, §3, §4.2, §5), sep-arabic-islamic-greek (preamble, §1, §2, §3, §5), sep-neoplatonism (§8)
- Links: [[enneads]], [[plotinus]], [[aristotle]], [[al-kindi]], [[al-farabi]], [[ibn-sina]], [[elements-of-theology]], [[proclus]], [[porphyry]], [[baghdad]]
- Notes: Present the attribution to Aristotle as a historical misattribution, not authorship. `theology-of-aristotle.attributed-to.aristotle` is graded B and every one of its sources has stance `disputes`: the preface calls the work "the book of Aristotle" (sep-theology-aristotle §2), SEP Arabic and Islamic Greek §3 lists it among Neoplatonic works falsely attributed to Aristotle, and sep-neoplatonism §8 calls it pseudo-epigraphical. Whether the misattribution was intentional is open (§2). The text is a paraphrase of passages from Enneads IV, V and VI, not in the Enneads' order (§1). The preface's mention of "the exposition of Porphyry of Syria" may be quoted as what the preface says, but Porphyry as its author is a hypothesis with no claim; see Gaps. The Proclus influence is graded C, stance `reports`. The translation movement (the Syriac background, the early translations, al-Kindi's circle, the Baghdad Aristotelians; sep-arabic-islamic-greek §1, §2, §3, §5) is told here from sources only, since the graph has no entity or claim for it; there is no House of Wisdom entity. The Arabic Proclus (Book on the Pure Good, Liber de causis; sep-theology-aristotle §1, sep-arabic-islamic-greek §3) is source-only.

## al-Kindi

- Title: al-Kindi
- Description: Ninth-century philosopher at Baghdad, called the philosopher of the Arabs, whose circle put Aristotle and the Neoplatonists into Arabic.
- Claims: al-kindi.born, al-kindi.active-at.baghdad, al-kindi.floruit, al-kindi.died, al-kindi.influenced-by.aristotle, al-kindi.influenced-by.neoplatonists, al-kindi.influenced-by.porphyry, al-kindi.influenced-by.proclus, al-kindi.influenced-by.theology-of-aristotle
- Sources: sep-al-kindi (preamble, §1.1, §2.1, §2.2, §3.2), sep-arabic-islamic-greek (§3), sep-theology-aristotle (§2, §3), sep-neoplatonism (§8)
- Links: [[theology-of-aristotle]], [[aristotle]], [[proclus]], [[porphyry]], [[neoplatonists]], [[baghdad]], [[basra]]
- Notes: Dates are approximate (`0800~`, `0870~`); his floruit (0833/0842) matches the dating of the Theology. SEP §1.1 says he was born in Basra and educated in Baghdad; the graph holds no birthplace, so mention Basra from the source only. The Theology's preface says al-Kindi corrected the translation for Ahmad ibn al-Mu'tasim (sep-theology-aristotle §2); the graph has no claim for that, so cite the passage, and see Gaps. The Proclus influence is graded B and one source only reports it.

## al-Farabi

- Title: al-Farabi
- Description: Philosopher of Baghdad and Damascus, born about 870, who built on Aristotle's logic and on Plato's Republic and was read closely by Ibn Sina.
- Claims: al-farabi.born, al-farabi.active-at.baghdad, al-farabi.active-at.damascus, al-farabi.died, al-farabi.influenced-by.aristotle, al-farabi.influenced-by.plato, al-farabi.influenced-by.republic, al-farabi.influenced-by.neoplatonists, al-farabi.influenced-by.theology-of-aristotle, ibn-sina.influenced-by.al-farabi, al-ghazali.critiques.al-farabi, incoherence-of-the-philosophers.critiques.al-farabi, ibn-rushd.critiques.al-farabi
- Sources: sep-al-farabi (preamble, §1, §3, §5, §6, §7), sep-arabic-islamic-greek (preamble, §5), sep-neoplatonism (§8), sep-theology-aristotle (§5), sep-al-ghazali (§2, §3), eor-ghazali (preamble), sep-ibn-rushd (§2)
- Links: [[aristotle]], [[plato]], [[republic]], [[theology-of-aristotle]], [[neoplatonists]], [[ibn-sina]], [[al-ghazali]], [[incoherence-of-the-philosophers]], [[ibn-rushd]], [[baghdad]], [[damascus]]
- Notes: `al-ghazali.critiques.al-farabi` and `incoherence-of-the-philosophers.critiques.al-farabi` say the same thing from the same passage (sep-al-ghazali §3); state it once, through the Incoherence. The name is printed truncated as "al-F’s" in sep-al-ghazali §3, an artefact of the source; a drafter quoting that passage must not fix it inside quotation marks, and should quote around it or paraphrase. Birth year is approximate (`0870~`); SEP preamble gives a birthplace, Farab or Farayb, with no claim or entity (see Gaps). The Republic link is graded B.

## Ibn Sina

- Title: Ibn Sina
- Description: Philosopher born near Bukhara in the 970s who wrote the Book of Healing, worked at Hamadan and Isfahan, and died in 1037.
- Claims: ibn-sina.born, ibn-sina.active-at.bukhara, ibn-sina.active-at.hamadan, ibn-sina.active-at.isfahan, ibn-sina.died, ibn-sina.buried-at.hamadan, ibn-sina.influenced-by.aristotle, ibn-sina.influenced-by.al-farabi, ibn-sina.influenced-by.theology-of-aristotle, ibn-sina.influenced-by.neoplatonists, book-of-healing.attributed-to.ibn-sina, book-of-healing.composed, book-of-healing.influenced-by.aristotle, al-ghazali.influenced-by.ibn-sina, al-ghazali.critiques.ibn-sina, incoherence-of-the-philosophers.critiques.ibn-sina, ibn-rushd.critiques.ibn-sina
- Sources: sep-ibn-sina (preamble, §1.1, §1.2, §2, §4), sep-arabic-islamic-greek (preamble, §4), sep-theology-aristotle (§5), sep-neoplatonism (§8), sep-al-ghazali (§3, §5, §6), eor-ghazali (preamble), sep-ibn-rushd (§6.1)
- Links: [[book-of-healing]], [[aristotle]], [[al-farabi]], [[theology-of-aristotle]], [[neoplatonists]], [[al-ghazali]], [[incoherence-of-the-philosophers]], [[ibn-rushd]], [[bukhara]], [[hamadan]], [[isfahan]]
- Notes: `al-ghazali.critiques.ibn-sina` sits beside `incoherence-of-the-philosophers.critiques.ibn-sina`; state the critique once, through the Incoherence. Al-Ghazali both attacked him and drew on him (sep-al-ghazali §5, §6); give both sides. SEP §1.1 places his birth in Afshana near Bukhara, from his Autobiography; birth decade (`097X`) and the Hamadan to Isfahan move (`1024?`) are uncertain. The Book of Healing's date (`1024?/1037`) is graded B.

## al-Ghazali

- Title: al-Ghazali
- Description: Theologian of Tus who taught at Baghdad, left his post for the Sufi path, and attacked Ibn Sina and al-Farabi in The Incoherence of the Philosophers.
- Claims: al-ghazali.born, al-ghazali.active-at.baghdad, al-ghazali.active-at.damascus, al-ghazali.active-at.tus, al-ghazali.active-at.nishapur, al-ghazali.died, al-ghazali.member-of.sufism, al-ghazali.influenced-by.sufism, al-ghazali.influenced-by.aristotle, al-ghazali.influenced-by.ibn-sina, al-ghazali.critiques.ibn-sina, al-ghazali.critiques.al-farabi, incoherence-of-the-philosophers.attributed-to.al-ghazali, incoherence-of-the-philosophers.composed, incoherence-of-the-philosophers.critiques.ibn-sina, incoherence-of-the-philosophers.critiques.al-farabi, ibn-rushd.influenced-by.al-ghazali, ibn-rushd.critiques.al-ghazali
- Sources: sep-al-ghazali (preamble, §1, §2, §3, §4, §5, §6, §7.3), eor-ghazali (preamble), eor-sufism (preamble)
- Links: [[incoherence-of-the-philosophers]], [[ibn-sina]], [[al-farabi]], [[aristotle]], [[sufism]], [[ibn-rushd]], [[incoherence-of-the-incoherence]], [[tus]], [[nishapur]], [[baghdad]], [[damascus]]
- Notes: Two pairs of claims overlap. `al-ghazali.critiques.ibn-sina` sits beside `incoherence-of-the-philosophers.critiques.ibn-sina` (and the same for al-Farabi), and `al-ghazali.influenced-by.sufism` beside `al-ghazali.member-of.sufism`; state each fact once. "al-F’s" is printed truncated in sep-al-ghazali §3, an artefact of the source; do not fix it inside quotation marks, quote around it or paraphrase. The Incoherence's twenty discussions (sep-al-ghazali §3) are source-only. The Tus span (`1097~/1111`) is graded B.

## Ibn Rushd

- Title: Ibn Rushd
- Description: Andalusian philosopher, physician and judge (1126 to 1198) who commented on Aristotle and answered al-Ghazali in The Incoherence of the Incoherence.
- Claims: ibn-rushd.born, ibn-rushd.active-at.marrakesh, ibn-rushd.died, ibn-rushd.influenced-by.aristotle, ibn-rushd.influenced-by.al-ghazali, ibn-rushd.critiques.al-ghazali, ibn-rushd.critiques.ibn-sina, ibn-rushd.critiques.al-farabi, incoherence-of-the-incoherence.attributed-to.ibn-rushd, incoherence-of-the-incoherence.critiques.incoherence-of-the-philosophers, incoherence-of-the-incoherence.critiques.al-ghazali
- Sources: sep-ibn-rushd (preamble, §1.1, §1.2, §2, §6.1, §9.2, §9.3), sep-al-ghazali (preamble, §3, §4), sep-arabic-islamic-greek (§5), eor-islam-north-africa (preamble), eor-ghazali (preamble)
- Links: [[incoherence-of-the-incoherence]], [[incoherence-of-the-philosophers]], [[al-ghazali]], [[aristotle]], [[ibn-sina]], [[al-farabi]], [[marrakesh]]
- Notes: `ibn-rushd.critiques.al-ghazali` and `incoherence-of-the-incoherence.critiques.al-ghazali` cover the same reply; state it once, through the book. He took al-Ghazali's rule for reconciling reason and revelation but rejected his findings (sep-al-ghazali §4); that is why the graph holds both `influenced-by` and `critiques`. The death year is graded B, one source reporting it. His exile at Lucena near Cordova (sep-ibn-rushd §1.1) is source-only; the graph has no Cordoba claim for him. The page closes the collection; a short pointer to his Hebrew and Latin reception (§9.2, §9.3) may end it, with no claims.

## Gaps

- Entities missing from the graph: none blocks a page. Useful additions: Eudorus, Speusippus and Xenocrates (Neopythagoreans, Academy), Syrianus (Proclus's teacher at Athens), Marinus and Eunapius (authors the sources rest on), Hippolytus. Nicomachus's Introduction to Arithmetic and Porphyry's Pythagorean writings have no work entity.
- Entities missing for the later groups: mystical-theology (work, Pseudo-Dionysius; MT passages cited on his page), liber-de-causis or book-on-the-pure-good (work, the Arabic Proclus; sep-theology-aristotle §1), ravenna (place, Boethius; sep-boethius §1), farab (place, al-Farabi's birthplace; sep-al-farabi preamble), afshana (place, Ibn Sina's birthplace; sep-ibn-sina §1.1), lucena (place, Ibn Rushd's exile; sep-ibn-rushd §1.1), ibn-naima-al-himsi (person, translator of the Theology; sep-theology-aristotle §2).
- Sources missing from the library or graph: `data/sources/plotinus-enneads-mackenna.yaml` now exists, but no claim cites it yet. Nothing in the library covers the aftermath of 529 beyond SEP Neoplatonism §7.
- Sources missing for the later groups: no translation of al-Ghazali's Incoherence of the Philosophers, Ibn Rushd's Incoherence of the Incoherence, Ibn Sina's Book of Healing, al-Farabi or al-Kindi, nor of the Theology of Aristotle (Lewis's English version in Henry and Schwyzer's Plotini Opera II) is in the library, so the Arabic pages rest on SEP and the Encyclopedia of Religion only. No library text states Ibn Rushd's birth at Cordoba.
- Claims the graph lacks: (1) Proclus studying under Syrianus and Plutarch at Athens, or leading the school (Marinus 10; sep-proclus §1.1); (2) any number doctrine, for example Philolaus on number and harmony (sep-philolaus preamble) and the Monad and Dyad in the Pythagorean Memoirs (sep-pythagoras §4, DL 8.25); (3) Porphyry arranging the Enneads in six groups of nine (sep-plotinus preamble); (4) Iamblichus writing an Introduction to Arithmetic on Nicomachus (sep-iamblichus §1.2); (5) Numenius's On Numbers (sep-numenius §1); (6) neoplatonists influenced-by pythagoreans.
- Claims the graph lacks for the later groups: (1) disputed attribution: theology-of-aristotle attributed-to porphyry, held back in the M1 audit and not in the graph; the preface names "the exposition of Porphyry of Syria" (sep-theology-aristotle §2), and Porphyry as author of the source the Arabic paraphrase adapts is a scholarly hypothesis, so it needs its own audit with stance `reports` or `disputes`; (2) theology-of-aristotle translates or is edited by al-kindi: the preface says it was "corrected for Ahmad ibn al-Mu‘tasim by al-Kindi" (sep-theology-aristotle §2); (3) al-kindi born where basra: "He was born in Basra and educated in Baghdad" (sep-al-kindi §1.1); (4) boethius active-at rome: the old families "keep up their traditions in Rome" while Theoderic ruled from Ravenna (sep-boethius §1); (5) boethius translates or comments-on aristotle and porphyry: "Boethius's translations of Aristotle and Porphyry ... remained standard" (sep-boethius §8); (6) al-farabi born where farab: "probably born in 870 ... in a place called Farab or Farayb" (sep-al-farabi preamble); (7) ibn-rushd comments-on aristotle: the commentaries (sep-ibn-rushd preamble, §9.2); (8) ibn-rushd born where cordoba, which no library text states; (9) mystical-theology attributed-to pseudo-dionysius (sep-pseudo-dionysius-areopagite §3.4), once the work entity exists.
- Thin pages: Academy has four own claims and two sources, and the number topic has no direct claims. Pythagoras rests on late sources (Diogenes Laertius, Iamblichus), so the page leans on SEP for judgment.
