import shieldIcon from '../assets/images/shield.png';
import choiceIcon from '../assets/images/choice.png';

const icons = {
  green: shieldIcon,
  purple: choiceIcon,
};

export default function InfoCard({ title, text, tone }) {
  return (
    <article className="info-card">
      <div className="info-card__title-row">
        <span className={`info-card__icon info-card__icon--${tone}`}>
          <img
            src={icons[tone]}
            alt=""
            className="info-card__icon-image"
          />
        </span>
        <span>{title}</span>
      </div>

      <div className="info-card__text">{text}</div>
    </article>
  );
}