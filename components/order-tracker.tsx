type Props = { status: string; paymentStatus: string; paymentMethod: string };
const steps = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
const labels = ['Placed', 'Accepted', 'Packed', 'Shipped', 'Delivered'];
export function OrderTracker({ status, paymentStatus, paymentMethod }: Props) {
  if (status === 'CANCELLED') return <div className="tracking-cancelled" role="status">✕ Order cancelled / rejected{paymentStatus === 'PAID' ? ' — refund is pending manual processing' : ''}</div>;
  const index = steps.indexOf(status);
  const awaiting = paymentMethod === 'ONLINE' && paymentStatus !== 'PAID';
  return <div className="tracking-wrap"><div className="tracking-steps" aria-label="Order progress">{steps.map((step, i) => <div className={'tracking-step ' + (i <= index ? 'complete' : '')} key={step}><span className="tracking-dot">{i <= index ? '✓' : i + 1}</span><span>{labels[i]}</span></div>)}</div>{awaiting && <small className="tracking-note">Online payment not yet verified. Fulfilment begins after successful payment.</small>}</div>;
}
