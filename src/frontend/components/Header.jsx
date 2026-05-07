import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import logo from '../assets/images/logo.png';
import noteIcon from '../assets/images/note.png';
import headphonesIcon from '../assets/images/headphones.png';

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function Header({
  variant = 'landing',
  user = null,
  showLogin = true,
}) {
  const { user: authUser, isLoading, loginWithVk } = useAuth();
  const currentUser = user || authUser;
  const userInitials = currentUser?.name ? getInitials(currentUser.name) : 'VK';

  const handleVkLogin = () => {
    loginWithVk();
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

      {currentUser ? (
        <div className="header__user">
          <span className="header__user-name">{currentUser.name}</span>
          {currentUser.avatar ? (
            <img
              className="header__avatar"
              src={currentUser.avatar}
              alt={currentUser.name}
            />
          ) : (
            <span className="header__avatar header__avatar--fallback">
              {userInitials}
            </span>
          )}
        </div>
      ) : showLogin ? (
        <button
          className="login-button"
          type="button"
          onClick={handleVkLogin}
          disabled={isLoading}
        >
          Войти с помощью VK <span aria-hidden="true">→</span>
        </button>
      ) : (
        <div />
      )}
    </header>
  );
}
