import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

export const metadata = {
  title: "Avís legal · GironaXics",
  description: "Avís legal, condicions d'ús i responsabilitat del portal de directori GironaXics.",
};

export default function AvisLegal() {
  return (
    <>
      <Nav />
      <main className="info-page">
        <header className="info-header">
          <span className="info-subtitle">Termes legals</span>
          <h1 className="info-title">Avís legal</h1>
        </header>

        <section className="info-content">
          <p>
            Benvingut al portal web <strong>GironaXics</strong>. A continuació us facilitem les dades d'informació general d'aquest lloc web en compliment de la Llei 34/2002, d'11 de juliol, de serveis de la societat de la informació i de comerç electrònic.
          </p>

          <h2>1. Dades identificatives</h2>
          <p>
            El lloc web gironaxics.cat és una iniciativa local de caràcter informatiu sota la denominació de <strong>GironaXics</strong> (marca provisional actualment no registrada i sense personalitat jurídica pròpia), amb àmbit d'actuació a la ciutat de Girona i correu de contacte <a href="mailto:hola@gironaxics.cat" style={{color:'var(--verd)'}}>hola@gironaxics.cat</a>.
          </p>

          <h2>2. Objecte i condicions d'ús</h2>
          <p>
            L'accés i/o ús d'aquest lloc web atribueix la condició d'usuari, qui accepta plenament i sense reserves, des d'aquest accés i/o ús, les condicions generals exposades en aquest document.
          </p>
          <p>
            L'usuari es compromet a fer un ús adequat dels continguts, serveis i eines que GironaXics ofereix a través de la seva pàgina web, abstinguent-se de realitzar activitats que puguin ser considerades il·lícites, il·legals o que vulnerin la seguretat del lloc web.
          </p>

          <h2>3. Exclusió de responsabilitat</h2>
          <p>
            GironaXics actua exclusivament com un <strong>directori informatiu</strong>. No ens fem responsables en cap cas dels danys i perjudicis de qualsevol naturalesa que puguin derivar-se de l'ús de la informació publicada, d'errors o omissions en els continguts (tot i que treballem diàriament per verificar la seva exactitud), o de la falta de disponibilitat del portal.
          </p>
          <p>
            així mateix, qualsevol relació contractual, inscripció, servei o pagament realitzat entre els usuaris (famílies) i els centres col·laboradors publicats en aquesta web, s'estableix exclusivament entre ambdues parts, quedant GironaXics totalment al marge d'aquesta relació comercial.
          </p>

          <h2>4. Propietat intel·lectual i industrial</h2>
          <p>
            Tots els continguts de la web (incloent textos, logotips, gràfics, disseny, codi font i elements de la marca "GironaXics") són propietat intel·lectual de GironaXics o bé disposen de les llicències i autoritzacions corresponents. Queda prohibida la reproducció total o parcial dels continguts d'aquest lloc web sense autorització expressa i per escrit per part del propietari.
          </p>

          <h2>5. Enllaços externs (links)</h2>
          <p>
            Aquesta pàgina web conté enllaços cap a altres llocs web d'Internet gestionats per tercers (com ara webs de clubs, escoles o acadèmies). GironaXics no exerceix cap tipus de control sobre aquests llocs web externs i no assumeix cap responsabilitat pel seu funcionament, disponibilitat o pels continguts allà publicats.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
