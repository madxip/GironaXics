import Nav from '@/components/Nav';
import Footer from '@/components/Footer';


export const metadata = {
  title: "Sobre nosaltres · GironaXics",
  description: "Descobreix la missió i valors de GironaXics, el directori de referència d'activitats extraescolars en català a Girona.",
};

export default function SobreNosaltres() {
  return (
    <>
      <Nav />
      <main className="info-page">
        <header className="info-header">
          <span className="info-subtitle">Qui som</span>
          <h1 className="info-title">Sobre GironaXics</h1>
        </header>

        <section className="info-content">
          <p>
            <strong>GironaXics</strong> és el primer directori digital dedicat exclusivament a agrupar, organitzar i promoure l'oferta d'activitats extraescolars per a nens i joves a la ciutat de Girona.
          </p>
          <p>
            La nostra missió és doble: d'una banda, volem <strong>ajudar les famílies gironines</strong> a trobar les millors propostes educatives, esportives, artístiques i tecnològiques per als seus fills d'una forma ràpida, senzilla i intuïtiva. D'altra banda, volem ser el <strong>millor aliat per als centres de la ciutat</strong>, donant visibilitat al seu talent i passió.
          </p>

          <h2>El nostre compromís</h2>
          <p>
            Creiem fermament que les extraescolars són un pilar fonamental en el creixement personal, social i intel·lectual dels infants. Per això, treballem sota tres pilars bàsics:
          </p>
          <ul>
            <li><strong>Proximitat:</strong> connectem barris, famílies i centres de Girona perquè creiem en el valor del comerç i els serveis de Km 0.</li>
            <li><strong>Qualitat editorial:</strong> seleccionem i presentem la informació de manera clara, visual i cuidada, fugint de llistats impersonals.</li>
            <li><strong>Cultura i llengua:</strong> potenciem i prioritzem l'oferta d'activitats dutes a terme en llengua catalana, enfortint el teixit educatiu local.</li>
          </ul>

          <h2>Com va néixer GironaXics?</h2>
          <p>
            GironaXics va néixer de la necessitat real de pares i mares de la ciutat que es trobaven amb dificultats per conèixer tota l'oferta extraescolar existent en un sol espai. Des d'esports tradicionals o robòtica d'última generació fins a tallers de plàstica en espais singulars de Girona, la nostra ciutat és plena d'iniciatives fantàstiques que mereixien ser descobertes.
          </p>
          <p>
            Avui, ens enorgulleix connectar cada mes centenars de famílies amb centres educatius, acadèmies, clubs esportius i associacions culturals de tot Girona.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
