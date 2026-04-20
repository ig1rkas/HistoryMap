import { useMemo, useState } from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import Header from '../components/Header';
import Footer from '../components/Footer';
import filterIcon from '../assets/images/filter.png';

const ymapsQuery = {
  apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY,
  lang: 'ru_RU',
  load: 'package.full',
};

const mockUser = {
  name: 'Илья Станевко',
  avatar: 'https://i.pravatar.cc/80?img=12',
};

const locations = [
  { id: 1, title: 'Исаакиевский собор', coords: [59.9343, 30.3061], content: [ { title: '' } ] },
  { id: 2, title: 'Кунсткамера', coords: [59.9416, 30.3049] },
  { id: 3, title: 'Спас на Крови', coords: [59.9407, 30.3288] },
  { id: 4, title: 'Русский музей', coords: [59.9386, 30.3325] },
  { id: 5, title: 'Сенная площадь', coords: [59.9275, 30.3178] },
  { id: 6, title: 'Владимирская', coords: [59.9279, 30.3478] },
  { id: 7, title: 'Шестаковская церковь', coords: [59.9376, 30.3835] },
  { id: 8, title: 'Мариинский театр', coords: [59.9258, 30.2966] },
  { id: 9, title: 'Новая Голландия', coords: [59.9289, 30.2907] },
];

function getPinSize(zoom) {
  const raw = 54 + (zoom - 13) * 6;
  return Math.max(30, Math.min(54, raw));
}

function buildPinIcon(size) {
  const viewBox = 54;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg width="${size}" height="${size}" viewBox="0 0 ${viewBox} ${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="27" cy="27" r="27" fill="#FF8AA4" fill-opacity="0.22"/>
    <circle cx="27" cy="27" r="20" fill="#FF3D69"/>
    <path d="M27 18.8L29.38 23.64L34.72 24.42L30.86 28.14L31.78 33.38L27 30.88L22.22 33.38L23.14 28.14L19.28 24.42L24.62 23.64L27 18.8Z" fill="white"/>
  </svg>
  `)}`;
}

export default function MapPage() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState(true);
  const [zoom, setZoom] = useState(13);

  const pinSize = useMemo(() => getPinSize(zoom), [zoom]);
  const pinIcon = useMemo(() => buildPinIcon(pinSize), [pinSize]);

  return (
    <YMaps query={ymapsQuery}>
      <div className="map-page">
        <div className="map-page__header-wrap">
          <div className="map-page__inner">
            <Header variant="map" user={mockUser} showLogin={false} />
          </div>
        </div>

        <main className="map-page__content">
          <div className="map-page__map-shell">
            <div className="map-page__map-canvas">
              <Map
                defaultState={{
                  center: [59.9338, 30.3304],
                  zoom: 13,
                  controls: [],
                }}
                width="100%"
                height="100%"
                options={{
                  suppressMapOpenBlock: true,
                  yandexMapDisablePoiInteractivity: true,
                  copyrightLogoVisible: false,
                }}
                onBoundsChange={(e) => {
                  const nextZoom = e.get('newZoom');
                  if (typeof nextZoom === 'number') {
                    setZoom(nextZoom);
                  }
                }}
                instanceRef={(map) => {
                  if (!map) return;

                  setTimeout(() => {
                    try {
                      map.container.fitToViewport();

                      const controlsToRemove = [
                        'trafficControl',
                        'routeButtonControl',
                        'routeEditor',
                        'routePanelControl',
                        'searchControl',
                        'typeSelector',
                        'fullscreenControl',
                        'zoomControl',
                        'geolocationControl',
                        'rulerControl',
                      ];

                      controlsToRemove.forEach((control) => {
                        try {
                          map.controls.remove(control);
                        } catch (_) {}
                      });

                      map.behaviors.enable('drag');
                      map.behaviors.enable('scrollZoom');
                      map.behaviors.enable('dblClickZoom');
                      map.behaviors.enable('multiTouch');
                    } catch (_) {}
                  }, 100);
                }}
              >
                {locations.map((location) => (
                  <Placemark
                    key={location.id}
                    geometry={location.coords}
                    properties={{ hintContent: location.title }}
                    options={{
                      iconLayout: 'default#image',
                      iconImageHref: pinIcon,
                      iconImageSize: [pinSize, pinSize],
                      iconImageOffset: [-pinSize / 2, -pinSize / 2],
                    }}
                  />
                ))}
              </Map>
            </div>

            <div
              className={`map-page__map-dim ${
                isFiltersOpen ? 'map-page__map-dim--visible' : ''
              }`}
              onClick={() => setIsFiltersOpen(false)}
            />

            <button
              className="map-page__filter-button"
              type="button"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
            >
              <img
                src={filterIcon}
                alt=""
                className="map-page__filter-button-icon"
              />
              <span>Фильтры</span>
            </button>

            <div
              className={`map-page__filters-panel ${
                isFiltersOpen ? 'map-page__filters-panel--open' : ''
              }`}
            >
              <div className="map-page__filters-header">
                <div className="map-page__filters-title">Места рядом</div>
                <button
                  className="map-page__filters-close"
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  aria-label="Закрыть фильтры"
                >
                  ×
                </button>
              </div>

              <label className="map-page__checkbox-row">
                <input
                  type="checkbox"
                  checked={showNearbyOnly}
                  onChange={() => setShowNearbyOnly((prev) => !prev)}
                />
                <span className="map-page__checkbox-mark">✓</span>
                <span>Показывать места только рядом со мной</span>
              </label>

              <div className="map-page__field">
                <label className="map-page__label">Радиус, км</label>
                <div className="map-page__input-wrap">
                  <input className="map-page__input" type="text" />
                  <span className="map-page__input-icon">◎</span>
                </div>
              </div>

              <div className="map-page__field">
                <label className="map-page__label">Название места</label>
                <div className="map-page__input-wrap">
                  <input
                    className="map-page__input"
                    type="text"
                    placeholder="Начните вводить название..."
                  />
                  <span className="map-page__input-icon">⌕</span>
                </div>
              </div>

              <div className="map-page__field">
                <label className="map-page__label">Архитектура</label>
                <select className="map-page__select" defaultValue="">
                  <option value="" disabled>
                    Выберите элемент
                  </option>
                  <option>Барокко</option>
                  <option>Классицизм</option>
                  <option>Модерн</option>
                </select>
              </div>

              <div className="map-page__field">
                <label className="map-page__label">Эпоха</label>
                <select className="map-page__select" defaultValue="">
                  <option value="" disabled>
                    Выберите элемент
                  </option>
                  <option>XVIII век</option>
                  <option>XIX век</option>
                  <option>XX век</option>
                </select>
              </div>

              <div className="map-page__filters-actions">
                <button className="map-page__reset-button" type="button">
                  <span>×</span>
                  <span>Сбросить</span>
                </button>

                <button className="map-page__apply-button" type="button">
                  Применить
                </button>
              </div>
            </div>
          </div>
        </main>

        <div className="map-page__footer-wrap">
          <div className="map-page__inner">
            <Footer className="site-footer--map" />
          </div>
        </div>
      </div>
    </YMaps>
  );
}