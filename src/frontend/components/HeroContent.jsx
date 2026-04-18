import InfoCard from './InfoCard';

export default function HeroContent() {
  return (
    <section className="hero__content">
      <div className="hero__text-wrap">
        <h1 className="hero__title">
          <span className="title-line">
            Найдите для себя интересное
          </span>
          <span className="title-line">
            историческое место <span className="accent italic">из 95</span>
          </span>
          <span className="title-line">
            <span className="accent italic">различных</span> локаций
          </span>
        </h1>

        <button className="primary-button">К поиску →</button>
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

      <div className="footer-note">
        <div className="footer-note__brand">HistoryMap</div>
        <div className="footer-note__copyright">Copyright © 2026</div>
      </div>
    </section>
  );
}