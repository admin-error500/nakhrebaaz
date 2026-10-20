// Shared shipping threshold for storefront messaging, cart and server checkout.
// Keep marketing copy and customer charges in sync.
export const FREE_SHIPPING_MINIMUM = 999;
export const STANDARD_SHIPPING_FEE = 99;

export function shippingFee(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_MINIMUM ? 0 : STANDARD_SHIPPING_FEE;
}
