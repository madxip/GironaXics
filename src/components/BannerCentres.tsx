import Link from 'next/link';

export default function BannerCentres() {
  return (
    <>
      <section className="banner-centres">
        <div className="banner-grid">
          <div className="banner-title">Ets un centre?</div>
          <div className="banner-right">
            <div className="banner-desc">Suma&apos;t a la plataforma de referència de les famílies gironines i augmenta la visibilitat del teu centre.</div>
            <Link href="/per-a-centres" className="btn-black hoverable">Apunta-t&apos;hi ara</Link>
          </div>
        </div>
      </section>
    </>
  );
}
