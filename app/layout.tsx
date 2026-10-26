import './styles.css';
import {SocialLinks} from '@/components/social-links';
import Link from 'next/link';
import Script from 'next/script';
import { currentUser } from '@/lib/auth';
import { CartProvider, CartCount } from '@/components/cart';
import { MobileHeaderMenu } from '@/components/mobile-header-menu';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';

export const metadata = {
  title: 'Nakhrebaaz | Wear Your Nakhra',
  description: 'Expressive tees, hoodies, Nakhra Mugs, keychains and caps that show off your style.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && /^ca-pub-\d{16}$/.test(process.env.NEXT_PUBLIC_ADSENSE_CLIENT) && <Script async strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`} crossOrigin="anonymous" />}
        <CartProvider>
          <div className="announcement"><span className="announcement-primary">FREE SHIPPING ON ₹{FREE_SHIPPING_THRESHOLD.toLocaleString("en-IN")}+ ORDERS</span><span className="announcement-divider" aria-hidden="true">✦</span><span className="announcement-secondary">NEW DROPS EVERY WEEK</span><span className="announcement-divider" aria-hidden="true">✦</span><span className="announcement-secondary">WEAR YOUR NAKHRA</span></div>
          <header className="header">
            <Link className="logo" href="/" aria-label="Nakhrebaaz home"><img src="/nakhrebaaz-storefront-logo.png" alt="NakhreBaaz — Wear Your Nakhra" width={300} height={115} className="brand-logo-img"/></Link>
            <nav aria-label="Main navigation" className="main-nav">
              <Link href="/shop?category=Men#shop">MEN</Link>
              <Link href="/shop?category=Women#shop">WOMEN</Link>
              <Link href="/shop?category=Kids#shop">KIDS</Link>
              <Link href="/shop">SHOP ALL</Link>
              <Link href="/shop?category=Accessories#shop">ACCESSORIES</Link>
            </nav>
            <div className="header-actions">
              {user ? <Link className="header-account-link" href="/account" aria-label="My profile">MY PROFILE</Link> : <Link className="header-account-link" href="/login">LOGIN</Link>}
              {user?.role === 'ADMIN' && <Link className="header-admin-link" href="/admin">ADMIN</Link>}
              <Link className="bag-link" href="/cart" aria-label="Shopping bag">BAG <span className="bag-count"><CartCount /></span></Link>
              <MobileHeaderMenu signedIn={Boolean(user)} isAdmin={user?.role === "ADMIN"} />
            </div>
          </header>
          {children}
          
<footer className="site-footer">
  <div className="footer-brand">
    <img
      src="/nakhrebaaz-storefront-logo.png"
      alt="NakhreBaaz"
      className="footer-logo-img"
    />
    <p>
      Not just clothes. It’s an attitude.
      <br />
      Made to wear your Nakhra.
    </p>
  </div>

  <div className="footer-column">
    <strong>EXPLORE</strong>
    <Link href="/shop?category=Men#shop">Men</Link>
    <Link href="/shop?category=Women#shop">Women</Link>
    <Link href="/shop?category=Kids#shop">Kids</Link>
    <Link href="/shop?category=Accessories#shop">Accessories</Link>
  </div>

  <div className="footer-column footer-social">
    <strong>FOLLOW OUR NAKHRA</strong>
    <SocialLinks />
  </div>

  <div className="footer-column">
    <strong>YOUR ACCOUNT</strong>
    <Link href="/account/orders">Orders</Link>
    <Link href="/cart">Shopping bag</Link>
    <Link href="/login">Sign in</Link>
  </div>

  <div className="footer-column">
    <strong>GOOD TO KNOW</strong>
    <Link href="/policies/privacy">Privacy Policy</Link>
    <Link href="/policies/terms">Terms &amp; Conditions</Link>
    <Link href="/policies/returns">Refund &amp; Return Policy</Link>
    <Link href="/policies/shipping">Shipping Policy</Link>
    <Link href="/policies/disclaimer">Product Disclaimer</Link>
  </div>

  <small className="footer-copyright">
    © {new Date().getFullYear()} NakhreBaaz · Product photos
    and promotions are demo content until replaced.
  </small>
</footer>
        </CartProvider>
      </body>
    </html>
  );
}
