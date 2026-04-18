const pins = [
  { left: '14%', top: '28%' },
  { left: '33%', top: '10%' },
  { left: '49%', top: '8%' },
  { left: '71%', top: '61%' },
  { left: '55%', top: '87%' },
  { left: '97%', top: '48%' },
  { left: '31%', top: '68%' },
  { left: '2%', top: '70%' },
  { left: '57%', top: '26%' },
];

export default function MapSection() {
  return (
    <section className="hero__map-section">
      <div className="filter-button-wrap">
        <button className="filter-button">
          <span className="filter-button__icon">≡</span>
          Фильтры
        </button>
      </div>

      <div className="map-card">
        <div className="map-card__texture" />
        <div className="map-card__spots" />

        {pins.map((pin, index) => (
          <div
            key={index}
            className="map-pin"
            style={{ left: pin.left, top: pin.top }}
          >
            <div className="map-pin__inner">★</div>
          </div>
        ))}
      </div>
    </section>
  );
}