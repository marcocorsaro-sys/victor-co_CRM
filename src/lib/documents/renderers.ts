import type { AgencySettings } from '../supabase'
import type { DocumentTemplate } from './types'
import { PdfBuilder } from './pdfBuilder'

/** Estrae stringa o "—" per default. */
const s = (v: unknown): string => {
  if (v === undefined || v === null) return '—'
  if (typeof v === 'boolean') return v ? 'Sì' : 'No'
  return String(v)
}

const eur = (v: unknown): string => {
  if (v === undefined || v === null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (isNaN(n)) return String(v)
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
}

const date = (v: unknown): string => {
  if (!v || typeof v !== 'string') return '—'
  try { return new Date(v).toLocaleDateString('it-IT') } catch { return v }
}

type RenderInput = {
  template: DocumentTemplate
  data: Record<string, unknown>
  agency: AgencySettings | null
}

// ────────────────────────────────────────────────────────────────────────────
// PRIVACY (Mod. 00 – Rev. 2021/01 FIAIP)
// ────────────────────────────────────────────────────────────────────────────
async function renderPrivacy({ template, data, agency }: RenderInput): Promise<Uint8Array> {
  const b = await PdfBuilder.create({ title: template.title, agency })
  b.title('INFORMATIVA E CONSENSO PRIVACY')
  b.paragraph(`Egr. Sig./Gent.ma Sig.ra ${s(data.cliente_nome_completo)}`, { bold: true, spaceAfter: 8 })
  b.paragraph(
    'Oggetto: Informativa ai sensi degli art. 13 e 14 del Regolamento Generale sulla Protezione dei Dati UE 679/2016 (GDPR).',
    { spaceAfter: 8 }
  )

  b.subtitle('1. Titolare del trattamento')
  b.twoColumnTable([
    { label: 'Titolare', value: s(data.agenzia_full_name) },
    { label: 'Sede legale', value: `${s(data.agenzia_sede)}, ${s(data.agenzia_citta)}` },
    { label: 'P.IVA', value: s(agency?.partita_iva) },
    { label: 'PEC', value: s(agency?.pec) },
  ])

  b.subtitle('2. Dati personali oggetto di trattamento')
  b.paragraph(
    "Ai fini dell'attività di consulenza e mediazione immobiliare utilizziamo dati identificativi, recapiti " +
    '(indirizzo, telefono, e-mail), dati relativi all\'immobile, alla capacità economica, certificati catastali ' +
    'e di provenienza immobiliare, dati relativi alla composizione del nucleo familiare.'
  )

  b.subtitle('3. Finalità e base giuridica del trattamento')
  b.paragraph(
    'I dati saranno raccolti dal nostro personale e collaboratori, anche per via informatica, per esplicare l\'attività ' +
    'di mediazione immobiliare, dare esecuzione al servizio richiesto, verificare l\'andamento dei rapporti contrattuali ' +
    'e i rischi connessi. Il conferimento ha natura obbligatoria: senza di esso non saremmo in grado di adempiere ' +
    'all\'incarico/mandato.'
  )

  b.subtitle('4. Destinatari')
  b.paragraph(
    'I dati saranno resi conoscibili al nostro personale interno e ai collaboratori esterni; saranno comunicati a fornitori ' +
    'di servizi (società di servizi informatici, consulenti, assicurazioni) ed enti pubblici per accertamenti su catasto, ' +
    'ufficio tecnico e altri registri.'
  )

  b.subtitle('5. Conservazione dei dati')
  b.paragraph(
    'I dati personali saranno conservati per il tempo strettamente necessario al conseguimento delle finalità indicate, ' +
    'nel rispetto dei principi di liceità, correttezza, pertinenza e proporzionalità.'
  )

  b.subtitle('6. I suoi diritti')
  b.paragraph(
    "Ai sensi degli artt. 15-21 GDPR ha diritto di accesso, rettifica, oblio, limitazione, portabilità, opposizione e di " +
    'reclamo all\'Autorità Garante. Per esercitarli può rivolgersi al Titolare del trattamento ai recapiti sopra indicati.'
  )

  b.spacer(12)
  b.subtitle('Consensi')
  b.checkbox(
    'Autorizzo l\'Agente/Agenzia alla diffusione mediante siti internet, social network e/o pubblicazioni cartacee delle ' +
    'informazioni, foto, video e planimetrie relative all\'immobile di mia proprietà.',
    Boolean(data.consenso_diffusione)
  )
  b.checkbox(
    'Autorizzo l\'Agente/Agenzia all\'invio di materiale pubblicitario o informativo per finalità promozionali, ' +
    'statistiche e conoscitive.',
    Boolean(data.consenso_marketing)
  )

  b.spacer(16)
  b.placeAndDate(s(data.luogo_firma), date(data.data_firma))
  b.signatureLine('Firma del cliente')
  return b.save()
}

// ────────────────────────────────────────────────────────────────────────────
// ANTIRICICLAGGIO (Mod. 992/FIAIP/2022/All. 03 - D.Lgs. 231/2007 art. 22)
// ────────────────────────────────────────────────────────────────────────────
async function renderAntiriciclaggio({ template, data, agency }: RenderInput): Promise<Uint8Array> {
  const b = await PdfBuilder.create({ title: template.title, agency })
  b.title('ADEGUATA VERIFICA E DICHIARAZIONE')
  b.paragraph('Persone Fisiche — ex art. 22 D.Lgs. 231/2007', { bold: true, size: 11, spaceAfter: 8 })

  b.paragraph(
    'In ottemperanza alle disposizioni del D.Lgs. n. 231 del 21/11/2007 e successive modifiche e integrazioni, io sottoscritto ' +
    'fornisco le mie generalità e le sottostanti informazioni, assumendomi tutte le responsabilità di natura civile, ' +
    'amministrativa e penale per dichiarazioni non veritiere.'
  )

  b.subtitle('Dati del dichiarante')
  b.twoColumnTable([
    { label: 'Cognome e Nome', value: s(data.cognome_nome) },
    { label: 'Luogo e data di nascita', value: s(data.luogo_data_nascita) },
    { label: 'Indirizzo di residenza', value: s(data.indirizzo_residenza) },
    { label: 'Nazionalità', value: s(data.nazionalita) },
    { label: 'Codice fiscale', value: s(data.codice_fiscale) },
    { label: 'Professione/Attività svolta', value: s(data.professione) },
  ])

  b.subtitle('Documento di identificazione')
  b.twoColumnTable([
    { label: 'Tipo documento', value: s(data.documento_tipo) },
    { label: 'Numero', value: s(data.documento_numero) },
    { label: 'Rilasciato da', value: s(data.documento_rilasciato_da) },
    { label: 'Data rilascio', value: date(data.documento_rilascio) },
    { label: 'Data scadenza', value: date(data.documento_scadenza) },
  ])

  b.subtitle('Dichiarazioni')
  b.paragraph(`1) Il mandato/incarico conferito in data ${date(data.mandato_data)} ha ad oggetto:`)
  const oggetto = String(data.oggetto_incarico || '').toLowerCase()
  b.checkbox('Vendita di unità immobiliari', oggetto === 'vendita')
  b.checkbox('Locazione di unità immobiliari', oggetto === 'locazione')
  b.checkbox('Acquisto di unità immobiliari', oggetto === 'acquisto')
  b.checkbox('Conduzione di unità immobiliari', oggetto === 'conduzione')

  b.spacer(6)
  b.paragraph("2) Lo scopo dell'operazione oggetto dell'incarico è:")
  const scopo = String(data.scopo_operazione || '')
  b.checkbox('Esigenze di famiglia', scopo === 'famiglia')
  b.checkbox('Esigenze di impresa', scopo === 'impresa')
  b.checkbox('Finalità di investimento', scopo === 'investimento')
  b.checkbox(`Altro: ${scopo === 'altro' ? '________________' : ''}`, scopo === 'altro')

  b.spacer(6)
  b.paragraph('3) Persona politicamente esposta (PEP) ai sensi della lett. dd), art. 1, D.Lgs. 231/2007:')
  b.checkbox(`Dichiaro di essere PEP — Carica: ${s(data.pep_carica)}`, Boolean(data.pep))
  b.checkbox('Dichiaro di NON essere PEP', !data.pep)
  if (data.pep && data.provenienza_fondi) {
    b.spacer(4)
    b.paragraph(`Provenienza dei fondi/beni: ${s(data.provenienza_fondi)}`)
  }

  b.spacer(8)
  b.paragraph(
    'Il sottoscritto dichiara di aver fornito le informazioni in quanto indispensabili per l\'adempimento degli obblighi ' +
    'di adeguata verifica della clientela ex art. 18 D.Lgs. 231/2007. Dichiara altresì di essere consapevole delle ' +
    'responsabilità penali in caso di falsa o non veritiera indicazione dei dati (art. 55, comma 3, D.Lgs. 231/2007).'
  )

  b.spacer(8)
  b.placeAndDate(s(data.luogo_firma), date(data.data_firma))
  b.doubleSignature('Firma del dichiarante', `Professionista: ${s(data.professionista)}`)
  return b.save()
}

// ────────────────────────────────────────────────────────────────────────────
// INCARICO VENDITA (Mod. 09 – Rev. 2021/02 FIAIP)
// ────────────────────────────────────────────────────────────────────────────
async function renderIncaricoVendita({ template, data, agency }: RenderInput): Promise<Uint8Array> {
  const b = await PdfBuilder.create({ title: template.title, agency })
  b.title('CONFERIMENTO DI INCARICO DI MEDIAZIONE')
  b.paragraph('Per la vendita immobiliare — Mod. 09 Rev. 2021/02', { size: 10, spaceAfter: 8 })

  b.subtitle('Le parti')
  b.paragraph('Con la presente scrittura privata, tra:', { spaceAfter: 6 })

  b.paragraph(`Il/La sottoscritto/a Sig./Sig.ra ${s(data.venditore_nome)}`, { bold: true, spaceAfter: 4 })
  b.twoColumnTable([
    { label: 'Nato/a a', value: `${s(data.venditore_nato_a)}, il ${date(data.venditore_data_nascita)}` },
    { label: 'Codice fiscale', value: s(data.venditore_cf) },
    { label: 'Residenza', value: s(data.venditore_residenza) },
    { label: 'Telefono', value: s(data.venditore_telefono) },
    { label: 'Email', value: s(data.venditore_email) },
  ])
  b.paragraph('di seguito per brevità "VENDITORE"', { size: 9, spaceAfter: 6 })

  b.paragraph('e', { size: 9 })
  const ag = agency
  b.paragraph(`${s(ag?.full_name)} — di seguito per brevità "AGENTE"`, { bold: true, spaceAfter: 4 })
  b.twoColumnTable([
    { label: 'Sede', value: `${s(ag?.sede_legale_via)}, ${s(ag?.sede_legale_cap)} ${s(ag?.sede_legale_citta)} (${s(ag?.sede_legale_provincia)})` },
    { label: 'P.IVA / CF', value: `${s(ag?.partita_iva)} / ${s(ag?.codice_fiscale)}` },
    { label: 'CCIAA / REA', value: `${s(ag?.camera_commercio)} — REA n. ${s(ag?.rea)}` },
    { label: 'Iscrizione FIAIP', value: s(ag?.iscrizione_fiaip) },
    { label: 'Polizza RC', value: ag?.polizza_compagnia ? `${ag.polizza_compagnia} — n. ${s(ag.polizza_numero)} (scad. ${date(ag.polizza_scadenza)})` : '—' },
    { label: 'Agente incaricato', value: s(data.agente_nome) },
  ])

  b.subtitle('1. Oggetto dell\'incarico')
  b.paragraph(
    "Il Venditore conferisce all'Agente l'incarico in esclusiva e irrevocabile di reperire soggetti interessati " +
    "all'acquisto dell'immobile sotto descritto."
  )
  b.twoColumnTable([
    { label: 'Immobile', value: s(data.immobile_nome) },
    { label: 'Indirizzo', value: s(data.immobile_indirizzo) },
    { label: 'Scala / Piano / Interno', value: `${s(data.immobile_scala)} / ${s(data.immobile_piano)} / ${s(data.immobile_interno)}` },
    { label: 'Servito da ascensore', value: data.immobile_ascensore ? 'Sì' : 'No' },
    { label: "Destinazione d'uso", value: s(data.immobile_destinazione) },
    { label: 'Composizione', value: s(data.immobile_composizione) },
    { label: 'Superficie (mq)', value: s(data.immobile_superficie) },
    { label: 'Foglio / Particella / Sub', value: `${s(data.catasto_foglio)} / ${s(data.catasto_particella)} / ${s(data.catasto_sub)}` },
    { label: 'Categoria catastale', value: s(data.catasto_categoria) },
  ])

  b.subtitle('2. Stato locazione')
  if (data.locato_a) {
    b.twoColumnTable([
      { label: 'Locato a', value: s(data.locato_a) },
      { label: 'Canone annuo', value: eur(data.locato_canone) },
      { label: 'Scadenza contrattuale', value: date(data.locato_scadenza) },
    ])
  } else {
    b.paragraph('Libero da persone e cose al momento del rogito.', { spaceAfter: 6 })
  }

  b.subtitle('3. Prezzo richiesto')
  b.paragraph(`Il Venditore richiede un corrispettivo pari a ${eur(data.prezzo_richiesto)}.`, { bold: true, spaceAfter: 8 })

  b.subtitle('4. Durata dell\'incarico')
  b.twoColumnTable([
    { label: 'Inizio incarico', value: date(data.mandato_inizio) },
    { label: 'Fine incarico', value: date(data.mandato_fine) },
  ])

  b.subtitle('5. Compenso provvigionale')
  const provText = data.provvigione_pct
    ? `Il Venditore si obbliga a corrispondere all'Agente un compenso pari al ${data.provvigione_pct}% del prezzo di vendita, oltre IVA di legge.`
    : data.provvigione_fissa
      ? `Il Venditore si obbliga a corrispondere all'Agente un compenso fisso pari a ${eur(data.provvigione_fissa)}, oltre IVA di legge.`
      : 'Compenso da definire a separata pattuizione.'
  b.paragraph(provText)

  b.subtitle('6. Antiriciclaggio e Privacy')
  b.paragraph(
    'Il Venditore prende atto del dovere di fornire le informazioni necessarie per l\'adeguata verifica ai sensi del D.Lgs. ' +
    '231/2007 art. 22 e dichiara di aver ricevuto l\'informativa privacy ai sensi degli artt. 13-14 del Regolamento UE 679/2016.'
  )

  b.spacer(8)
  b.placeAndDate(s(data.luogo_firma), date(data.data_firma))
  b.doubleSignature('Il Venditore', "L'Agente")
  return b.save()
}

// ────────────────────────────────────────────────────────────────────────────
// PROPOSTA IRREVOCABILE DI ACQUISTO (Mod. 14 – Rev. 2021/02 FIAIP)
// ────────────────────────────────────────────────────────────────────────────
async function renderPropostaAcquisto({ template, data, agency }: RenderInput): Promise<Uint8Array> {
  const b = await PdfBuilder.create({ title: template.title, agency })
  b.title('PROPOSTA IRREVOCABILE DI ACQUISTO IMMOBILIARE')
  b.paragraph('Mod. 14 — Rev. 2021/02', { size: 10, spaceAfter: 8 })

  b.subtitle('Proponente (Acquirente)')
  b.twoColumnTable([
    { label: 'Cognome e Nome', value: s(data.proponente_nome) },
    { label: 'Nato/a a', value: `${s(data.proponente_nato_a)}, il ${date(data.proponente_data_nascita)}` },
    { label: 'Codice fiscale', value: s(data.proponente_cf) },
    { label: 'Residenza', value: s(data.proponente_residenza) },
  ])

  b.subtitle('1. Oggetto della proposta')
  b.paragraph(
    `Il sottoscritto Proponente, indirizzando la presente proposta irrevocabile per il tramite dell'Agente ${s(data.agente_nome)}, ` +
    "S I  I M P E G N A  A D  A C Q U I S T A R E l'immobile di seguito descritto:"
  )
  b.twoColumnTable([
    { label: 'Immobile', value: s(data.immobile_nome) },
    { label: 'Indirizzo', value: s(data.immobile_indirizzo) },
    { label: "Destinazione d'uso", value: s(data.immobile_destinazione) },
    { label: 'Foglio / Particella / Sub', value: `${s(data.catasto_foglio)} / ${s(data.catasto_particella)} / ${s(data.catasto_sub)}` },
  ])

  b.subtitle('2. Prezzo offerto')
  b.paragraph(
    `Il Proponente offre per l'acquisto dell'immobile la somma di ${eur(data.prezzo_offerto)}.`,
    { bold: true, spaceAfter: 6 }
  )

  b.subtitle('3. Caparra e modalità di pagamento')
  b.twoColumnTable([
    { label: 'Caparra confirmatoria', value: eur(data.caparra) },
    { label: 'Modalità caparra', value: s(data.caparra_modalita) },
  ])
  if (data.modalita_pagamento) {
    b.paragraph(`Modalità di pagamento del saldo: ${s(data.modalita_pagamento)}`)
  }

  b.subtitle('4. Condizioni sospensive')
  b.paragraph(s(data.condizioni_sospensive) === '—' ? 'Nessuna condizione sospensiva.' : s(data.condizioni_sospensive))

  b.subtitle('5. Validità della proposta')
  b.paragraph(`La presente proposta è irrevocabile fino al ${date(data.scadenza_proposta)}.`, { bold: true })

  b.subtitle('6. Antiriciclaggio e Privacy')
  b.paragraph(
    'Il Proponente prende atto del dovere di fornire le informazioni necessarie per l\'adeguata verifica ai sensi del ' +
    'D.Lgs. 231/2007 art. 22 e dichiara di aver ricevuto l\'informativa privacy ai sensi degli artt. 13-14 del ' +
    'Regolamento UE 679/2016.'
  )

  b.spacer(8)
  b.placeAndDate(s(data.luogo_firma), date(data.data_firma))
  b.doubleSignature('Il Proponente', "L'Agente")
  return b.save()
}

// ────────────────────────────────────────────────────────────────────────────
// DICHIARAZIONE PROVVIGIONALE ACQUIRENTE (Mod. 14-01 – Rev. 2021/01 FIAIP)
// ────────────────────────────────────────────────────────────────────────────
async function renderDichProvvigionaleAcquirente({ template, data, agency }: RenderInput): Promise<Uint8Array> {
  const b = await PdfBuilder.create({ title: template.title, agency })
  b.title('CONFERIMENTO INCARICO DI MEDIAZIONE')
  b.paragraph('e Accordo di Compenso Provvigionale (lato Acquirente) — Mod. 14-01 Rev. 2021/01', { size: 10, spaceAfter: 8 })

  b.subtitle('Le parti')
  b.paragraph(`Il/La sottoscritto/a Sig./Sig.ra ${s(data.proponente_nome)}`, { bold: true })
  b.twoColumnTable([
    { label: 'Nato/a a', value: s(data.proponente_nato_a) },
    { label: 'Residenza', value: s(data.proponente_residenza) },
    { label: 'Codice fiscale', value: s(data.proponente_cf) },
  ])
  b.paragraph('di seguito per brevità "PROPONENTE",', { size: 9, spaceAfter: 6 })

  const ag = agency
  b.paragraph(`e l'Agenzia ${s(ag?.full_name)} — di seguito per brevità "AGENTE".`, { bold: true })
  b.twoColumnTable([
    { label: 'Sede', value: `${s(ag?.sede_legale_via)}, ${s(ag?.sede_legale_citta)}` },
    { label: 'P.IVA / CF', value: `${s(ag?.partita_iva)} / ${s(ag?.codice_fiscale)}` },
    { label: 'Agente incaricato', value: s(data.agente_nome) },
  ])

  b.subtitle('1. Incarico')
  b.paragraph(
    `Il Proponente conferisce all'Agente incarico in esclusiva e irrevocabile di trasmettere proposta di ` +
    `acquisto/contratto preliminare per l'immobile sito in ${s(data.immobile_indirizzo)}, sottoscritta ` +
    `contestualmente alla presente, e di adoperarsi per il suo perfezionamento.`
  )

  b.subtitle('2. Durata')
  b.paragraph(
    "L'incarico decorre dalla data odierna e termina automaticamente alla scadenza dei termini previsti dalla " +
    'Proposta sottoscritta contestualmente.'
  )

  b.subtitle('3. Compenso all\'Agente')
  const ivaText = String(data.iva_inclusa) === 'forfait'
    ? 'a forfait omnicomprensivo'
    : 'oltre IVA di legge'
  const compText = data.provvigione_pct
    ? `Il Proponente si obbliga a corrispondere un compenso provvigionale pari al ${data.provvigione_pct}% del prezzo di vendita dell'immobile, ${ivaText}.`
    : data.provvigione_fissa
      ? `Il Proponente si obbliga a corrispondere un compenso fisso pari a ${eur(data.provvigione_fissa)}, ${ivaText}.`
      : 'Compenso da definire.'
  b.paragraph(compText)
  b.paragraph(
    "Il compenso matura e dovrà essere corrisposto contestualmente al perfezionamento della proposta di acquisto/" +
    'contratto preliminare (art. 1326 c.c.). Il compenso sarà comunque dovuto anche nel caso in cui l\'acquisto venga ' +
    'concluso direttamente tra il Proponente e il Venditore in un momento successivo alla scadenza della proposta.'
  )

  b.subtitle('4. Antiriciclaggio')
  b.paragraph(
    'Il Proponente prende atto del dovere ex art. 22 D.Lgs. 231/2007 di fornire le informazioni necessarie e aggiornate ' +
    "per consentire all'Agente di adempiere agli obblighi di adeguata verifica della clientela."
  )

  b.subtitle('5. Privacy')
  b.paragraph(
    "Il Proponente dichiara di aver preso visione e ricevuto completa informativa privacy ai sensi degli artt. 13 e 14 " +
    'del Regolamento UE 679/2016 (GDPR).'
  )

  b.spacer(8)
  b.placeAndDate(s(data.luogo_firma), date(data.data_firma))
  b.doubleSignature('Il Proponente', "L'Agente")
  return b.save()
}

// ────────────────────────────────────────────────────────────────────────────
// REGISTRY
// ────────────────────────────────────────────────────────────────────────────
type RendererFn = (input: RenderInput) => Promise<Uint8Array>

const RENDERERS: Record<string, RendererFn> = {
  privacy: renderPrivacy,
  antiriciclaggio: renderAntiriciclaggio,
  incarico_vendita: renderIncaricoVendita,
  proposta_acquisto: renderPropostaAcquisto,
  dich_provvigionale_acquirente: renderDichProvvigionaleAcquirente,
}

export async function renderDocument(input: RenderInput): Promise<Uint8Array> {
  const fn = RENDERERS[input.template.id]
  if (!fn) throw new Error(`Renderer non implementato per template: ${input.template.id}`)
  return fn(input)
}
