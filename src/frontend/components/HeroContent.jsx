import { Link } from 'react-router-dom';
import InfoCard from './InfoCard';

export default function HeroContent() {
  return (
    <section className="hero__content">
      <div className="hero__text-wrap">
        <h1 className="hero__title">
          <span className="title-line">Интерактивная карта по развитию</span>
          <span className="title-line">
            домов быта в Санкт-Петербурге - 
          </span>
          <span className="title-line">
            <span className="accent italic">9 различных</span> домов
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