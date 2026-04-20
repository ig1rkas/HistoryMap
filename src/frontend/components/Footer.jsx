export default function Footer({ className = '' }) {
  return (
    <footer className={`site-footer ${className}`.trim()}>
      <span className="site-footer__brand">HistoryMap</span>
      <span className="site-footer__copy">Copyright © 2026</span>
    </footer>
  );
}