import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: "Preguntes freqüents · GironaXics",
  description: "Resol els teus dubtes sobre el funcionament de GironaXics per a famílies i centres col·laboradors de Girona.",
};

export default function PreguntesFrequents() {
  return (
    <>
      <Nav />
      <main id="main-content" className="info-page">
        <header className="info-header">
          <span className="info-subtitle">FAQ</span>
          <h1 className="info-title">Preguntes freqüents</h1>
        </header>

        <section className="info-content">
          <p style={{ textAlign: 'center', fontSize: '18px', marginBottom: '60px' }}>
            Tens dubtes sobre el funcionament del portal? A continuació responem a les preguntes més habituals de famílies i acadèmies de Girona.
          </p>

          <h2>Per a famílies</h2>

          <p><strong>1. Quin cost té fer servir GironaXics?</strong><br />
          GironaXics és un servei <strong>100% gratuït</strong> per a les famílies. El nostre objectiu és facilitar l'accés a la cultura, l'esport i el lleure local de manera gratuïta i accessible.</p>

          <p><strong>2. Com puc posar-me en contacte amb un centre?</strong><br />
          Dins la fitxa de cada activitat trobaràs un botó verd que diu <strong>✉ Contactar amb el centre</strong>. En prémer-lo, s'obrirà un formulari on podràs enviar-los un missatge de forma directa amb les teves consultes o sol·licitud d'inscripció.</p>

          <p><strong>3. GironaXics organitza directament les activitats?</strong><br />
          No. GironaXics actua exclusivament com un <strong>directori i canal de comunicació</strong>. L'organització, gestió, cobrament i responsabilitat de cada activitat depèn íntegrament del centre o club anunciant.</p>

          <p><strong>4. Com s'actualitzen els preus i horaris?</strong><br />
          Les dades mostrades al portal no es sincronitzen en temps real de forma automatitzada. Són els propis centres col·laboradors els encarregats de modificar-les des del seu panell de gestió o de comunicar-nos qualsevol actualització directament per tal que el nostre equip de suport la publiqui. Si detecteu qualsevol informació desactualitzada, us agrairem que ens ho feu saber a través del nostre formulari de <Link href="/contacte" style={{color: 'var(--verd)'}}>contacte</Link>.</p>

          <h2 style={{ marginTop: '50px' }}>Per a centres i acadèmies</h2>

          <p><strong>1. Quin cost té anunciar el meu centre a la web?</strong><br />
          Durant tot l'any 2026, la publicació i promoció del vostre centre és <strong>completament gratuïta</strong>. A partir de l'any 2027, el servei de manteniment i presència al directori passarà a tenir un cost de subscripció anual de <strong>60 euros</strong>, sense permanències ni despeses addicionals ocultes.</p>

          <p><strong>2. Quins requisits heu de complir per ser publicats?</strong><br />
          El vostre centre ha d'oferir activitats educatives, esportives, artístiques o de lleure destinades a infants i joves (de 0 a 18 anys). Geogràficament, donem cobertura tant a la ciutat de Girona com a qualsevol municipi de les <strong>comarques gironines</strong>. Així mateix, cal garantir una gestió de qualitat i un compromís professional amb les activitats oferides.</p>

          <p><strong>3. Com puc donar d'alta el meu centre o actualitzar les meves dades?</strong><br />
          Simplement visita la nostra secció <Link href="/per-a-centres" style={{color: 'var(--verd)'}}>Per als centres</Link> i omple el formulari amb les teves dades. El nostre equip es posarà en contacte amb tu de seguida.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
