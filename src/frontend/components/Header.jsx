import logo from '../assets/images/logo.png';
import noteIcon from '../assets/images/note.png';
import headphonesIcon from '../assets/images/headphones.png';

export default function Header() {
  return (
    <header className="header">
      <div className="logo-block">
        <div className="logo-block__icon-wrap">
          <img src={logo} alt="HistoryMap" className="logo-block__image" />
        </div>

        <div className="logo-block__text">
          <div className="logo-block__title">HistoryMap</div>
          <div className="logo-block__subtitle">
            Интерактивная карта Санкт-Петербурга
          </div>
        </div>
      </div>

      <div className="header__actions">
        <button className="ghost-button ghost-button--with-icon" type="button">
          <img src={noteIcon} alt="" className="ghost-button__icon-image" />
          <span>Предложения по улучшению</span>
        </button>

        <button className="ghost-button ghost-button--with-icon" type="button">
          <img
            src={headphonesIcon}
            alt=""
            className="ghost-button__icon-image"
          />
          <span>Обратная связь</span>
        </button>
      </div>

      <button className="login-button" type="button">
        Войти с помощью VK <span aria-hidden="true">→</span>
      </button>
    </header>
  );
}