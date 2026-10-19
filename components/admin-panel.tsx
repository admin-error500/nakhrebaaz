"use client";
import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryEditor, type InventoryProduct } from './inventory-editor';
import { SaleManagement, type SaleAdminCampaign } from './sale-management';
type Product = InventoryProduct & {saleDiscountPercent:number};
type Order = { id: string; name: string; email: string; total: number; status: string; paymentMethod: string; paymentStatus: string; addressJson: string; createdAt: string; items: { name: string; size: string; color: string; quantity: number }[] };
const transitions: Record<string, { label: string; value: string }[]> = {
  PENDING: [{ label: 'Accept order', value: 'CONFIRMED' }, { label: 'Reject order', value: 'CANCELLED' }],
  CONFIRMED: [{ label: 'Mark packed', value: 'PACKED' }, { label: 'Cancel order', value: 'CANCELLED' }],
  PACKED: [{ label: 'Mark shipped', value: 'SHIPPED' }],
  SHIPPED: [{ label: 'Mark delivered', value: 'DELIVERED' }],
};
const money = (n: number) => '₹' + n.toLocaleString('en-IN');
const MAX_IMAGE_SIZE = 500 * 1024;
export function AdminPanel({ products = [], orders = [], totalSold = 0, totalAvailable = 0, saleSettings, view = 'all', nextCursor:initialCursor=null }: { products?: Product[]; orders?: Order[]; totalSold?: number; totalAvailable?: number; saleSettings?: SaleAdminCampaign; view?: 'all' | 'orders' | 'images' | 'new'; nextCursor?:string|null }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [productMessage, setProductMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [orderRows,setOrderRows]=useState<Order[]>(orders);
  useEffect(()=>{if(view==="orders"){setOrderRows(orders);setNextCursor(initialCursor);}},[orders,initialCursor,view]);
  const [nextCursor,setNextCursor]=useState(initialCursor);
  const [loadingPage,setLoadingPage]=useState(false);
  const [pageError,setPageError]=useState("");
  const pageRequest=useRef(0);
  useEffect(()=>{
   if(view!=="orders")return;
   const controller=new AbortController();
   const request=++pageRequest.current;
   const timer=setTimeout(async()=>{
    setLoadingPage(true);setPageError("");
    try{
     const q=new URLSearchParams({status:filter,q:search.trim()});
     const res=await fetch("/api/admin/orders/page?"+q.toString(),{cache:"no-store",signal:controller.signal});
     const json=await res.json() as {orders?:Order[];nextCursor?:string|null;error?:string};
     if(!res.ok)throw new Error(json.error||"Unable to filter orders");
     if(request!==pageRequest.current)return;
     setOrderRows(json.orders??[]);
     setNextCursor(json.nextCursor??null);
    }catch(e){if(!controller.signal.aborted)setPageError(e instanceof Error?e.message:"Unable to load orders");}
    finally{if(request===pageRequest.current)setLoadingPage(false);}
   },search||filter!=="ALL"?350:0);
   return()=>{clearTimeout(timer);controller.abort();};
  },[filter,search,view]);
  async function loadMoreOrders(){
   if(!nextCursor||loadingPage)return;
   const request=pageRequest.current;
   setLoadingPage(true);setPageError("");
   try{
    const q=new URLSearchParams({status:filter,q:search.trim(),cursor:nextCursor});
    const res=await fetch("/api/admin/orders/page?"+q.toString(),{cache:"no-store"});
    const json=await res.json() as {orders?:Order[];nextCursor?:string|null;error?:string};
    if(!res.ok)throw new Error(json.error||"Unable to fetch next orders");
    if(request!==pageRequest.current)return;
    setOrderRows(prev=>{const ids=new Set(prev.map(p=>p.id));return [...prev,...(json.orders??[]).filter(p=>!ids.has(p.id))];});
    setNextCursor(json.nextCursor??null);
   }catch(e){if(request===pageRequest.current)setPageError(e instanceof Error?e.message:"Load failed");}
   finally{if(request===pageRequest.current)setLoadingPage(false);}
  }

  const [working, setWorking] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const totalOrders = orders.length;
  const totalPayments = orders.filter(order => order.paymentStatus === 'PAID').reduce((sum, order) => sum + order.total, 0);
  async function generateImageLink() {
    if (!imageFile) { setImageError('Choose an image first.'); return; }
    if (imageFile.size > MAX_IMAGE_SIZE) { setImageError('Image must be 500 KB or smaller.'); return; }
    setImageBusy(true); setImageError('');
    try {
      const data = new FormData();
      data.append('file', imageFile);
      const response = await fetch('/api/admin/image-upload', { method: 'POST', body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.url !== 'string') throw new Error(result.error || 'Image upload failed');
      setImageUrl(result.url);
    } catch (error) { setImageError(error instanceof Error ? error.message : 'Upload failed'); }
    finally { setImageBusy(false); }
  }
  const visible = useMemo(() => view==='orders'?orderRows:orders.filter(o => (filter === 'ALL' || o.status === filter) && [o.id, o.name, o.email].some(v => v.toLowerCase().includes(search.toLowerCase()))), [orders, orderRows,filter,search,view]);
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
    {view === 'all' && <>
    <nav className="admin-section-nav" aria-label="Admin dashboard sections">
      <a href="#manage-orders">Manage Orders</a>
      <a href="#inventory">Inventory</a>
      <a href="#image-link-generator">Image Link Generator</a>
      <a href="#add-product">Add Product</a>
      <a href="#sale-management">Sale Management</a>
    </nav>
    <section className="admin-block" aria-label="Store performance">
      <div className="admin-heading"><div><span className="eyebrow">STORE OVERVIEW</span><h2>ORDER & PAYMENT SUMMARY</h2></div></div>
      <div className="admin-summary-grid">
        <div className="admin-summary-stat"><small>TOTAL ORDERS</small><strong>{totalOrders}</strong><span>Includes orders in all statuses</span></div>
        <div className="admin-summary-stat"><small>TOTAL PAYMENT RECEIVED</small><strong>{money(totalPayments)}</strong><span>Orders marked PAID, including paid COD; before refunds</span></div>
      </div>
    </section>
</>}
    {(view === 'all' || view === 'orders') && <>
    <section className="admin-block" id="manage-orders">
      <div className="admin-heading"><div><span className="eyebrow">LIVE FULFILMENT</span><h2>MANAGE ORDERS</h2></div><span className="admin-count">{visible.length} ORDERS</span></div>
      <div className="admin-toolbar"><input aria-label="Search orders" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order ID, name or email" /><select aria-label="Filter orders" value={filter} onChange={e => setFilter(e.target.value)}>{['ALL','PENDING','CONFIRMED','PACKED','SHIPPED','DELIVERED','CANCELLED'].map(s => <option key={s}>{s}</option>)}</select></div>
      {message && <p role="status" className="admin-notice">{message}</p>}
      {pageError&&<p role="alert" className="error">{pageError}</p>}
      {visible.length === 0 ? <p>No orders match your filter.</p> : <div className="admin-order-list">{visible.map(o => {
        let address: Record<string, unknown> = {};
        try { const parsed: unknown = JSON.parse(o.addressJson); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) address = parsed as Record<string, unknown>; } catch {}
        const options = (transitions[o.status] ?? []).filter(opt => opt.value === 'CANCELLED' || o.paymentMethod !== 'ONLINE' || o.paymentStatus === 'PAID');
        return <article key={o.id} className="admin-order-card">
          <div className="admin-order-top"><div><span className="eyebrow">ORDER #{o.id.slice(-8).toUpperCase()}</span><h3>{o.name}</h3><small>{o.email} · {new Date(o.createdAt).toLocaleString('en-IN')}</small></div><span className={'admin-status status-' + o.status.toLowerCase()}>{o.status}</span></div>
          <details className="admin-order-details">
            <summary>OPEN ORDER / VERIFY PACKING DETAILS</summary>
            <div className="admin-order-columns">
              <div>
                <strong>PRODUCTS TO PACK</strong>
                <ol className="admin-packing-items">
                  {o.items.map((item, index) => (
                    <li key={index}>
                      <strong>{item.name}</strong>
                      <span>Size: {item.size} · Color: {item.color} · Quantity: {item.quantity}</span>
                      <label><input type="checkbox" /> Checked before packing</label>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <strong>DELIVERY ADDRESS</strong>
                <p>{[address.name,address.phone,address.line1,address.city,address.state,address.pincode].filter(Boolean).map(String).join(', ') || 'Address unavailable'}</p>
              </div>
              <div>
                <strong>PAYMENT DETAILS</strong>
                <p>{o.paymentMethod} · {o.paymentStatus}</p>
                <strong>{money(o.total)}</strong>
              </div>
            </div>
            <p className="admin-packing-note">Verify product, size, color, quantity and customer address before marking an order packed. This checklist is a visual aid and is not saved.</p>
          </details>
          <div className="admin-order-actions">{options.map(opt => <button key={opt.value} type="button" className={'admin-action ' + (opt.value === 'CANCELLED' ? 'danger' : '')} disabled={working === o.id} onClick={() => update(o,opt.value)}>{working === o.id ? 'UPDATING...' : opt.label}</button>)}{o.paymentMethod === 'COD' && o.status === 'DELIVERED' && o.paymentStatus !== 'PAID' && <button type="button" className="admin-action" disabled={working === o.id} onClick={() => markCodReceived(o)}>MARK COD PAYMENT RECEIVED</button>}{options.length === 0 && <small>{o.status === 'CANCELLED' ? 'Order cancelled' : o.status === 'DELIVERED' ? 'Order delivered' : 'Awaiting verified payment'}</small>}{o.status === 'CANCELLED' && o.paymentStatus === 'PAID' && <strong className="refund-warning">Paid order: check refund in Razorpay</strong>}</div>
        </article>;
      })}</div>}
      {view==="orders"&&nextCursor&&<button type="button" className="load-next-batch" disabled={loadingPage} onClick={()=>void loadMoreOrders()}>{loadingPage?"LOADING…":"SHOW NEXT 20 ORDERS ↓"}</button>}
    </section>
</>}
    {view === 'all' && <>
    <InventoryEditor products={products} totalSold={totalSold} totalAvailable={totalAvailable} />
    <SaleManagement initial={saleSettings!} products={products.map(p=>({id:p.id,name:p.name,price:p.price,category:p.category,image:p.image,discountPercent:p.saleDiscountPercent}))} />
</>}
    {(view === 'all' || view === 'images') && <>
    <section className="admin-block" id="image-link-generator">
      <div className="admin-heading"><div><span className="eyebrow">PRODUCT MEDIA</span><h2>IMAGE LINK GENERATOR</h2></div></div>
      <p>Upload a JPG, PNG or WebP product image (maximum 500 KB). A public image link will be generated for your product.</p>
      <div className="admin-image-generator">
        <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose product image" onChange={e => { const file = e.target.files?.[0] || null; setImageUrl(''); if (file && file.size > MAX_IMAGE_SIZE) { setImageFile(null); setImageError('Image must be 500 KB or smaller.'); e.target.value = ''; } else { setImageFile(file); setImageError(''); } }} />
        <button type="button" className="btn dark" disabled={imageBusy || !imageFile} onClick={generateImageLink}>{imageBusy ? 'UPLOADING...' : 'UPLOAD & GENERATE LINK'}</button>
        {imageError && <p role="alert" className="error">{imageError}</p>}
        {imageUrl && <div><label>Generated image URL<input readOnly value={imageUrl} onFocus={e => e.currentTarget.select()} /></label><button type="button" className="admin-action" onClick={() => navigator.clipboard.writeText(imageUrl)}>COPY LINK</button><p><img src={imageUrl} alt="Uploaded product preview" style={{maxWidth:190,maxHeight:190,objectFit:'contain'}} /></p></div>}
      </div>
    </section>
</>}
    {(view === 'all' || view === 'new') && <>
    <section className="admin-block" id="add-product"><div className="admin-heading"><div><span className="eyebrow">NEW ARRIVALS</span><h2>ADD PRODUCT</h2></div></div><form className="admin-form" onSubmit={create}><input name="name" placeholder="Product name" required/><input name="description" placeholder="Description" required/><select name="category"><option>Men</option><option>Women</option><option>Kids</option></select><select name="festival" aria-label="Festival collection"><option value="">No festival / Everyday</option>{["Diwali","Holi","Navratri","Raksha Bandhan","Eid","Christmas"].map(f => <option key={f} value={f}>{f}</option>)}</select><input name="image" type="url" placeholder="Image URL (https://...)" required/><input name="price" type="number" min="1" placeholder="Price ₹" required/><input name="size" placeholder="Size e.g. M" required/><input name="color" placeholder="Color e.g. Black" required/><input name="stock" type="number" min="0" placeholder="Stock" required/><input name="sku" placeholder="Unique SKU" required/><button className="btn dark" disabled={creatingProduct}>{creatingProduct ? 'ADDING PRODUCT...' : 'ADD PRODUCT'}</button></form>{productMessage && <p role={productMessage.type === 'error' ? 'alert' : 'status'} aria-live="polite" style={{ marginTop: 16, padding: 14, borderRadius: 6, border: `1px solid ${productMessage.type === 'error' ? '#dc2626' : '#15803d'}`, color: productMessage.type === 'error' ? '#991b1b' : '#166534', background: productMessage.type === 'error' ? '#fef2f2' : '#f0fdf4', fontWeight: 600 }}>{productMessage.type === 'error' ? '⚠ ' : '✓ '}{productMessage.text}</p>}</section>
</>}
  </>;
}
