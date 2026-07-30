"use client";

export default function Hero() {

  return (
    <section className="hero">
      {/* Subtítol de localització mòbil */}
      <div className="hero-mobile-location">
        GIRONA, CATALUNYA
      </div>

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

      <style jsx>{`
        .hero-mobile-location {
          display: none;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 800;
          color: var(--taronja, #d95738);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .hero-mobile-search-form {
          display: none;
          width: 100%;
          margin-top: 24px;
        }

        .hero-mobile-search-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1.5px solid var(--crema-fosca, #eae2d1);
          border-radius: 40px;
          padding: 6px 6px 6px 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        }

        .hero-mobile-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 15px;
          font-family: inherit;
          color: var(--verd-fosc, #1b3d2f);
        }

        .hero-mobile-input::placeholder {
          color: #a0aec0;
        }

        .hero-mobile-search-btn {
          background-color: var(--verd, #1b3d2f);
          color: #ffffff;
          border: none;
          border-radius: 30px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }

        @media (max-width: 768px) {
          .hero-mobile-location {
            display: block;
          }
          .hero-mobile-search-form {
            display: block;
          }
        }
      `}</style>
    </section>
  );
}
