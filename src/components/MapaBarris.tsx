import Link from 'next/link';
import { Activitat } from '@/lib/types';
import AccordionCategoria from './AccordionCategoria';
import { normalizeSlug } from '@/lib/airtable';

export default function MapaBarris({ 
  activitats, 
  activeBarri = 'Tots' 
}: { 
  activitats: Activitat[], 
  activeBarri?: string 
}) {
  const filtered = activeBarri === 'Tots' 
    ? activitats 
    : activitats.filter(a => normalizeSlug(a.barri) === normalizeSlug(activeBarri));

  const isTots = activeBarri === 'Tots';

  return (
    <section className="map-section grid-12">
        <div className="map-container">
            <svg className="map-svg" viewBox="0 0 600 700" xmlns="http://www.w3.org/2000/svg">
                <Link href="/barris/nord" className={`map-group hoverable ${normalizeSlug(activeBarri) === 'nord' ? 'active' : ''}`}>
                    <polygon className="map-path" points="368.23840175367854,69 368.23840175367854,151 297.22431864335454,192 226.21023553303056,151 226.21023553303058,69 297.22431864335454,28" />
                    <text x="297.22431864335454" y="114" className="map-label" style={{fontSize: '16px'}}>Nord</text>
                </Link>
                <Link href="/barris/oest" className={`map-group hoverable ${normalizeSlug(activeBarri) === 'oest' ? 'active' : ''}`}>
                    <polygon className="map-path" points="294.6262424320013,196.5 294.6262424320013,278.5 223.61215932167727,319.5 152.5980762113533,278.5 152.59807621135332,196.5 223.61215932167724,155.5" />
                    <text x="223.61215932167727" y="241.5" className="map-label" style={{fontSize: '16px'}}>Oest</text>
                </Link>
                <Link href="/barris/montjuic" className={`map-group hoverable ${normalizeSlug(activeBarri) === 'montjuic' ? 'active' : ''}`}>
                    <polygon className="map-path" points="441.8505610753558,196.5 441.8505610753558,278.5 370.8364779650318,319.5 299.8223948547078,278.5 299.82239485470785,196.5 370.8364779650318,155.5" />
                    <text x="370.8364779650318" y="241.5" className="map-label" style={{fontSize: '16px'}}>Montjuïc</text>
                </Link>
                <Link href="/barris/santa-eugenia" className={`map-group hoverable ${normalizeSlug(activeBarri) === 'santa-eugenia' ? 'active' : ''}`}>
                    <polygon className="map-path" points="221.01408311032398,324 221.01408311032398,406 150,447 78.98591688967602,406 78.98591688967603,324 149.99999999999997,283" />
                    <text x="150" y="357" className="map-label" style={{fontSize: '16px'}}>Santa</text>
                    <text x="150" y="379" className="map-label" style={{fontSize: '16px'}}>Eugènia</text>
                </Link>
                <Link href="/barris/centre" className={`map-group hoverable ${normalizeSlug(activeBarri) === 'centre' ? 'active' : ''}`}>
                    <polygon className="map-path" points="368.23840175367854,324 368.23840175367854,406 297.22431864335454,447 226.21023553303056,406 226.21023553303058,324 297.22431864335454,283" />
                    <text x="297.22431864335454" y="369" className="map-label" style={{fontSize: '16px'}}>Centre</text>
                </Link>
                <Link href="/barris/est" className={`map-group hoverable ${normalizeSlug(activeBarri) === 'est' ? 'active' : ''}`}>
                    <polygon className="map-path" points="515.4627203970331,324 515.4627203970331,406 444.44863728670913,447 373.4345541763852,406 373.4345541763852,324 444.44863728670913,283" />
                    <text x="444.44863728670913" y="369" className="map-label" style={{fontSize: '16px'}}>Est</text>
                </Link>
                <Link href="/barris/mas-xirgu" className={`map-group hoverable ${normalizeSlug(activeBarri) === 'mas-xirgu' ? 'active' : ''}`}>
                    <polygon className="map-path" points="294.6262424320013,451.5 294.6262424320013,533.5 223.61215932167727,574.5 152.5980762113533,533.5 152.59807621135332,451.5 223.61215932167724,410.5" />
                    <text x="223.61215932167727" y="484.5" className="map-label" style={{fontSize: '16px'}}>Mas</text>
                    <text x="223.61215932167727" y="506.5" className="map-label" style={{fontSize: '16px'}}>Xirgu</text>
                </Link>
                <Link href="/barris/eixample" className={`map-group hoverable ${normalizeSlug(activeBarri) === 'eixample' ? 'active' : ''}`}>
                    <polygon className="map-path" points="441.8505610753558,451.5 441.8505610753558,533.5 370.8364779650318,574.5 299.8223948547078,533.5 299.82239485470785,451.5 370.8364779650318,410.5" />
                    <text x="370.8364779650318" y="496.5" className="map-label" style={{fontSize: '16px'}}>Eixample</text>
                </Link>
                <Link href="/barris/sud" className={`map-group hoverable ${normalizeSlug(activeBarri) === 'sud' ? 'active' : ''}`}>
                    <polygon className="map-path" points="368.23840175367854,579 368.23840175367854,661 297.22431864335454,702 226.21023553303056,661 226.21023553303058,579 297.22431864335454,538" />
                    <text x="297.22431864335454" y="624" className="map-label" style={{fontSize: '16px'}}>Sud</text>
                </Link>
            </svg>
            <ul className="map-legend">
                <li className={`hoverable ${isTots ? 'active' : ''}`}><Link href="/barris/tots" style={{color:'inherit', textDecoration:'none'}}>Tots</Link></li>
                <li className={`hoverable ${normalizeSlug(activeBarri) === 'centre' ? 'active' : ''}`}><Link href="/barris/centre" style={{color:'inherit', textDecoration:'none'}}>Centre</Link></li>
                <li className={`hoverable ${normalizeSlug(activeBarri) === 'eixample' ? 'active' : ''}`}><Link href="/barris/eixample" style={{color:'inherit', textDecoration:'none'}}>Eixample</Link></li>
                <li className={`hoverable ${normalizeSlug(activeBarri) === 'est' ? 'active' : ''}`}><Link href="/barris/est" style={{color:'inherit', textDecoration:'none'}}>Est</Link></li>
                <li className={`hoverable ${normalizeSlug(activeBarri) === 'mas-xirgu' ? 'active' : ''}`}><Link href="/barris/mas-xirgu" style={{color:'inherit', textDecoration:'none'}}>Mas Xirgu</Link></li>
                <li className={`hoverable ${normalizeSlug(activeBarri) === 'montjuic' ? 'active' : ''}`}><Link href="/barris/montjuic" style={{color:'inherit', textDecoration:'none'}}>Montjuïc</Link></li>
                <li className={`hoverable ${normalizeSlug(activeBarri) === 'nord' ? 'active' : ''}`}><Link href="/barris/nord" style={{color:'inherit', textDecoration:'none'}}>Nord</Link></li>
                <li className={`hoverable ${normalizeSlug(activeBarri) === 'oest' ? 'active' : ''}`}><Link href="/barris/oest" style={{color:'inherit', textDecoration:'none'}}>Oest</Link></li>
                <li className={`hoverable ${normalizeSlug(activeBarri) === 'santa-eugenia' ? 'active' : ''}`}><Link href="/barris/santa-eugenia" style={{color:'inherit', textDecoration:'none'}}>Santa Eugènia</Link></li>
                <li className={`hoverable ${normalizeSlug(activeBarri) === 'sud' ? 'active' : ''}`}><Link href="/barris/sud" style={{color:'inherit', textDecoration:'none'}}>Sud</Link></li>
            </ul>
        </div>
        <div className="map-results">
            <h2>Busca per barri</h2>
            <div className="filters" id="map-filters">
                <div className="filter-pill active hoverable">Totes les edats</div>
                <div className="filter-pill hoverable">Infantil (3-5)</div>
                <div className="filter-pill hoverable">Primària (6-11)</div>
                <div className="filter-pill hoverable">ESO (12-16)</div>
            </div>
            <div id="results-container">
                {filtered.length === 0 ? (
                    <div className="results-empty">No hi ha activitats llistades per aquest barri encara.</div>
                ) : (
                    <div className="results-list">
                        {Object.entries(
                          filtered.reduce((acc, a) => {
                            const cat = a.categoria || 'Altres';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(a);
                            return acc;
                          }, {} as Record<string, Activitat[]>)
                        )
                        .sort(([catA], [catB]) => catA.localeCompare(catB))
                        .map(([categoria, activitatsCat]) => (
                            <AccordionCategoria key={categoria} categoria={categoria} activitats={activitatsCat} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </section>
  );
}
