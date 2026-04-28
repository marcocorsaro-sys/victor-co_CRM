import type { DocumentTemplate } from './types'

/**
 * Template Privacy (acquirente o venditore — identico).
 * Mod. 00 – Rev. 2021/01 FIAIP.
 */
const privacyTemplate = (party: 'buyer' | 'seller'): DocumentTemplate => ({
  id: 'privacy',
  party,
  title: party === 'buyer' ? 'Privacy (Acquirente)' : 'Privacy (Venditore)',
  description: 'Informativa GDPR + consensi diffusione dati e marketing',
  pdfPath: '/documents/privacy.pdf',
  applicableTo: ['sempre'],
  fields: [
    { key: 'cliente_nome_completo', label: 'Cognome e Nome cliente', type: 'text',
      source: { kind: 'client', path: 'name' }, required: true, section: 'Cliente' },
    { key: 'agenzia_full_name', label: 'Titolare del trattamento', type: 'text',
      source: { kind: 'agency', path: 'full_name' }, required: true, section: 'Agenzia' },
    { key: 'agenzia_sede', label: 'Sede legale', type: 'text',
      source: { kind: 'agency', path: 'sede_legale_via' }, required: true, section: 'Agenzia' },
    { key: 'agenzia_citta', label: 'Città sede', type: 'text',
      source: { kind: 'agency', path: 'sede_legale_citta' }, required: true, section: 'Agenzia' },
    { key: 'consenso_diffusione', label: 'Autorizza diffusione foto/video/planimetrie', type: 'checkbox',
      source: { kind: 'client', path: 'privacy_diffusione_consenso' }, section: 'Consensi' },
    { key: 'consenso_marketing', label: 'Autorizza materiale pubblicitario/commerciale', type: 'checkbox',
      source: { kind: 'client', path: 'privacy_marketing_consenso' }, section: 'Consensi' },
    { key: 'luogo_firma', label: 'Luogo firma', type: 'text', source: { kind: 'manual' }, section: 'Firma' },
    { key: 'data_firma', label: 'Data firma', type: 'date',
      source: { kind: 'computed', compute: 'today' }, section: 'Firma' },
  ],
})

/**
 * Template Antiriciclaggio (acquirente o venditore — identico).
 * Mod. 992/FIAIP/2022/All. 03 - Rev. 01 (D.Lgs. 231/2007 art. 22)
 */
const antiriciclaggio = (party: 'buyer' | 'seller'): DocumentTemplate => ({
  id: 'antiriciclaggio',
  party,
  title: party === 'buyer' ? 'Antiriciclaggio (Acquirente)' : 'Antiriciclaggio (Venditore)',
  description: 'Adeguata verifica clientela ex D.Lgs. 231/2007 art. 22',
  pdfPath: '/documents/antiriciclaggio.pdf',
  applicableTo: ['sempre'],
  fields: [
    { key: 'cognome_nome', label: 'Cognome e Nome', type: 'text',
      source: { kind: 'client', path: 'name' }, required: true, section: 'Anagrafica' },
    { key: 'luogo_data_nascita', label: 'Luogo e data di nascita', type: 'text',
      source: { kind: 'client', path: 'luogo_nascita' }, required: true, section: 'Anagrafica',
      hint: 'Aggiungi a mano la data se non presente in scheda' },
    { key: 'indirizzo_residenza', label: 'Indirizzo di residenza', type: 'text',
      source: { kind: 'client', path: 'address' }, required: true, section: 'Anagrafica' },
    { key: 'nazionalita', label: 'Nazionalità', type: 'text',
      source: { kind: 'client', path: 'nazionalita' }, required: true, section: 'Anagrafica' },
    { key: 'documento_tipo', label: "Tipo documento d'identificazione", type: 'select',
      source: { kind: 'client', path: 'documento_tipo' }, required: true, section: 'Documento',
      options: [
        { value: 'CI', label: 'Carta d\'identità' },
        { value: 'Passaporto', label: 'Passaporto' },
        { value: 'Patente', label: 'Patente di guida' },
      ]},
    { key: 'documento_numero', label: 'Numero documento', type: 'text',
      source: { kind: 'client', path: 'documento_numero' }, required: true, section: 'Documento' },
    { key: 'documento_rilasciato_da', label: 'Rilasciato da', type: 'text',
      source: { kind: 'client', path: 'documento_rilasciato_da' }, required: true, section: 'Documento' },
    { key: 'documento_rilascio', label: 'Data rilascio', type: 'date',
      source: { kind: 'client', path: 'documento_rilascio_date' }, required: true, section: 'Documento' },
    { key: 'documento_scadenza', label: 'Data scadenza', type: 'date',
      source: { kind: 'client', path: 'documento_scadenza' }, required: true, section: 'Documento' },
    { key: 'codice_fiscale', label: 'Codice fiscale', type: 'text',
      source: { kind: 'client', path: 'codice_fiscale' }, required: true, section: 'Documento' },
    { key: 'professione', label: 'Professione/Attività', type: 'text',
      source: { kind: 'client', path: 'professione' }, required: true, section: 'Anagrafica' },
    { key: 'mandato_data', label: "Data conferimento mandato/incarico", type: 'date',
      source: { kind: 'operation', path: 'mandate_start_date' }, section: 'Mandato' },
    { key: 'oggetto_incarico', label: 'Oggetto incarico', type: 'select',
      source: { kind: 'operation', path: 'type' }, section: 'Mandato',
      options: [
        { value: 'vendita', label: 'Vendita' },
        { value: 'locazione', label: 'Locazione' },
        { value: 'acquisto', label: 'Acquisto' },
        { value: 'conduzione', label: 'Conduzione' },
      ]},
    { key: 'scopo_operazione', label: "Scopo dell'operazione", type: 'select',
      source: { kind: 'client', path: 'scopo_operazione' }, section: 'Scopo',
      options: [
        { value: 'famiglia', label: 'Esigenze di famiglia' },
        { value: 'impresa', label: 'Esigenze di impresa' },
        { value: 'investimento', label: 'Finalità di investimento' },
        { value: 'altro', label: 'Altro' },
      ]},
    { key: 'pep', label: 'È persona politicamente esposta (PEP)?', type: 'checkbox',
      source: { kind: 'client', path: 'pep' }, section: 'PEP' },
    { key: 'pep_carica', label: 'Carica ricoperta (se PEP)', type: 'text',
      source: { kind: 'client', path: 'pep_carica' }, section: 'PEP' },
    { key: 'provenienza_fondi', label: 'Provenienza fondi (se PEP)', type: 'textarea',
      source: { kind: 'client', path: 'provenienza_fondi' }, section: 'PEP' },
    { key: 'luogo_firma', label: 'Luogo firma', type: 'text', source: { kind: 'manual' }, section: 'Firma' },
    { key: 'data_firma', label: 'Data firma', type: 'date',
      source: { kind: 'computed', compute: 'today' }, section: 'Firma' },
    { key: 'professionista', label: 'Professionista che ha effettuato l\'identificazione', type: 'text',
      source: { kind: 'computed', compute: 'agent_full_name' }, section: 'Firma' },
  ],
})

/**
 * Template Incarico vendita (Mod. 09 – Rev. 2021/02 FIAIP).
 */
const incaricoVendita: DocumentTemplate = {
  id: 'incarico_vendita',
  party: 'seller',
  title: 'Incarico di Mediazione (Vendita)',
  description: 'Conferimento incarico in esclusiva per la vendita immobiliare',
  pdfPath: '/documents/incarico_vendita.pdf',
  applicableTo: ['vendita'],
  fields: [
    // Venditore
    { key: 'venditore_nome', label: 'Cognome e Nome venditore', type: 'text',
      source: { kind: 'client', path: 'name' }, required: true, section: 'Venditore' },
    { key: 'venditore_nato_a', label: 'Nato/a a', type: 'text',
      source: { kind: 'client', path: 'luogo_nascita' }, required: true, section: 'Venditore' },
    { key: 'venditore_data_nascita', label: 'Data di nascita', type: 'date',
      source: { kind: 'client', path: 'birth_date' }, required: true, section: 'Venditore' },
    { key: 'venditore_cf', label: 'Codice fiscale', type: 'text',
      source: { kind: 'client', path: 'codice_fiscale' }, required: true, section: 'Venditore' },
    { key: 'venditore_residenza', label: 'Residenza', type: 'text',
      source: { kind: 'client', path: 'address' }, required: true, section: 'Venditore' },
    { key: 'venditore_telefono', label: 'Telefono', type: 'text',
      source: { kind: 'client', path: 'phone' }, section: 'Venditore' },
    { key: 'venditore_email', label: 'Email', type: 'text',
      source: { kind: 'client', path: 'email' }, section: 'Venditore' },
    // Immobile
    { key: 'immobile_nome', label: 'Nome immobile', type: 'text',
      source: { kind: 'operation', path: 'property_name' }, required: true, section: 'Immobile' },
    { key: 'immobile_indirizzo', label: 'Indirizzo immobile', type: 'text',
      source: { kind: 'operation', path: 'address' }, required: true, section: 'Immobile' },
    { key: 'immobile_scala', label: 'Scala', type: 'text',
      source: { kind: 'operation', path: 'scala' }, section: 'Immobile' },
    { key: 'immobile_piano', label: 'Piano', type: 'text',
      source: { kind: 'operation', path: 'piano' }, section: 'Immobile' },
    { key: 'immobile_interno', label: 'Interno', type: 'text',
      source: { kind: 'operation', path: 'interno' }, section: 'Immobile' },
    { key: 'immobile_ascensore', label: 'Servito da ascensore', type: 'checkbox',
      source: { kind: 'operation', path: 'servito_ascensore' }, section: 'Immobile' },
    { key: 'immobile_destinazione', label: 'Destinazione d\'uso', type: 'text',
      source: { kind: 'operation', path: 'destinazione_uso' }, section: 'Immobile' },
    { key: 'immobile_composizione', label: 'Composizione', type: 'textarea',
      source: { kind: 'operation', path: 'composizione' }, section: 'Immobile' },
    { key: 'immobile_superficie', label: 'Superficie (mq)', type: 'number',
      source: { kind: 'operation', path: 'superficie_mq' }, section: 'Immobile' },
    // Catasto
    { key: 'catasto_foglio', label: 'Foglio', type: 'text',
      source: { kind: 'operation', path: 'dati_catastali.foglio' }, section: 'Catasto' },
    { key: 'catasto_particella', label: 'Particella', type: 'text',
      source: { kind: 'operation', path: 'dati_catastali.particella' }, section: 'Catasto' },
    { key: 'catasto_sub', label: 'Sub', type: 'text',
      source: { kind: 'operation', path: 'dati_catastali.sub' }, section: 'Catasto' },
    { key: 'catasto_categoria', label: 'Categoria', type: 'text',
      source: { kind: 'operation', path: 'dati_catastali.categoria' }, section: 'Catasto' },
    // Locazione
    { key: 'locato_a', label: 'Locato a', type: 'text',
      source: { kind: 'operation', path: 'locato_a' }, section: 'Locazione' },
    { key: 'locato_canone', label: 'Canone annuo', type: 'eur',
      source: { kind: 'operation', path: 'locato_canone' }, section: 'Locazione' },
    { key: 'locato_scadenza', label: 'Scadenza contrattuale', type: 'date',
      source: { kind: 'operation', path: 'locato_scadenza' }, section: 'Locazione' },
    // Prezzo
    { key: 'prezzo_richiesto', label: 'Prezzo richiesto', type: 'eur',
      source: { kind: 'operation', path: 'property_value' }, required: true, section: 'Economici' },
    // Mandato
    { key: 'mandato_inizio', label: 'Data inizio incarico', type: 'date',
      source: { kind: 'operation', path: 'mandate_start_date' }, required: true, section: 'Mandato' },
    { key: 'mandato_fine', label: 'Data fine incarico', type: 'date',
      source: { kind: 'operation', path: 'mandate_end_date' }, required: true, section: 'Mandato' },
    // Provvigioni
    { key: 'provvigione_pct', label: 'Provvigione %', type: 'percent',
      source: { kind: 'operation', path: 'comm_pct_seller' }, section: 'Provvigioni' },
    { key: 'provvigione_fissa', label: 'Provvigione fissa (€)', type: 'eur',
      source: { kind: 'operation', path: 'comm_fixed_seller' }, section: 'Provvigioni' },
    // Agente
    { key: 'agente_nome', label: 'Agente', type: 'text',
      source: { kind: 'computed', compute: 'agent_full_name' }, section: 'Agente' },
    { key: 'luogo_firma', label: 'Luogo firma', type: 'text', source: { kind: 'manual' }, section: 'Firma' },
    { key: 'data_firma', label: 'Data firma', type: 'date',
      source: { kind: 'computed', compute: 'today' }, section: 'Firma' },
  ],
}

/**
 * Template Proposta irrevocabile di acquisto immobiliare (Mod. 14 – Rev. 2021/02 FIAIP).
 */
const propostaAcquisto: DocumentTemplate = {
  id: 'proposta_acquisto',
  party: 'buyer',
  title: 'Proposta Irrevocabile di Acquisto',
  description: 'Proposta di acquisto immobiliare con caparra e condizioni',
  pdfPath: '/documents/proposta_acquisto.pdf',
  applicableTo: ['vendita'],
  fields: [
    // Proponente (acquirente)
    { key: 'proponente_nome', label: 'Cognome e Nome proponente', type: 'text',
      source: { kind: 'client', path: 'name' }, required: true, section: 'Proponente' },
    { key: 'proponente_nato_a', label: 'Nato/a a', type: 'text',
      source: { kind: 'client', path: 'luogo_nascita' }, required: true, section: 'Proponente' },
    { key: 'proponente_data_nascita', label: 'Data di nascita', type: 'date',
      source: { kind: 'client', path: 'birth_date' }, required: true, section: 'Proponente' },
    { key: 'proponente_cf', label: 'Codice fiscale', type: 'text',
      source: { kind: 'client', path: 'codice_fiscale' }, required: true, section: 'Proponente' },
    { key: 'proponente_residenza', label: 'Residenza', type: 'text',
      source: { kind: 'client', path: 'address' }, required: true, section: 'Proponente' },
    // Immobile (riusa stessi campi dell'incarico)
    { key: 'immobile_nome', label: 'Immobile', type: 'text',
      source: { kind: 'operation', path: 'property_name' }, required: true, section: 'Immobile' },
    { key: 'immobile_indirizzo', label: 'Indirizzo immobile', type: 'text',
      source: { kind: 'operation', path: 'address' }, required: true, section: 'Immobile' },
    { key: 'immobile_destinazione', label: 'Destinazione d\'uso', type: 'text',
      source: { kind: 'operation', path: 'destinazione_uso' }, section: 'Immobile' },
    { key: 'catasto_foglio', label: 'Foglio', type: 'text',
      source: { kind: 'operation', path: 'dati_catastali.foglio' }, section: 'Catasto' },
    { key: 'catasto_particella', label: 'Particella', type: 'text',
      source: { kind: 'operation', path: 'dati_catastali.particella' }, section: 'Catasto' },
    { key: 'catasto_sub', label: 'Sub', type: 'text',
      source: { kind: 'operation', path: 'dati_catastali.sub' }, section: 'Catasto' },
    // Economici
    { key: 'prezzo_offerto', label: 'Prezzo offerto', type: 'eur',
      source: { kind: 'operation', path: 'property_value' }, required: true, section: 'Economici' },
    { key: 'caparra', label: 'Caparra', type: 'eur',
      source: { kind: 'operation', path: 'caparra' }, required: true, section: 'Economici' },
    { key: 'caparra_modalita', label: 'Modalità caparra', type: 'select',
      source: { kind: 'operation', path: 'caparra_modalita' }, section: 'Economici',
      options: [
        { value: 'assegno', label: 'Assegno' },
        { value: 'bonifico', label: 'Bonifico' },
        { value: 'contanti', label: 'Contanti' },
      ]},
    { key: 'modalita_pagamento', label: 'Modalità di pagamento del saldo', type: 'textarea',
      source: { kind: 'operation', path: 'modalita_pagamento' }, section: 'Economici' },
    { key: 'condizioni_sospensive', label: 'Condizioni sospensive', type: 'textarea',
      source: { kind: 'operation', path: 'condizioni_sospensive' }, section: 'Economici' },
    { key: 'scadenza_proposta', label: 'Scadenza proposta', type: 'date',
      source: { kind: 'operation', path: 'scadenza_proposta' }, required: true, section: 'Tempistiche' },
    { key: 'agente_nome', label: 'Agente intermediario', type: 'text',
      source: { kind: 'computed', compute: 'agent_full_name' }, section: 'Agente' },
    { key: 'luogo_firma', label: 'Luogo firma', type: 'text', source: { kind: 'manual' }, section: 'Firma' },
    { key: 'data_firma', label: 'Data firma', type: 'date',
      source: { kind: 'computed', compute: 'today' }, section: 'Firma' },
  ],
}

/**
 * Template Dichiarazione provvigionale acquirente (Mod. 14-01 – Rev. 2021/01 FIAIP).
 */
const dichProvvigionaleAcquirente: DocumentTemplate = {
  id: 'dich_provvigionale_acquirente',
  party: 'buyer',
  title: 'Dichiarazione Provvigionale (Acquirente)',
  description: 'Conferimento incarico di mediazione e accordo compenso provvigionale',
  pdfPath: '/documents/dich_provvigionale_acquirente.pdf',
  applicableTo: ['vendita'],
  fields: [
    { key: 'proponente_nome', label: 'Cognome e Nome proponente', type: 'text',
      source: { kind: 'client', path: 'name' }, required: true, section: 'Proponente' },
    { key: 'proponente_nato_a', label: 'Nato/a a', type: 'text',
      source: { kind: 'client', path: 'luogo_nascita' }, required: true, section: 'Proponente' },
    { key: 'proponente_residenza', label: 'Residenza', type: 'text',
      source: { kind: 'client', path: 'address' }, required: true, section: 'Proponente' },
    { key: 'proponente_cf', label: 'Codice fiscale', type: 'text',
      source: { kind: 'client', path: 'codice_fiscale' }, required: true, section: 'Proponente' },
    { key: 'immobile_indirizzo', label: 'Indirizzo immobile', type: 'text',
      source: { kind: 'operation', path: 'address' }, required: true, section: 'Immobile' },
    { key: 'provvigione_pct', label: 'Provvigione %', type: 'percent',
      source: { kind: 'operation', path: 'comm_pct_buyer' }, section: 'Provvigioni' },
    { key: 'provvigione_fissa', label: 'Provvigione fissa (€)', type: 'eur',
      source: { kind: 'operation', path: 'comm_fixed_buyer' }, section: 'Provvigioni' },
    { key: 'iva_inclusa', label: 'Compenso oltre IVA / forfait omnicomprensivo', type: 'select',
      source: { kind: 'manual' }, section: 'Provvigioni',
      options: [
        { value: 'oltre_iva', label: 'Oltre IVA di legge' },
        { value: 'forfait', label: 'Forfait omnicomprensivo' },
      ]},
    { key: 'agente_nome', label: 'Agente', type: 'text',
      source: { kind: 'computed', compute: 'agent_full_name' }, section: 'Agente' },
    { key: 'luogo_firma', label: 'Luogo firma', type: 'text', source: { kind: 'manual' }, section: 'Firma' },
    { key: 'data_firma', label: 'Data firma', type: 'date',
      source: { kind: 'computed', compute: 'today' }, section: 'Firma' },
  ],
}

/**
 * Registry di tutti i template disponibili, indicizzati per (id, party).
 * `getTemplatesForOperation(type, hasBuyer, hasSeller)` ritorna quelli applicabili.
 */
export const ALL_TEMPLATES: DocumentTemplate[] = [
  privacyTemplate('seller'),
  privacyTemplate('buyer'),
  antiriciclaggio('seller'),
  antiriciclaggio('buyer'),
  incaricoVendita,
  propostaAcquisto,
  dichProvvigionaleAcquirente,
]

export function getTemplatesForOperation(
  opType: 'vendita' | 'locazione',
  hasBuyer: boolean,
  hasSeller: boolean
): DocumentTemplate[] {
  return ALL_TEMPLATES.filter(t => {
    // applicabilità per tipo operazione
    const okType = t.applicableTo.includes('sempre') || t.applicableTo.includes(opType)
    if (!okType) return false
    // applicabilità per parti coinvolte
    if (t.party === 'buyer' && !hasBuyer) return false
    if (t.party === 'seller' && !hasSeller) return false
    return true
  })
}

export function findTemplate(id: string, party: 'buyer' | 'seller' | 'agency'): DocumentTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id && t.party === party)
}
