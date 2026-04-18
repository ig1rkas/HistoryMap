export default function InfoCard({ title, text, tone }) {
  return (
    <div className="info-card">
      <div className="info-card__title-row">
        <span className={`info-card__icon info-card__icon--${tone}`}>●</span>
        {title}
      </div>
      <div className="info-card__text">{text}</div>
    </div>
  );
}