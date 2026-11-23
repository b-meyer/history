# Wiki plan: platonism

Scope: Hub collection on the Pythagorean and Platonic line from Pythagoras to Proclus, ending with the closing of the Academy in 529. Ten pages: the hub, nine entity articles and one topic page on number mysticism. Minor figures (Nicomachus, Numenius, Moderatus, Philolaus, Archytas, Ammonius Saccas) and the Neoplatonists school are record-only: pages mention them and link to the graph, none gets its own page.

Folder: `apps/site/src/pages/wiki/platonism/`. No page for any of these entities exists elsewhere, so no entity is shared.

| Page                                        | Path                          | Entity or topic       | Group                      | Order |
| ------------------------------------------- | ----------------------------- | --------------------- | -------------------------- | ----- |
| Platonism                                   | platonism/index.md            | topic: the collection | Overview                   | 0     |
| Pythagoras                                  | platonism/Pythagoras.md       | pythagoras            | Pythagorean Beginnings     | 10    |
| Pythagoreans                                | platonism/Pythagoreans.md     | pythagoreans          | Pythagorean Beginnings     | 20    |
| Plato                                       | platonism/Plato.md            | plato                 | Plato and the Academy      | 30    |
| Academy                                     | platonism/Academy.md          | academy               | Plato and the Academy      | 40    |
| Neopythagoreans                             | platonism/Neopythagoreans.md  | neopythagoreans       | Between Plato and Plotinus | 50    |
| Plotinus                                    | platonism/Plotinus.md         | plotinus              | Late Platonists            | 60    |
| Porphyry                                    | platonism/Porphyry.md         | porphyry              | Late Platonists            | 70    |
| Iamblichus                                  | platonism/Iamblichus.md       | iamblichus            | Late Platonists            | 80    |
| Proclus                                     | platonism/Proclus.md          | proclus               | Late Platonists            | 90    |
| Number Mysticism from Pythagoras to Proclus | platonism/Number-Mysticism.md | topic                 | Themes                     | 100   |

## Platonism (index.md)

- Title: Platonism
- Description: A guide to the Pythagorean and Platonic line from Pythagoras at Croton to Proclus and the closing of the Athenian Academy in 529.
- Claims: pythagoras.founder-of.pythagoreans, plato.founder-of.academy, plotinus.founder-of.neoplatonists, academy.closed, academy.affected-by.justinian-edict, neoplatonists.active-at.athens
- Sources: sep-neoplatonism (preamble, §1, §7), sep-pythagoreanism (§4), mactutor-academy (preamble)
- Links: [[pythagoras]], [[pythagoreans]], [[plato]], [[academy]], [[neopythagoreans]], [[plotinus]], [[porphyry]], [[iamblichus]], [[proclus]], [[neoplatonists]], [[justinian-edict]]
- Notes: Hub overview only: a timeline of the nine articles in order, then one paragraph on the number-mysticism thread with a link to the topic page. Shows the teacher-to-student chain (Plotinus, Porphyry, Iamblichus, Proclus) from the stored `student-of` and `influenced-by` claims. [[neoplatonists]] is linked, not given a page.

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

## Gaps

- Entities missing from the graph: none blocks a page. Useful additions: Eudorus, Speusippus and Xenocrates (Neopythagoreans, Academy), Syrianus (Proclus's teacher at Athens), Marinus and Eunapius (authors the sources rest on), Hippolytus. Nicomachus's Introduction to Arithmetic and Porphyry's Pythagorean writings have no work entity.
- Sources missing from the library or graph: `data/sources/` has no entry for plotinus-enneads-mackenna although the library holds its text.md, so the Enneads cannot yet be cited directly on the Plotinus or number pages. Nothing in the library covers the aftermath of 529 beyond SEP Neoplatonism §7.
- Claims the graph lacks: (1) Proclus studying under Syrianus and Plutarch at Athens, or leading the school (Marinus 10; sep-proclus §1.1); (2) any number doctrine, for example Philolaus on number and harmony (sep-philolaus preamble) and the Monad and Dyad in the Pythagorean Memoirs (sep-pythagoras §4, DL 8.25); (3) Porphyry arranging the Enneads in six groups of nine (sep-plotinus preamble); (4) Iamblichus writing an Introduction to Arithmetic on Nicomachus (sep-iamblichus §1.2); (5) Numenius's On Numbers (sep-numenius §1); (6) neoplatonists influenced-by pythagoreans.
- Thin pages: Academy has four own claims and two sources, and the number topic has no direct claims. Pythagoras rests on late sources (Diogenes Laertius, Iamblichus), so the page leans on SEP for judgment.
