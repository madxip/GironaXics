export default function Footer() {
    return (
        <>
            <footer>
                <div className="footer-logo">
                    <span>Girona</span><span>Xics</span>
                </div>
                <div className="footer-links">
                    <div>
                        <a href="#" className="hoverable">Sobre nosaltres</a>
                        <a href="#" className="hoverable">Contacte</a>
                    </div>
                    <div>
                        <a href="#" className="hoverable">Per als centres</a>
                        <a href="#" className="hoverable">Preguntes freqüents</a>
                    </div>
                    <div>
                        <a href="#" className="hoverable">Avís legal</a>
                        <a href="#" className="hoverable">Privacitat</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    Fet amb orgull a Girona · 2026
                </div>
            </footer>
        </>
    );
}
