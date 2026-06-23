import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, Download, Loader, X } from 'lucide-react'
import api from '../../hooks/useApi'

async function downloadNote(id, filename) {
  try {
    const res = await api.get(`/files/notes/${id}/download`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a   = document.createElement('a')
    a.href    = url
    a.download = filename || 'notes.pdf'
    a.click()
    window.URL.revokeObjectURL(url)
  } catch(e) {
    alert('Download failed')
  }
}

export default function AdminNotes() {
  const [notes,    setNotes]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [dragging, setDragging] = useState(false)
  const [uploading,setUploading]= useState(false)
  const [progress, setProgress] = useState(0)
  const [form,     setForm]     = useState({ title:'', batch_name:'JEE Class 12', file:null })

  async function load() {
    try { const res = await api.get('/files/notes'); setNotes(res.data) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function handleDrop(e) { e.preventDefault(); setDragging(false); const f=e.dataTransfer.files[0]; if(f) setForm(x=>({...x,file:f})) }

  async function upload(e) {
    e.preventDefault()
    if (!form.file) return alert('Select a PDF file')
    setUploading(true); setProgress(0)
    const data = new FormData()
    data.append('file', form.file)
    data.append('title', form.title || form.file.name)
    data.append('batch_name', form.batch_name)
    try {
      await api.post('/files/notes/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: e => setProgress(Math.round(e.loaded*100/e.total))
      })
      setForm({ title:'', batch_name:'JEE Class 12', file:null }); setProgress(0)
      load()
    } catch(e) { alert(e.response?.data?.message||'Upload failed') }
    finally { setUploading(false) }
  }

  async function deleteNote(id) {
    if (!confirm('Delete this note?')) return
    try { await api.delete(`/files/notes/${id}`); setNotes(n=>n.filter(x=>x.id!==id)) }
    catch(e) { alert('Failed') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader size={20} className="animate-spin text-brand-500" /></div>

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-display font-semibold text-stone-900">Notes & PDFs</h1>
        <p className="text-sm text-stone-400 mt-0.5">{notes.length} notes uploaded</p></div>

      <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-800 mb-4">Upload notes</h3>
        <form onSubmit={upload}>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Title</label>
              <input type="text" placeholder="e.g. Electrostatics Chapter Notes"
                value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1.5">Batch</label>
              <select value={form.batch_name} onChange={e => setForm(f=>({...f,batch_name:e.target.value}))}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
                {['JEE Class 12','JEE Class 11','JEE Dropper','NEET Class 12','NEET Class 11','KCET Class 12','All Batches'].map(b=><option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-4 ${dragging?'border-brand-400 bg-brand-50':'border-stone-200 bg-stone-50'}`}>
            <FileText size={28} className="mx-auto text-stone-300 mb-3" />
            {form.file
              ? <p className="text-sm font-medium text-stone-700">{form.file.name}</p>
              : <><p className="text-sm text-stone-500 mb-1">Drag & drop PDF here</p><p className="text-xs text-stone-400">PDF up to 50MB</p></>}
            <label className="mt-3 inline-block cursor-pointer bg-white border border-stone-200 text-stone-600 text-xs px-3 py-1.5 rounded-lg">
              Browse PDF
              <input type="file" accept=".pdf" className="hidden" onChange={e=>setForm(f=>({...f,file:e.target.files[0]}))} />
            </label>
          </div>

          {uploading && (
            <div className="mb-4">
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{width:`${progress}%`}} />
              </div>
              <p className="text-xs text-stone-400 mt-1">Uploading... {progress}%</p>
            </div>
          )}

          <button type="submit" disabled={uploading}
            className="bg-brand-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-brand-600 disabled:opacity-60 flex items-center gap-2">
            <Upload size={14} /> {uploading ? `Uploading ${progress}%...` : 'Upload notes'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-50"><h3 className="text-sm font-semibold text-stone-800">All notes</h3></div>
        <div className="divide-y divide-stone-50">
          {notes.map(n => (
            <div key={n.id} className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{n.title}</p>
                <p className="text-xs text-stone-400">
                  {n.batch_name} · {n.size_kb ? `${(n.size_kb/1024).toFixed(1)} MB` : '—'} · {n.downloads||0} downloads
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => downloadNote(n.id, n.filename)}
                  className="p-1.5 text-stone-400 hover:text-brand-500 transition-colors" title="Download">
                  <Download size={14} />
                </button>
                <button onClick={() => deleteNote(n.id)}
                  className="p-1.5 text-stone-400 hover:text-red-500 transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {notes.length === 0 && <p className="text-center py-8 text-stone-400 text-sm">No notes uploaded yet</p>}
        </div>
      </div>
    </div>
  )
}
