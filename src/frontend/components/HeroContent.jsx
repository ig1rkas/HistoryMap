import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPlacesCount } from '../api/client';
import InfoCard from './InfoCard';

export default function HeroContent() {
  const [placesCount, setPlacesCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getPlacesCount()
      .then((data) => {
        if (!cancelled) setPlacesCount(data.count);
      })
      .catch(() => {
        if (!cancelled) setPlacesCount(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const countText = placesCount ?? 69;

  return (
    <section className="hero__content">
      <div className="hero__text-wrap">
        <h1 className="hero__title">
          <span className="title-line">Найдите для себя интересное</span>
          <span className="title-line">
            историческое место <span className="accent italic">из {countText} </span>
          </span>
          <span className="title-line">
             <span className="accent italic">различных</span> локаций
          </span>
        </h1>

        <Link to="/map" className="primary-button">
          К поиску <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="info-cards">
        <InfoCard
          tone="green"
          title="Проверенные места"
          text="Специально для Вас мы отобрали самые интересные места Санкт-Петербурга"
        />

        <div className="info-cards__offset">
          <InfoCard
            tone="purple"
            title="Выбирайте по интересам"
            text="Настройте фильтры под свои интересы: архитектура, тип, локация или эпоха"
          />
        </div>
      </div>
    </section>
  );
}
