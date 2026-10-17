import './styles.css';
import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { CartProvider, CartCount } from '@/components/cart';

export const metadata = {
  title: 'Nakhrebaaz | Wear Your Nakhra',
  description: 'Expressive T-shirts, hoodies and sweatshirts for men, women and kids.',
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <div className="announcement">FREE SHIPPING ABOVE ₹1,499 <span>✦</span> NEW DROPS EVERY WEEK <span>✦</span> WEAR YOUR NAKHRA</div>
          <header className="header">
            <Link className="logo" href="/" aria-label="Nakhrebaaz home"><img src="/nakhrebaaz-logo.png" alt="NakhreBaaz" className="brand-logo-img"/></Link>
            <nav aria-label="Main navigation" className="main-nav">
              <Link href="/?category=Men#shop">MEN</Link>
              <Link href="/?category=Women#shop">WOMEN</Link>
              <Link href="/?category=Kids#shop">KIDS</Link>
              <Link href="/#shop">SHOP ALL</Link>
            </nav>
            <div className="header-actions">
              {user ? <Link href="/account" aria-label="My account">ACCOUNT</Link> : <Link href="/login">LOGIN</Link>}
              {user?.role === 'ADMIN' && <Link href="/admin">ADMIN</Link>}
              <Link className="bag-link" href="/cart" aria-label="Shopping bag">BAG <span className="bag-count"><CartCount /></span></Link>
            </div>
          </header>
          {children}
          
<footer className="site-footer">
  <div className="footer-brand">
    <img
      src="/nakhrebaaz-logo.png"
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
    <Link href="/?category=Men#shop">Men</Link>
    <Link href="/?category=Women#shop">Women</Link>
    <Link href="/?category=Kids#shop">Kids</Link>
  </div>

  <div className="footer-column">
    <strong>YOUR ACCOUNT</strong>
    <Link href="/account">Orders</Link>
    <Link href="/cart">Shopping bag</Link>
    <Link href="/login">Sign in</Link>
  </div>

  <div className="footer-column">
    <strong>GOOD TO KNOW</strong>
    <p>Shipping across India</p>
    <p>Secure checkout</p>
    <p>Contact and policies: add verified details before launch</p>
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
