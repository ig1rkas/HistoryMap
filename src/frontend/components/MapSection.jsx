import { Map, Placemark } from '@pbe/react-yandex-maps';

const locations = [
  {
    id: 1,
    title: 'Исаакиевский собор',
    description: 'Историческое место в центре Санкт-Петербурга',
    coords: [59.9343, 30.3061],
  },
  {
    id: 2,
    title: 'Дворцовая площадь',
    description: 'Одна из главных площадей города',
    coords: [59.9398, 30.3146],
  },
  {
    id: 3,
    title: 'Русский музей',
    description: 'Крупнейшее собрание русского искусства',
    coords: [59.9387, 30.3328],
  },
  {
    id: 4,
    title: 'Сенная площадь',
    description: 'Оживленная историческая локация',
    coords: [59.9275, 30.3179],
  },
  {
    id: 5,
    title: 'Мариинский театр',
    description: 'Культовое место театрального Петербурга',
    coords: [59.9256, 30.2968],
  },
  {
    id: 6,
    title: 'Владимирская',
    description: 'Исторический район и транспортный узел',
    coords: [59.9279, 30.3479],
  },
  {
    id: 7,
    title: 'Площадь Восстания',
    description: 'Один из центральных городских узлов',
    coords: [59.931, 30.3609],
  },
  {
    id: 8,
    title: 'Лиговский проспект',
    description: 'Городская артерия с исторической застройкой',
    coords: [59.9188, 30.3517],
  },
];

const pinIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="27" cy="27" r="27" fill="#FF8AA4" fill-opacity="0.22"/>
  <circle cx="27" cy="27" r="20" fill="#FF3D69"/>
  <path d="M27 18.8L29.38 23.64L34.72 24.42L30.86 28.14L31.78 33.38L27 30.88L22.22 33.38L23.14 28.14L19.28 24.42L24.62 23.64L27 18.8Z" fill="white"/>
</svg>
`)}`;

export default function MapSection() {
  return (
    <section className="hero__map-section">
      <div className="map-shell">
        <Map
          defaultState={{
            center: [59.9338, 30.3304],
            zoom: 13,
            controls: [],
          }}
          options={{
            suppressMapOpenBlock: true,
          }}
          width="100%"
          height="100%"
          instanceRef={(ref) => {
            if (ref) {
              setTimeout(() => {
                try {
                  ref.container.fitToViewport();
                } catch (e) {
                  // ignore
                }
              }, 100);
            }
          }}
        >
          {locations.map((location) => (
            <Placemark
              key={location.id}
              geometry={location.coords}
              properties={{
                hintContent: location.title,
                balloonContentHeader: location.title,
                balloonContentBody: location.description,
              }}
              modules={['geoObject.addon.hint', 'geoObject.addon.balloon']}
              options={{
                iconLayout: 'default#image',
                iconImageHref: pinIcon,
                iconImageSize: [54, 54],
                iconImageOffset: [-27, -27],
                hideIconOnBalloonOpen: false,
              }}
            />
          ))}
        </Map>
      </div>
    </section>
  );
}