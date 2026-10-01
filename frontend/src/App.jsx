import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://cuartodaryn.onrender.com/api'
const blank = { product_name: '', description: '', price: '', quantity: '' }

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'Request failed')
  return body
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'))
  const [mode, setMode] = useState('login')
  const [auth, setAuth] = useState({ username: '', email: '', password: '' })
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const headers = { Authorization: `Bearer ${token}` }

  async function load() {
    try { setProducts((await api('/products', { headers })).data || []) } catch (e) { setError(e.message) }
  }
  useEffect(() => { if (token) load() }, [token])
  async function authenticate(event) {
    event.preventDefault(); setError(''); setNotice('')
    try {
      const result = await api(mode === 'login' ? '/auth/login' : '/auth/register', { method: 'POST', body: JSON.stringify(auth) })
      if (mode === 'register') { setMode('login'); setNotice('Account created. Please sign in.'); return }
      localStorage.setItem('access_token', result.tokens.access_token); setToken(result.tokens.access_token)
    } catch (e) { setError(e.message) }
  }
  async function save(event) {
    event.preventDefault(); setError(''); setNotice('')
    try { await api(editing ? `/products/${editing}` : '/products', { method: editing ? 'PUT' : 'POST', headers, body: JSON.stringify(form) }); setForm(blank); setEditing(null); setNotice(editing ? 'Product updated.' : 'Product added.'); load() } catch (e) { setError(e.message) }
  }
  async function remove(id) {
    if (!confirm('Delete this product?')) return
    try { await api(`/products/${id}`, { method: 'DELETE', headers }); setNotice('Product deleted.'); load() } catch (e) { setError(e.message) }
  }
  function logout() { localStorage.removeItem('access_token'); setToken(null) }

  if (!token) return <main className="auth"><section><small>PRODUCT MANAGEMENT / LAB 06</small><h1>Inventory<br /><i>desk.</i></h1><p>Track stock, pricing, and product details in one quiet workspace.</p><form onSubmit={authenticate}>{mode === 'register' && <label>Username<input required value={auth.username} onChange={e => setAuth({ ...auth, username: e.target.value })} /></label>}<label>Email<input required type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} /></label><label>Password<input required minLength="6" type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} /></label><button>{mode === 'login' ? 'Sign in' : 'Create account'} <b>→</b></button></form>{error && <strong className="error">{error}</strong>}{notice && <strong className="notice">{notice}</strong>}<button className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Need an account? Register' : 'Already registered? Sign in'}</button></section><aside>STOCK<br />ROOM</aside></main>

  return <main className="app"><header><div><small>PRODUCT MANAGEMENT / LAB 06</small><h1>Inventory <i>desk.</i></h1></div><button className="logout" onClick={logout}>Log out ↗</button></header><div className="grid"><section><div className="heading"><div><small>LIVE CATALOG</small><h2>Products <sup>{products.length}</sup></h2></div><span>● Connected</span></div>{error && <strong className="error">{error}</strong>}{notice && <strong className="notice">{notice}</strong>}{products.length === 0 ? <p className="empty">No products yet. Add your first item.</p> : products.map(p => <article key={p.id}><div><h3>{p.product_name}</h3><p>{p.description || 'No description'}</p></div><strong>${Number(p.price).toFixed(2)}</strong><small>{p.quantity} in stock</small><div><button onClick={() => { setEditing(p.id); setForm({ product_name: p.product_name, description: p.description || '', price: p.price, quantity: p.quantity }) }}>Edit</button><button onClick={() => remove(p.id)}>Delete</button></div></article>)}</section><form className="editor" onSubmit={save}><small>{editing ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</small><h2>{editing ? 'Refine the details.' : 'Add to catalog.'}</h2><label>Product name<input required value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} /></label><label>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="split"><label>Price<input required type="number" min="0" step=".01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></label><label>Quantity<input required type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label></div><button>{editing ? 'Save changes' : 'Add product'} <b>→</b></button></form></div></main>
}
