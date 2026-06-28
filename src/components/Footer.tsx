import Link from 'next/link';

export default function Footer() {
    return (
        <>
            <footer>
                <Link href="/" className="footer-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span>Girona</span><span>Xics</span>
                </Link>
                <div className="footer-links">
                    <div>
                        <Link href="/sobre-nosaltres" className="hoverable">Sobre nosaltres</Link>
                        <Link href="/contacte" className="hoverable">Contacte</Link>
                    </div>
                    <div>
                        <Link href="/per-a-centres" className="hoverable">Per als centres</Link>
                        <Link href="/patrocinis" className="hoverable">Patrocinis / Partners</Link>
                        <Link href="/preguntes-frequents" className="hoverable">Preguntes freqüents</Link>
                    </div>
                    <div>
                        <Link href="/avis-legal" className="hoverable">Avís legal</Link>
                        <Link href="/privacitat" className="hoverable">Privacitat</Link>
                    </div>
                </div>
                <div className="footer-social">
                    <a href="https://www.instagram.com/gironaxics/" target="_blank" rel="noopener noreferrer" className="hoverable" aria-label="Instagram de GironaXics">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                        </svg>
                    </a>
                </div>
                <div className="footer-bottom">
                    Fet amb orgull a Girona · 2026
                </div>
            </footer>
        </>
    );
}
