import { getProduct } from '../data/catalog'
import { analyze } from '../engine/analyze'
import { Pill, ProductRow, TopBar } from '../ui/components'
import { useApp } from '../ui/ctx'

function when(t: number) {
  const d = new Date(t)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export function History() {
  const { history, clearHistory, push, profile } = useApp()
  return (
    <div>
      <TopBar noBack title="Geçmiş" right={history.length > 0 ? <button className="iconbtn small" onClick={clearHistory}>Temizle</button> : undefined} />
      <div className="page" style={{ paddingTop: 4 }}>
        {history.length === 0 && <p className="empty">Henüz ürün görüntülemedin. Tara sekmesinden başla.</p>}
        <ul className="list">
          {history.map((h) => { const p = getProduct(h.id); if (!p) return null
            return <li key={h.id + h.t}><ProductRow p={p} onClick={() => push({ k: 'result', id: p.id })} right={<span style={{ textAlign: 'right' }}>{profile.allergies.length > 0 && <Pill level={analyze(p, profile).level} />}<br /><small>{when(h.t)}</small></span>} /></li> })}
        </ul>
        {history.length > 0 && <p className="small muted">Geçmiş yalnızca bu cihazda tutulur.</p>}
      </div>
    </div>
  )
}

export function Saved() {
  const { saved, push, profile } = useApp()
  return (
    <div>
      <TopBar noBack title="Kaydedilenler" />
      <div className="page" style={{ paddingTop: 4 }}>
        {saved.length === 0 && <p className="empty">Kaydettiğin ürünler burada görünür. Sonuç ekranında yer imi simgesine dokun.</p>}
        <ul className="list">
          {saved.map((id) => { const p = getProduct(id); if (!p) return null
            return <li key={id}><ProductRow p={p} onClick={() => push({ k: 'result', id })} right={profile.allergies.length > 0 ? <Pill level={analyze(p, profile).level} /> : undefined} /></li> })}
        </ul>
      </div>
    </div>
  )
}
