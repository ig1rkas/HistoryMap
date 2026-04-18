export default function Header() {
  return (
    <header className="header">
      <div className="logo-block">
        <div className="logo-block__icon-wrap">
          <div className="logo-block__icon-inner">
            <svg
              viewBox="0 0 24 24"
              className="logo-block__svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6.5 8.5 5l7 1.5L20 5v12.5L15.5 19l-7-1.5L4 19V6.5Z" />
              <path d="M8.5 5v12.5M15.5 6.5V19" />
            </svg>
          </div>
        </div>

        <div>
          <div className="logo-block__title">HistoryMap</div>
          <div className="logo-block__subtitle">
            Интерактивная карта Санкт-Петербурга
          </div>
        </div>
      </div>

      <div className="header__actions">
        <button className="ghost-button">📅 Предложения по улучшению</button>
        <button className="ghost-button">🎧 Обратная связь</button>
      </div>

      <button className="login-button">Войти с помощью VK →</button>
    </header>
  );
}