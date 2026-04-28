import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { OperationDocument, DocumentTemplateId, DocumentParty, DocumentStatus } from '../lib/supabase'

/**
 * Hook che gestisce la lista dei documenti compilati per una operazione.
 * - fetch dei record da `operation_documents`
 * - upsert dello stato (data, status, paths storage)
 * - upload/download dei PDF su bucket Storage `documents`
 */
export function useOperationDocuments(operationId: string | undefined) {
  const [documents, setDocuments] = useState<OperationDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    if (!operationId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('operation_documents')
      .select('*')
      .eq('operation_id', operationId)
    if (err) setError(err.message)
    else setDocuments((data || []) as OperationDocument[])
    setLoading(false)
  }, [operationId])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  /** Recupera (o crea, status=missing) il record per un dato (template, party). */
  const findOrCreate = useCallback(async (
    templateId: DocumentTemplateId,
    party: DocumentParty
  ): Promise<OperationDocument | null> => {
    if (!operationId) return null
    const existing = documents.find(d => d.template_id === templateId && d.party === party)
    if (existing) return existing
    const { data, error: err } = await supabase
      .from('operation_documents')
      .insert({ operation_id: operationId, template_id: templateId, party, status: 'missing', data: {} })
      .select()
      .maybeSingle()
    if (err) { setError(err.message); return null }
    setDocuments(prev => [...prev, data as OperationDocument])
    return data as OperationDocument
  }, [operationId, documents])

  /** Aggiorna data/status/paths di un documento. */
  const updateDoc = useCallback(async (
    id: string,
    patch: Partial<Pick<OperationDocument, 'data' | 'status' | 'pdf_storage_path' | 'pdf_signed_storage_path' | 'generated_at' | 'signed_at' | 'notes'>>
  ) => {
    const { data, error: err } = await supabase
      .from('operation_documents')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle()
    if (err) return { error: err.message }
    setDocuments(prev => prev.map(d => d.id === id ? (data as OperationDocument) : d))
    return { data: data as OperationDocument }
  }, [])

  /** Upload PDF firmato sullo Storage e marca il record come `signed`. */
  const uploadSignedPdf = useCallback(async (
    docId: string,
    file: File,
    templateId: DocumentTemplateId,
    party: DocumentParty
  ) => {
    if (!operationId) return { error: 'No operation' }
    const path = `operations/${operationId}/${templateId}_${party}_signed.pdf`
    const { error: upErr } = await supabase.storage.from('documents').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf',
    })
    if (upErr) return { error: upErr.message }
    return updateDoc(docId, {
      pdf_signed_storage_path: path,
      status: 'signed',
      signed_at: new Date().toISOString(),
    })
  }, [operationId, updateDoc])

  /** Genera signed URL (TTL 60s) per scaricare un PDF dal bucket. */
  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    const { data, error: err } = await supabase.storage.from('documents').createSignedUrl(path, 60)
    if (err) { setError(err.message); return null }
    return data?.signedUrl || null
  }, [])

  /** Stato di un singolo documento (con ricerca). */
  const getStatus = useCallback((templateId: DocumentTemplateId, party: DocumentParty): DocumentStatus => {
    return documents.find(d => d.template_id === templateId && d.party === party)?.status || 'missing'
  }, [documents])

  return {
    documents,
    loading,
    error,
    findOrCreate,
    updateDoc,
    uploadSignedPdf,
    getSignedUrl,
    getStatus,
    refetch: fetchDocs,
  }
}
