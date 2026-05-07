import { useEffect, useState } from 'react';
import { Map, Placemark } from '@pbe/react-yandex-maps';
import { getPlacePoints } from '../api/client';

const pinIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="27" cy="27" r="27" fill="#FF8AA4" fill-opacity="0.22"/>
  <circle cx="27" cy="27" r="20" fill="#FF3D69"/>
  <path d="M27 18.8L29.38 23.64L34.72 24.42L30.86 28.14L31.78 33.38L27 30.88L22.22 33.38L23.14 28.14L19.28 24.42L24.62 23.64L27 18.8Z" fill="white"/>
</svg>
`)}`;

function pointToMapLocation(point) {
  if (!Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
    return null;
  }

  return {
    id: point._id,
    title: point.title,
    description: point.short_description,
    coords: [point.coordinates[1], point.coordinates[0]],
  };
}

export default function MapSection() {
  const [mapLocations, setMapLocations] = useState([]);

  useEffect(() => {
    let cancelled = false;

    getPlacePoints()
      .then((data) => {
        if (cancelled) return;

        setMapLocations(
          (data.points || []).map(pointToMapLocation).filter(Boolean)
        );
      })
      .catch(() => {
        if (!cancelled) setMapLocations([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
                } catch (_) {}
              }, 100);
            }
          }}
        >
          {mapLocations.map((location) => (
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
