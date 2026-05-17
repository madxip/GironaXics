import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata = {
  title: "Política de privacitat · GironaXics",
  description: "Política de privacitat i protecció de dades de caràcter personal de GironaXics.",
};

export default function Privacitat() {
  return (
    <>
      <Nav />
      <main className="info-page">
        <header className="info-header">
          <span className="info-subtitle">Protecció de dades</span>
          <h1 className="info-title">Política de privacitat</h1>
        </header>

        <section className="info-content">
          <p>
            A <strong>GironaXics</strong> ens prenem molt seriosament la privacitat de les dades dels nostres usuaris. A continuació, us expliquem de manera clara i senzilla com tractem les vostres dades personals en compliment del Reglament General de Protecció de Dades (RGPD) i la Llei Orgànica de Protecció de Dades i Garantia de Drets Digitals (LOPDGDD).
          </p>

          <h2>1. Qui és el responsable del tractament de les vostres dades?</h2>
          <p>
            El responsable és <strong>GironaXics</strong>, amb domicili a Girona, i correu electrònic de contacte <a href="mailto:hola@gironaxics.cat" style={{ color: 'var(--verd)' }}>hola@gironaxics.cat</a>.
          </p>

          <h2>2. Quines dades recollim i amb quina finalitat?</h2>
          <ul>
            <li>
              <strong>Dades de contacte amb els centres:</strong> Quan utilitzeu el nostre formulari per contactar amb un centre o acadèmia de la web, les dades que hi introduïu (nom, correu electrònic, telèfon i missatge) s'utilitzen exclusivament per fer arribar la vostra petició al centre en qüestió de manera segura.
            </li>
            <li>
              <strong>Formularis de contacte general:</strong> Si us poseu en contacte directament amb GironaXics, utilitzarem les dades per respondre les vostres consultes, dubtes o sol·licituds de col·laboració.
            </li>
          </ul>

          <h2>3. Legitimació del tractament</h2>
          <p>
            La base legal per al tractament de les vostres dades és el vostre propi <strong>consentiment exprés</strong> que ens atorgueu de manera voluntària en prémer el botó d'enviar de qualsevol dels nostres formularis.
          </p>

          <h2>4. Conservació de les dades</h2>
          <p>
            Les dades de contacte facilitades es conservaran durant el temps estrictament necessari per complir amb la finalitat per a la qual van ser recollides (trametre la consulta o formalitzar el contacte amb el centre col·laborador), o bé fins que sol·liciteu la seva supressió.
          </p>

          <h2>5. Cessions de dades a tercers</h2>
          <p>
            GironaXics <strong>mai vendrà, llogarà ni cedirà les vostres dades personals</strong> a terceres empreses amb finalitats comercials o de màrqueting sense el vostre consentiment previ.
          </p>
          <p>
            L'única transferència de dades que es realitza és la que feu vosaltres directament en sol·licitar contacte amb un centre, on les vostres dades de contacte s'envien per correu electrònic al centre corresponent per tal que us pugui respondre de forma directa.
          </p>

          <h2>6. Els vostres drets</h2>
          <p>
            Podeu exercir en qualsevol moment els vostres drets d'<strong>accés, rectificació, supressió (dret a l'oblit), limitació, oposició i portabilitat</strong> de les vostres dades personals.
          </p>
          <p>
            Per fer-ho, només cal que ens envieu un correu electrònic a <a href="mailto:hola@gironaxics.cat" style={{ color: 'var(--verd)' }}>hola@gironaxics.cat</a> indicant clarament el dret que voleu exercir. Respondrem a la vostra sol·licitud al més aviat possible.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
