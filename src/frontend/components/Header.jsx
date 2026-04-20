import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import noteIcon from '../assets/images/note.png';
import headphonesIcon from '../assets/images/headphones.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function Header({
  variant = 'landing',
  user = null,
  showLogin = true,
}) {
  const handleVkLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/vk`;
  };

  return (
    <header className={`header ${variant === 'map' ? 'header--map' : ''}`}>
      <Link to="/" className="logo-block">
        <div className="logo-block__icon-wrap">
          <img src={logo} alt="HistoryMap" className="logo-block__image" />
        </div>

        <div className="logo-block__text">
          <div className="logo-block__title">HistoryMap</div>
          <div className="logo-block__subtitle">
            Интерактивная карта Санкт-Петербурга
          </div>
        </div>
      </Link>

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

      {user ? (
        <div className="header__user">
          <span className="header__user-name">{user.name}</span>
          <img
            className="header__avatar"
            src={user.avatar}
            alt={user.name}
          />
        </div>
      ) : showLogin ? (
        <button className="login-button" type="button" onClick={handleVkLogin}>
          Войти с помощью VK <span aria-hidden="true">→</span>
        </button>
      ) : (
        <div />
      )}
    </header>
  );
}