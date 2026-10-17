"use client";
import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
type Product = { id: string; name: string; price: number; category: string; festival: string | null; variants: { size: string; color: string; stock: number }[] };
type Order = { id: string; name: string; email: string; total: number; status: string; paymentMethod: string; paymentStatus: string; addressJson: string; createdAt: string; items: { name: string; size: string; color: string; quantity: number }[] };
const transitions: Record<string, { label: string; value: string }[]> = {
  PENDING: [{ label: 'Accept order', value: 'CONFIRMED' }, { label: 'Reject order', value: 'CANCELLED' }],
  CONFIRMED: [{ label: 'Mark packed', value: 'PACKED' }, { label: 'Cancel order', value: 'CANCELLED' }],
  PACKED: [{ label: 'Mark shipped', value: 'SHIPPED' }, { label: 'Cancel order', value: 'CANCELLED' }],
  SHIPPED: [{ label: 'Mark delivered', value: 'DELIVERED' }],
};
const money = (n: number) => '₹' + n.toLocaleString('en-IN');
export function AdminPanel({ products, orders }: { products: Product[]; orders: Order[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [productMessage, setProductMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [working, setWorking] = useState<string | null>(null);
  const visible = useMemo(() => orders.filter(o => (filter === 'ALL' || o.status === filter) && [o.id, o.name, o.email].some(v => v.toLowerCase().includes(search.toLowerCase()))), [orders, filter, search]);
  async function update(order: Order, status: string) {
    const isCancel = status === 'CANCELLED';
    const note = isCancel ? (order.paymentStatus === 'PAID' ? 'Cancel this paid order? Stock will be restored, but you MUST process the refund separately in Razorpay.' : 'Reject/cancel this order and restore its stock?') : `Change order #${order.id.slice(-8).toUpperCase()} to ${status}?`;
    if (!window.confirm(note)) return;
    setWorking(order.id); setMessage('');
    try {
      const res = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'STATUS', id: order.id, status }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setMessage(data.refundRequired ? 'Order cancelled and stock restored. ACTION REQUIRED: issue and verify the Razorpay refund manually.' : 'Order status updated successfully.');
      router.refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to update'); }
    finally { setWorking(null); }
  }
  async function markCodReceived(order: Order) {
    if (!window.confirm('Have you actually received the cash for this delivered order?')) return;
    setWorking(order.id); setMessage('');
    try {
      const res = await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'COD_RECEIVED', id: order.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment update failed');
      setMessage('COD payment marked as received.'); router.refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to update payment'); }
    finally { setWorking(null); }
  }
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setProductMessage(null);
    setCreatingProduct(true);
    const d = Object.fromEntries(new FormData(form));
    const payload = { name: d.name, description: d.description, category: d.category, festival: d.festival || null, image: d.image, price: Number(d.price), variants: [{ size: d.size, color: d.color, stock: Number(d.stock), sku: d.sku }] };
    try {
      const r = await fetch('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof j.error === 'string' ? j.error : 'Product add nahi hua. Please try again.');
      setProductMessage({ type: 'success', text: 'Product successfully added!' });
      form.reset();
      router.refresh();
    } catch (err) {
      setProductMessage({ type: 'error', text: err instanceof Error ? err.message : 'Product add nahi hua.' });
    } finally {
      setCreatingProduct(false);
    }
  }
  return <>
    <section className="admin-block" id="manage-orders">
      <div className="admin-heading"><div><span className="eyebrow">LIVE FULFILMENT</span><h2>MANAGE ORDERS</h2></div><span className="admin-count">{visible.length} ORDERS</span></div>
      <div className="admin-toolbar"><input aria-label="Search orders" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order ID, name or email" /><select aria-label="Filter orders" value={filter} onChange={e => setFilter(e.target.value)}>{['ALL','PENDING','CONFIRMED','PACKED','SHIPPED','DELIVERED','CANCELLED'].map(s => <option key={s}>{s}</option>)}</select></div>
      {message && <p role="status" className="admin-notice">{message}</p>}
      {visible.length === 0 ? <p>No orders match your filter.</p> : <div className="admin-order-list">{visible.map(o => {
        let address: Record<string, unknown> = {};
        try { const parsed: unknown = JSON.parse(o.addressJson); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) address = parsed as Record<string, unknown>; } catch {}
        const options = (transitions[o.status] ?? []).filter(opt => opt.value === 'CANCELLED' || o.paymentMethod !== 'ONLINE' || o.paymentStatus === 'PAID');
        return <article key={o.id} className="admin-order-card">
          <div className="admin-order-top"><div><span className="eyebrow">ORDER #{o.id.slice(-8).toUpperCase()}</span><h3>{o.name}</h3><small>{o.email} · {new Date(o.createdAt).toLocaleString('en-IN')}</small></div><span className={'admin-status status-' + o.status.toLowerCase()}>{o.status}</span></div>
          <div className="admin-order-columns"><div><strong>PRODUCTS</strong>{o.items.map((item, index) => <p key={index}>{item.name} — {item.size}/{item.color} × {item.quantity}</p>)}</div><div><strong>DELIVERY ADDRESS</strong><p>{[address.name,address.phone,address.line1,address.city,address.state,address.pincode].filter(Boolean).map(String).join(', ') || 'Address unavailable'}</p></div><div><strong>PAYMENT</strong><p>{o.paymentMethod} · {o.paymentStatus}</p><strong>{money(o.total)}</strong></div></div>
          <div className="admin-order-actions">{options.map(opt => <button key={opt.value} type="button" className={'admin-action ' + (opt.value === 'CANCELLED' ? 'danger' : '')} disabled={working === o.id} onClick={() => update(o,opt.value)}>{working === o.id ? 'UPDATING...' : opt.label}</button>)}{o.paymentMethod === 'COD' && o.status === 'DELIVERED' && o.paymentStatus !== 'PAID' && <button type="button" className="admin-action" disabled={working === o.id} onClick={() => markCodReceived(o)}>MARK COD PAYMENT RECEIVED</button>}{options.length === 0 && <small>{o.status === 'CANCELLED' ? 'Order cancelled' : o.status === 'DELIVERED' ? 'Order delivered' : 'Awaiting verified payment'}</small>}{o.status === 'CANCELLED' && o.paymentStatus === 'PAID' && <strong className="refund-warning">Paid order: check refund in Razorpay</strong>}</div>
        </article>;
      })}</div>}
    </section>
    <section className="admin-block"><div className="admin-heading"><div><span className="eyebrow">YOUR CATALOGUE</span><h2>INVENTORY</h2></div><span className="admin-count">{products.length} PRODUCTS</span></div><div className="tablewrap"><table><thead><tr><th>Product</th><th>Category</th><th>Festival</th><th>Price</th><th>Variants / stock</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.category}</td><td>{p.festival || "—"}</td><td>{money(p.price)}</td><td>{p.variants.map(v => `${v.size}/${v.color}: ${v.stock}${v.stock === 0 ? ' (OUT OF STOCK)' : ''}`).join(', ')}</td></tr>)}</tbody></table></div></section>
    <section className="admin-block"><div className="admin-heading"><div><span className="eyebrow">NEW ARRIVALS</span><h2>ADD PRODUCT</h2></div></div><form className="admin-form" onSubmit={create}><input name="name" placeholder="Product name" required/><input name="description" placeholder="Description" required/><select name="category"><option>Men</option><option>Women</option><option>Kids</option></select><select name="festival" aria-label="Festival collection"><option value="">No festival / Everyday</option>{["Diwali","Holi","Navratri","Raksha Bandhan","Eid","Christmas"].map(f => <option key={f} value={f}>{f}</option>)}</select><input name="image" type="url" placeholder="Image URL (https://...)" required/><input name="price" type="number" min="1" placeholder="Price ₹" required/><input name="size" placeholder="Size e.g. M" required/><input name="color" placeholder="Color e.g. Black" required/><input name="stock" type="number" min="0" placeholder="Stock" required/><input name="sku" placeholder="Unique SKU" required/><button className="btn dark" disabled={creatingProduct}>{creatingProduct ? 'ADDING PRODUCT...' : 'ADD PRODUCT'}</button></form>{productMessage && <p role={productMessage.type === 'error' ? 'alert' : 'status'} aria-live="polite" style={{ marginTop: 16, padding: 14, borderRadius: 6, border: `1px solid ${productMessage.type === 'error' ? '#dc2626' : '#15803d'}`, color: productMessage.type === 'error' ? '#991b1b' : '#166534', background: productMessage.type === 'error' ? '#fef2f2' : '#f0fdf4', fontWeight: 600 }}>{productMessage.type === 'error' ? '⚠ ' : '✓ '}{productMessage.text}</p>}</section>
  </>;
}
