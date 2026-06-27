export default function Hero() {
  return (
    <section className="hero">
      <h1 className="hero-title">
        <div className="line-1">Troba</div>

        {/* Contenidor de les paraules amb slider vertical en CSS pur */}
        <div className="words-container">
          <div className="words-slider">
            <div className="word-slide">
              <div className="line-2">les millors</div>
              <div className="line-3">extraescolars</div>
            </div>
            <div className="word-slide">
              <div className="line-2">els millors</div>
              <div className="line-3">tallers</div>
            </div>
            <div className="word-slide">
              <div className="line-2">les millors</div>
              <div className="line-3">activitats</div>
            </div>
            <div className="word-slide">
              <div className="line-2">els millors</div>
              <div className="line-3">casals</div>
            </div>
            {/* Repetició de la primera per a un loop infinit i fluid */}
            <div className="word-slide">
              <div className="line-2">les millors</div>
              <div className="line-3">extraescolars</div>
            </div>
          </div>
        </div>
      </h1>
      <div className="scroll-indicator">Fes scroll per descobrir</div>
    </section>
  );
}
