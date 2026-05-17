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
                        <Link href="/preguntes-frequents" className="hoverable">Preguntes freqüents</Link>
                    </div>
                    <div>
                        <Link href="/avis-legal" className="hoverable">Avís legal</Link>
                        <Link href="/privacitat" className="hoverable">Privacitat</Link>
                    </div>
                </div>
                <div className="footer-bottom">
                    Fet amb orgull a Girona · 2026
                </div>
            </footer>
        </>
    );
}
