import Link from 'next/link';

export default function BannerPartners() {
  return (
    <>
      <section className="banner-partners">
        <div className="banner-grid">
          <div className="banner-title">Vols ser partner?</div>
          <div className="banner-right">
            <div className="banner-desc">
              Destaca la teva marca de forma exclusiva a les nostres categories. El teu banner es veurà fix (sticky) en els resultats de cerca.
            </div>
            <Link href="/patrocinis" className="btn-partner hoverable">Descobreix on sortiràs posicionat →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
