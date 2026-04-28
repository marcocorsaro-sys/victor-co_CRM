import { useRef } from 'react'
import type { OperationWithAgent } from '../../lib/supabase'
import { useOperationDocuments } from '../../hooks/useOperationDocuments'
import { getTemplatesForOperation } from '../../lib/documents/templates'
import type { DocumentTemplate } from '../../lib/documents/types'
import { formatDate } from '../../lib/calculations'

type Props = {
  operation: OperationWithAgent
}

const statusBadge = (status: string) => {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    missing: { color: 'var(--g)', bg: 'rgba(120,120,120,0.15)', label: 'Mancante' },
    draft: { color: 'var(--amber)', bg: 'rgba(245,158,11,0.15)', label: 'Bozza' },
    generated: { color: 'var(--teal)', bg: 'rgba(20,184,166,0.15)', label: 'Generato' },
    signed: { color: 'var(--green)', bg: 'rgba(34,197,94,0.15)', label: '✓ Firmato' },
    archived: { color: 'var(--g)', bg: 'rgba(120,120,120,0.1)', label: 'Archiviato' },
  }
  const cfg = map[status] || map.missing
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
    }}>{cfg.label}</span>
  )
}

export default function DocumentsTab({ operation }: Props) {
  const { documents, loading, findOrCreate, uploadSignedPdf, getSignedUrl } = useOperationDocuments(operation.id)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingTemplateRef = useRef<{ template: DocumentTemplate; docId: string } | null>(null)

  // Determina quali documenti applicare a questa operazione
  // (semplificazione MVP: assumiamo che ci sia sempre un buyer e un seller potenziali)
  const hasBuyer = !!(operation.buyer_name || operation.buyer_first_name || operation.client_id)
  const hasSeller = true // ogni vendita ha un venditore (anche se cliente non collegato)
  const templates = getTemplatesForOperation(operation.type, hasBuyer, hasSeller)

  const docByTemplate = (template: DocumentTemplate) =>
    documents.find(d => d.template_id === template.id && d.party === template.party)

  // Raggruppa per parte (Venditore | Acquirente)
  const sellerTemplates = templates.filter(t => t.party === 'seller')
  const buyerTemplates = templates.filter(t => t.party === 'buyer')

  const handleUploadClick = async (template: DocumentTemplate) => {
    const doc = await findOrCreate(template.id, template.party)
    if (!doc) return
    pendingTemplateRef.current = { template, docId: doc.id }
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !pendingTemplateRef.current) return
    const { template, docId } = pendingTemplateRef.current
    pendingTemplateRef.current = null
    await uploadSignedPdf(docId, file, template.id, template.party)
  }

  const handleDownloadSigned = async (path: string) => {
    const url = await getSignedUrl(path)
    if (url) window.open(url, '_blank')
  }

  const renderDocRow = (template: DocumentTemplate) => {
    const doc = docByTemplate(template)
    const status = doc?.status || 'missing'
    return (
      <div key={`${template.id}_${template.party}`} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderBottom: '1px solid var(--bd)', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--w)' }}>{template.title}</div>
          <div style={{ fontSize: 11, color: 'var(--g)', marginTop: 2 }}>{template.description}</div>
          {doc?.signed_at && (
            <div style={{ fontSize: 10, color: 'var(--green)', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
              Firmato il {formatDate(doc.signed_at)}
            </div>
          )}
        </div>
        <div>{statusBadge(status)}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {doc?.pdf_signed_storage_path && (
            <button className="btn btn-secondary btn-sm"
              onClick={() => handleDownloadSigned(doc.pdf_signed_storage_path!)}
              title="Apri PDF firmato">📄</button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => handleUploadClick(template)}
            title={status === 'signed' ? 'Sostituisci firmato' : 'Carica firmato'}>
            ⬆ {status === 'signed' ? 'Sostituisci' : 'Carica firmato'}
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
        onChange={handleFileSelected} />

      {/* Venditore */}
      {sellerTemplates.length > 0 && (
        <div style={{ marginBottom: 16, background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
          <div style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--ld)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--bd)' }}>
            // Documenti Venditore
          </div>
          {sellerTemplates.map(renderDocRow)}
        </div>
      )}

      {/* Acquirente */}
      <div style={{ marginBottom: 16, background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bd)' }}>
        <div style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--ld)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--bd)' }}>
          // Documenti Acquirente {!hasBuyer && <span style={{ color: 'var(--amber)', textTransform: 'none', marginLeft: 6 }}>(acquirente non ancora associato)</span>}
        </div>
        {hasBuyer ? (
          buyerTemplates.map(renderDocRow)
        ) : (
          <div style={{ padding: 16, fontSize: 12, color: 'var(--g)', textAlign: 'center' }}>
            Per generare i documenti acquirente, associa un cliente o inserisci nome/cognome acquirente nell'operazione.
          </div>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'var(--g)', marginTop: 12, padding: '8px 12px', background: 'var(--s3)', borderRadius: 6, lineHeight: 1.5 }}>
        💡 <b>MVP attuale</b>: puoi caricare i PDF firmati e tenerli archiviati. La generazione automatica del PDF
        compilato (con auto-fill di nome, indirizzo, prezzo, ecc.) arriva nella prossima sessione.
      </div>
    </div>
  )
}
