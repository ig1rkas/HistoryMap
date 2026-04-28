import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { YMaps, Map } from '@pbe/react-yandex-maps';
import { getPlace, getPlaceFilters, getPlacePoints, getReviews } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import filterIcon from '../assets/images/filter.png';

const placeImages = import.meta.glob('../assets/images/*.png', {
  eager: true,
  import: 'default',
});

const img = (name) => placeImages[`../assets/images/${name}`];

const ymapsQuery = {
  apikey: import.meta.env.VITE_YANDEX_MAPS_API_KEY,
  lang: 'ru_RU',
  load: 'package.full',
};

function getPinSize(zoom) {
  const raw = 36 + (zoom - 13) * 4;
  return Math.max(24, Math.min(42, raw));
}

function buildPinIcon(size) {
  const viewBox = 54;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${viewBox} ${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M27 4C16.5 4 8 12.5 8 23C8 36.5 27 51 27 51C27 51 46 36.5 46 23C46 12.5 37.5 4 27 4Z" fill="#FF3F68"/>
      <path d="M27 4C16.5 4 8 12.5 8 23C8 36.5 27 51 27 51C27 51 46 36.5 46 23C46 12.5 37.5 4 27 4Z" fill="url(#paint0_linear)"/>
      <circle cx="27" cy="23" r="9" fill="white"/>
      <circle cx="27" cy="23" r="4.5" fill="#FF3F68"/>
      <defs>
        <linearGradient id="paint0_linear" x1="8" y1="4" x2="47" y2="51" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF2F59"/>
          <stop offset="1" stop-color="#FF6B8C"/>
        </linearGradient>
      </defs>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getCardMetrics() {
  if (window.innerWidth <= 900) {
    return { width: 300, height: 320 };
  }

  return { width: 370, height: 380 };
}

const fallbackPlaceImage = img('image.png') || img('shield.png');
const defaultFilters = {
  radiusKm: '',
  search: '',
  category: '',
  epoch: '',
  architectureStyle: '',
};

function getPlaceImage(place) {
  return place?.preview || place?.image || fallbackPlaceImage;
}

function getPlaceTags(place) {
  return [
    place.category,
    place.epoch,
    place.architecture_style,
    place.avg_rating ? `Рейтинг ${Number(place.avg_rating).toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(' • ');
}

function pointToLocation(point) {
  if (!Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
    return null;
  }

  return {
    id: String(point._id),
    backendId: String(point._id),
    title: point.title,
    coords: [point.coordinates[1], point.coordinates[0]],
    image: getPlaceImage(point),
    shortDescription: point.short_description || '',
    description: point.short_description || '',
    tags: getPlaceTags(point),
    category: point.category,
    avgRating: point.avg_rating,
    ratingCount: point.rating_count || 0,
  };
}

function getInfoValue(place, titlePart) {
  const item = place?.information?.find((info) =>
    String(info.title || '').toLowerCase().includes(titlePart)
  );

  return item?.content || '';
}

function placeToDetail(place, fallback = {}) {
  const history = getInfoValue(place, 'истор');
  const address = getInfoValue(place, 'адрес');
  const extraInfo = place?.information?.find(
    (info) => info.content && !String(info.title || '').toLowerCase().includes('адрес')
  );

  return {
    ...fallback,
    id: String(place._id || fallback.id),
    backendId: String(place._id || fallback.backendId),
    title: place.title || fallback.title,
    coords: Array.isArray(place.coordinates)
      ? [place.coordinates[1], place.coordinates[0]]
      : fallback.coords,
    image: getPlaceImage(place) || fallback.image,
    shortDescription: place.short_description || fallback.shortDescription || '',
    description: history || place.short_description || fallback.description || '',
    address: address || fallback.address || 'Адрес не указан',
    extraTitle: extraInfo?.title || 'Дополнительная информация',
    extraText: extraInfo?.content || history || place.short_description || '',
    gallery: Array.isArray(place.gallery) ? place.gallery : [],
    tags: getPlaceTags(place) || fallback.tags || '',
    category: place.category || fallback.category,
    avgRating: place.avg_rating,
    ratingCount: place.rating_count || 0,
  };
}

function getAuthorName(author) {
  if (!author) return 'Пользователь';

  return (
    [author.first_name, author.last_name].filter(Boolean).join(' ').trim() ||
    `VK ID ${author.vk_id}`
  );
}

function getAuthorInitials(author) {
  const name = getAuthorName(author);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return initials.toUpperCase() || 'U';
}

function formatRating(value) {
  const rating = Number(value);

  if (!Number.isFinite(rating)) return '—';

  return rating.toFixed(1).replace('.', ',');
}

function getRatingFillPercent(value) {
  const rating = Number(value);

  if (!Number.isFinite(rating)) return 0;

  return Math.max(0, Math.min(100, (rating / 5) * 100));
}

function RatingStar({ filled = false, fillPercent = null, className = '' }) {
  const gradientId = `rating-star-${useId().replace(/:/g, '')}`;
  const partialFill =
    fillPercent === null
      ? null
      : Math.max(0, Math.min(100, Number(fillPercent) || 0));

  return (
    <svg
      className={`map-star ${filled ? 'map-star--filled' : ''} ${
        partialFill !== null ? 'map-star--partial' : ''
      } ${className}`}
      viewBox="0 0 72 72"
      aria-hidden="true"
      focusable="false"
    >
      {partialFill !== null && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0"
            x2="72"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset={`${partialFill}%`} stopColor="#f2b313" />
            <stop offset={`${partialFill}%`} stopColor="#ffffff" />
          </linearGradient>
        </defs>
      )}
      <path
        className="map-star__shape"
        style={
          partialFill !== null ? { fill: `url(#${gradientId})` } : undefined
        }
        d="M32 6.5L39.2 23.6L57.6 25.1C61.2 25.4 62.6 29.8 59.9 32.1L45.9 44.1L50.2 62.1C51 65.6 47.2 68.3 44.1 66.4L32 56.8L19.9 66.4C16.8 68.3 13 65.6 13.8 62.1L18.1 44.1L4.1 32.1C1.4 29.8 2.8 25.4 6.4 25.1L24.8 23.6L32 6.5Z"
      />
    </svg>
  );
}

export default function MapPage() {
  const { authRequest, isAuthenticated, loginWithVk } = useAuth();
  const [locations, setLocations] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    epochs: [],
    architecture_styles: [],
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState(true);
  const [zoom, setZoom] = useState(13);
  const [markerPoints, setMarkerPoints] = useState([]);
  const [userLocationPoint, setUserLocationPoint] = useState(null);
  const [userLocationCoords, setUserLocationCoords] = useState(null);
  const [activePlace, setActivePlace] = useState(null);
  const [placeCardStyle, setPlaceCardStyle] = useState(null);
  const [detailPlace, setDetailPlace] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const mapRef = useRef(null);
  const mapShellRef = useRef(null);
  const activePlaceRef = useRef(null);
  const userLocationRef = useRef(null);
  const hasCenteredOnUserRef = useRef(false);
  const rafRef = useRef(null);
  const continuousRafRef = useRef(null);

  const pinSize = useMemo(() => getPinSize(zoom), [zoom]);
  const pinIcon = useMemo(() => buildPinIcon(pinSize), [pinSize]);

  const closePlaceCard = () => {
    activePlaceRef.current = null;
    setActivePlace(null);
    setPlaceCardStyle(null);
  };

  const closeDetailDrawer = () => {
    setDetailPlace(null);
    setDetailLoading(false);
    setDetailError(null);
    setReviews([]);
    setReviewsTotal(0);
    setReviewsError(null);
    setReviewMessage(null);
    setIsReviewDialogOpen(false);
  };

  const openReviewDialog = () => {
    setReviewMessage(null);
    setIsReviewDialogOpen(true);
  };

  const closeReviewDialog = () => {
    setIsReviewDialogOpen(false);
  };

  const calculateCardPosition = (pointX, pointY, shellWidth, shellHeight) => {
    const { width: cardWidth, height: cardHeight } = getCardMetrics();
    const margin = 24;
    let left = pointX - cardWidth / 2 + 14;
    left = Math.max(margin, Math.min(left, shellWidth - cardWidth - margin));

    let top = pointY - cardHeight + 70;
    let placement = 'above';

    if (top < margin) {
      top = pointY + 24;
      placement = 'below';
    }

    if (top + cardHeight > shellHeight - margin) {
      top = Math.max(margin, shellHeight - cardHeight - margin);
    }

    top -= 100;

    return { left, top, placement };
  };

  const syncMarkersAndCard = () => {
    const map = mapRef.current;
    const shell = mapShellRef.current;

    if (!map || !shell) return;

    try {
      const projection = map.options.get('projection');
      const containerSize = map.container.getSize();
      let currentZoom = map.getZoom();
      let mapCenter = map.getGlobalPixelCenter();

      try {
        const liveState = map.action.getCurrentState();

        if (liveState) {
          if (liveState.globalPixelCenter) {
            mapCenter = liveState.globalPixelCenter;
          }

          if (typeof liveState.zoom === 'number') {
            currentZoom = liveState.zoom;
          }
        }
      } catch (_) {}

      const nextPoints = locations.map((location) => {
        const globalPixels = projection.toGlobalPixels(
          location.coords,
          currentZoom
        );

        return {
          id: location.id,
          x: globalPixels[0] - mapCenter[0] + containerSize[0] / 2,
          y: globalPixels[1] - mapCenter[1] + containerSize[1] / 2,
        };
      });

      setMarkerPoints(nextPoints);

      const userCoords = userLocationRef.current;

      if (userCoords) {
        const userGlobalPixels = projection.toGlobalPixels(
          userCoords,
          currentZoom
        );

        setUserLocationPoint({
          x: userGlobalPixels[0] - mapCenter[0] + containerSize[0] / 2,
          y: userGlobalPixels[1] - mapCenter[1] + containerSize[1] / 2,
        });
      } else {
        setUserLocationPoint(null);
      }

      if (activePlaceRef.current) {
        const activePoint = nextPoints.find(
          (point) => point.id === activePlaceRef.current.id
        );

        if (activePoint) {
          const nextStyle = calculateCardPosition(
            activePoint.x,
            activePoint.y,
            shell.clientWidth,
            shell.clientHeight
          );

          setPlaceCardStyle(nextStyle);
        }
      }
    } catch (_) {}
  };

  const scheduleSync = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      syncMarkersAndCard();
    });
  };

  const startContinuousSync = () => {
    if (continuousRafRef.current) return;

    let frame = 0;

    const tick = () => {
      if (frame % 3 === 0) {
        syncMarkersAndCard();
      }

      frame += 1;
      continuousRafRef.current = requestAnimationFrame(tick);
    };

    continuousRafRef.current = requestAnimationFrame(tick);
  };

  const stopContinuousSync = () => {
    if (continuousRafRef.current) {
      cancelAnimationFrame(continuousRafRef.current);
      continuousRafRef.current = null;
    }

    syncMarkersAndCard();
  };

  const openPlaceCard = (place) => {
    if (detailPlace) return;

    const shell = mapShellRef.current;
    const point = markerPoints.find((item) => item.id === place.id);

    activePlaceRef.current = place;
    setActivePlace(place);

    if (point && shell) {
      const nextStyle = calculateCardPosition(
        point.x,
        point.y,
        shell.clientWidth,
        shell.clientHeight
      );

      setPlaceCardStyle(nextStyle);
    } else {
      scheduleSync();
    }
  };

  const openDetailDrawer = async (place) => {
    setDetailPlace(place);
    setDetailLoading(true);
    setDetailError(null);
    setReviewMessage(null);
    setIsReviewDialogOpen(false);
    closePlaceCard();
    setIsFiltersOpen(false);

    try {
      const data = await getPlace(place.backendId || place.id);
      const nextDetail = placeToDetail(data.place, place);

      setDetailPlace((current) =>
        current?.id === place.id ? nextDetail : current
      );
    } catch (error) {
      setDetailError('Не удалось загрузить подробную информацию');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    getPlaceFilters()
      .then((data) => {
        if (!cancelled) setFilterOptions(data);
      })
      .catch(() => {
        if (!cancelled) {
          setFilterOptions({
            categories: [],
            epochs: [],
            architecture_styles: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const radiusKm = Number(appliedFilters.radiusKm);
    const query = {
      category: appliedFilters.category,
      epoch: appliedFilters.epoch,
      architecture_style: appliedFilters.architectureStyle,
    };

    if (
      showNearbyOnly &&
      userLocationCoords &&
      Number.isFinite(radiusKm) &&
      radiusKm > 0
    ) {
      query.lat = userLocationCoords[0];
      query.lon = userLocationCoords[1];
      query.radius = Math.round(radiusKm * 1000);
    }

    setPlacesLoading(true);
    setPlacesError(null);

    getPlacePoints(query)
      .then((data) => {
        if (cancelled) return;

        const search = appliedFilters.search.trim().toLowerCase();
        const nextLocations = (data.points || [])
          .map(pointToLocation)
          .filter(Boolean)
          .filter((place) =>
            search ? place.title.toLowerCase().includes(search) : true
          );

        setLocations(nextLocations);

        if (
          activePlaceRef.current &&
          !nextLocations.some((place) => place.id === activePlaceRef.current.id)
        ) {
          closePlaceCard();
        }
      })
      .catch(() => {
        if (cancelled) return;

        setLocations([]);
        setPlacesError('Не удалось загрузить места');
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appliedFilters, showNearbyOnly, userLocationCoords]);

  useEffect(() => {
    scheduleSync();
  }, [locations, pinSize]);

  useEffect(() => {
    if (!detailPlace?.backendId) return undefined;

    let cancelled = false;

    setReviewsLoading(true);
    setReviewsError(null);

    getReviews(detailPlace.backendId)
      .then((data) => {
        if (cancelled) return;

        setReviews(data.reviews || []);
        setReviewsTotal(data.total || 0);
      })
      .catch(() => {
        if (!cancelled) setReviewsError('Не удалось загрузить отзывы');
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detailPlace?.backendId]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!detailPlace?.backendId) return;

    if (!isAuthenticated) {
      loginWithVk();
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage(null);

    try {
      const payload = {
        place_id: detailPlace.backendId,
        rating: Number(reviewRating),
      };
      const trimmedText = reviewText.trim();

      if (trimmedText) payload.text = trimmedText;

      const data = await authRequest('/api/reviews/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data.place_stats) {
        setDetailPlace((current) =>
          current?.backendId === detailPlace.backendId
            ? {
                ...current,
                avgRating: data.place_stats.avg_rating,
                ratingCount: data.place_stats.rating_count,
              }
            : current
        );

        setLocations((current) =>
          current.map((place) =>
            place.backendId === detailPlace.backendId
              ? {
                  ...place,
                  avgRating: data.place_stats.avg_rating,
                  ratingCount: data.place_stats.rating_count,
                }
              : place
          )
        );
      }

      setReviewText('');
      setReviewRating(5);
      setReviewMessage(
        data.moderation?.status === 'approved'
          ? 'Отзыв опубликован'
          : 'Отзыв сохранен, но не прошел модерацию'
      );

      const nextReviews = await getReviews(detailPlace.backendId);
      setReviews(nextReviews.reviews || []);
      setReviewsTotal(nextReviews.total || 0);
      setIsReviewDialogOpen(false);
    } catch (error) {
      setReviewMessage('Не удалось отправить отзыв');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      userLocationRef.current = null;
      setUserLocationPoint(null);
      setUserLocationCoords(null);
      return undefined;
    }

    const handlePosition = (position) => {
      const coords = [
        position.coords.latitude,
        position.coords.longitude,
      ];

      userLocationRef.current = coords;
      setUserLocationCoords((prev) => {
        if (
          prev &&
          Math.abs(prev[0] - coords[0]) < 0.0005 &&
          Math.abs(prev[1] - coords[1]) < 0.0005
        ) {
          return prev;
        }

        return coords;
      });

      const map = mapRef.current;

      if (map && !hasCenteredOnUserRef.current) {
        hasCenteredOnUserRef.current = true;

        try {
          map.setCenter(coords, Math.max(map.getZoom(), 15), {
            duration: 400,
          });
        } catch (_) {}
      }

      scheduleSync();
    };

    const handleError = () => {
      userLocationRef.current = null;
      setUserLocationPoint(null);
      setUserLocationCoords(null);
    };

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      if (
        target.closest('.map-place-card-overlay') ||
        target.closest('.map-detail-drawer') ||
        target.closest('.map-review-dialog') ||
        target.closest('.map-page__map-dim') ||
        target.closest('.map-page__marker') ||
        target.closest('.map-page__filter-button') ||
        target.closest('.map-page__filters-panel')
      ) {
        return;
      }

      closePlaceCard();
      closeDetailDrawer();
    };

    const handleResize = () => {
      scheduleSync();
    };

    const handlePointerDown = (event) => {
      const shell = mapShellRef.current;

      if (!shell) return;

      const target = event.target;

      if (!(target instanceof Element)) return;
      if (target.closest('.map-page__marker')) return;
      if (!shell.contains(target)) return;

      startContinuousSync();
    };

    const handlePointerUp = () => {
      stopContinuousSync();
    };

    const handleWheel = () => {
      startContinuousSync();
      window.clearTimeout(handleWheel._t);
      handleWheel._t = window.setTimeout(() => {
        stopContinuousSync();
      }, 250);
    };

    document.addEventListener('mousedown', handleDocumentClick);
    window.addEventListener('resize', handleResize);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    const shellEl = mapShellRef.current;

    if (shellEl) {
      shellEl.addEventListener('wheel', handleWheel, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (shellEl) {
        shellEl.removeEventListener('wheel', handleWheel);
      }

      window.clearTimeout(handleWheel._t);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      if (continuousRafRef.current) {
        cancelAnimationFrame(continuousRafRef.current);
        continuousRafRef.current = null;
      }
    };
  }, [markerPoints, detailPlace, isReviewDialogOpen]);

  return (
    <YMaps query={ymapsQuery}>
      <div className="map-page">
        <div className="map-page__header-wrap">
          <div className="map-page__inner">
            <Header variant="map" showLogin />
          </div>
        </div>

        <main className="map-page__content">
          <div className="map-page__map-shell" ref={mapShellRef}>
            <div className="map-page__map-viewport">
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

                    scheduleSync();
                  }}
                  instanceRef={(map) => {
                    if (!map) return;

                    mapRef.current = map;

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

                        map.action.events.add('tick', scheduleSync);
                        map.action.events.add('tickcomplete', scheduleSync);
                        map.events.add('actiontick', scheduleSync);
                        map.events.add('sizechange', scheduleSync);
                        map.events.add('actionbegin', startContinuousSync);
                        map.events.add('actionend', stopContinuousSync);

                        if (
                          userLocationRef.current &&
                          !hasCenteredOnUserRef.current
                        ) {
                          hasCenteredOnUserRef.current = true;

                          try {
                            map.setCenter(
                              userLocationRef.current,
                              Math.max(map.getZoom(), 15),
                              { duration: 400 }
                            );
                          } catch (_) {}
                        }

                        scheduleSync();
                      } catch (_) {}
                    }, 100);
                  }}
                />
              </div>

              <div className="map-page__markers-layer">
                {userLocationPoint && (
                  <div
                    className="map-page__user-location"
                    style={{
                      left: `${userLocationPoint.x}px`,
                      top: `${userLocationPoint.y}px`,
                    }}
                    aria-label="Ваше местоположение"
                    title="Ваше местоположение"
                  >
                    <span className="map-page__user-location-core" />
                  </div>
                )}

                {locations.map((location) => {
                  const point = markerPoints.find(
                    (item) => item.id === location.id
                  );

                  if (!point) return null;

                  return (
                    <button
                      key={location.id}
                      className="map-page__marker"
                      type="button"
                      style={{
                        left: `${point.x}px`,
                        top: `${point.y}px`,
                        width: `${pinSize}px`,
                        height: `${pinSize}px`,
                      }}
                      onClick={() => openPlaceCard(location)}
                      aria-label={location.title}
                    >
                      <img src={pinIcon} alt="" draggable="false" />
                    </button>
                  );
                })}
              </div>
            </div>

            {(placesLoading || placesError) && (
              <div className="map-page__status">
                {placesLoading ? 'Загружаем места...' : placesError}
              </div>
            )}

            {activePlace && placeCardStyle && (
              <div
                className="map-place-card-overlay"
                style={{
                  left: `${placeCardStyle.left}px`,
                  top: `${placeCardStyle.top}px`,
                }}
              >
                <article className="map-place-card">
                  <div className="map-place-card__image-wrap">
                    <img
                      className="map-place-card__image"
                      src={activePlace.image || fallbackPlaceImage}
                      alt={activePlace.title}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackPlaceImage;
                      }}
                    />
                    {/*
                    <button className="map-place-card__fav" type="button">
                      ★
                    </button>
                    */}
                  </div>

                  <div className="map-place-card__content">
                    <div className="map-place-card__tags">
                      {activePlace.tags}
                    </div>
                    <div className="map-place-card__title">
                      {activePlace.title}
                    </div>
                    <div className="map-place-card__description">
                      {activePlace.shortDescription || activePlace.description}
                    </div>
                    <button
                      className="map-place-card__button"
                      type="button"
                      onClick={() => openDetailDrawer(activePlace)}
                    >
                      Подробнее <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              </div>
            )}

            <button
              className="map-page__filter-button"
              type="button"
              onClick={() => {
                closePlaceCard();
                closeDetailDrawer();
                setIsFiltersOpen((prev) => !prev);
              }}
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
                  <input
                    className="map-page__input"
                    type="text"
                    inputMode="decimal"
                    value={filters.radiusKm}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        radiusKm: event.target.value,
                      }))
                    }
                  />
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
                    value={filters.search}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        search: event.target.value,
                      }))
                    }
                  />
                  <span className="map-page__input-icon">⌕</span>
                </div>
              </div>

              <div className="map-page__field">
                <label className="map-page__label">Архитектура</label>
                <select
                  className="map-page__select"
                  value={filters.architectureStyle}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      architectureStyle: event.target.value,
                    }))
                  }
                >
                  <option value="">Все стили</option>
                  {filterOptions.architecture_styles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div className="map-page__field">
                <label className="map-page__label">Эпоха</label>
                <select
                  className="map-page__select"
                  value={filters.epoch}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      epoch: event.target.value,
                    }))
                  }
                >
                  <option value="">Все эпохи</option>
                  {filterOptions.epochs.map((epoch) => (
                    <option key={epoch} value={epoch}>
                      {epoch}
                    </option>
                  ))}
                </select>
              </div>

              <div className="map-page__field">
                <label className="map-page__label">Категория</label>
                <select
                  className="map-page__select"
                  value={filters.category}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                >
                  <option value="">Все категории</option>
                  {filterOptions.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="map-page__filters-actions">
                <button
                  className="map-page__reset-button"
                  type="button"
                  onClick={() => {
                    setFilters(defaultFilters);
                    setAppliedFilters(defaultFilters);
                  }}
                >
                  × Сбросить
                </button>
                <button
                  className="map-page__apply-button"
                  type="button"
                  onClick={() => {
                    setAppliedFilters({ ...filters });
                    setIsFiltersOpen(false);
                  }}
                >
                  Применить
                </button>
              </div>
            </div>

            

            <div
              className={`map-page__map-dim ${
                isFiltersOpen || detailPlace
                  ? 'map-page__map-dim--visible'
                  : ''
              }`}
              onClick={() => {
                if (isReviewDialogOpen) {
                  closeReviewDialog();
                  return;
                }

                setIsFiltersOpen(false);
                closePlaceCard();
                closeDetailDrawer();
              }}
            />
          </div>
          
        </main>

        <div className="map-page__footer-wrap">
          <div className="map-page__inner">
            <Footer className="site-footer--map" />
          </div>
        </div>
      </div>
      {detailPlace && (
              <aside className="map-detail-drawer">
                <button
                  className="map-detail-drawer__close"
                  type="button"
                  onClick={closeDetailDrawer}
                  aria-label="Закрыть подробную информацию"
                >
                  ×
                </button>

                <div className="map-detail-drawer__body">
                  <h2 className="map-detail-drawer__title">
                    {detailPlace.title}
                  </h2>

                  <div className="map-detail-drawer__meta">
                    <span>
                      {detailPlace.avgRating
                        ? `★ ${Number(detailPlace.avgRating).toFixed(1)}`
                        : 'Рейтинга пока нет'}
                    </span>
                    <span>{detailPlace.ratingCount || 0} отзывов</span>
                  </div>

                  {detailLoading && (
                    <div className="map-detail-drawer__notice">
                      Загружаем подробности...
                    </div>
                  )}

                  {detailError && (
                    <div className="map-detail-drawer__notice map-detail-drawer__notice--error">
                      {detailError}
                    </div>
                  )}

                  <div className="map-detail-drawer__section">
                    <p className="map-detail-drawer__text">
                      {detailPlace.shortDescription}
                    </p>
                  </div>

                  <div className="map-detail-drawer__section">
                    <div className="map-detail-drawer__label">Галерея</div>
                    <div className="map-detail-drawer__gallery">
                      {(detailPlace.gallery?.length
                        ? detailPlace.gallery
                        : [{ link: detailPlace.image || fallbackPlaceImage }]
                      ).map((item, index) => (
                        <img
                          className="map-detail-drawer__gallery-image"
                          key={`${item.link || 'fallback'}-${index}`}
                          src={item.link || fallbackPlaceImage}
                          alt={detailPlace.title}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = fallbackPlaceImage;
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="map-detail-drawer__section">
                    <p className="map-detail-drawer__text">
                      {detailPlace.description}
                    </p>
                  </div>

                  <div className="map-detail-drawer__section">
                    <div className="map-detail-drawer__label">Адрес</div>
                    <div className="map-detail-drawer__value">
                      {detailPlace.address}
                    </div>
                  </div>

                  {/*
                  <div className="map-detail-drawer__section">
                    <div className="map-detail-drawer__label">Время работы</div>
                    <div className="map-detail-drawer__value">
                      {detailPlace.workHours.map((item) => (
                        <div key={item}>{item}</div>
                      ))}
                    </div>
                  </div>
                  */}

                  <div className="map-detail-drawer__section">
                    <div className="map-detail-drawer__label">
                      {detailPlace.extraTitle}
                    </div>
                    <p className="map-detail-drawer__text">
                      {detailPlace.extraText}
                    </p>
                  </div>

                  <div className="map-detail-drawer__section map-detail-drawer__reviews">
                    <div className="map-reviews__topline">
                      <h3 className="map-reviews__title">
                        Отзывы пользователей
                      </h3>
                      <div className="map-reviews__average">
                        <span>
                          Средняя оценка {formatRating(detailPlace.avgRating)}
                        </span>
                        <RatingStar
                          className="map-reviews__average-star"
                          fillPercent={getRatingFillPercent(
                            detailPlace.avgRating
                          )}
                        />
                      </div>
                    </div>
                    {reviewsLoading && (
                      <div className="map-detail-drawer__notice">
                        Загружаем отзывы...
                      </div>
                    )}

                    {reviewsError && (
                      <div className="map-detail-drawer__notice map-detail-drawer__notice--error">
                        {reviewsError}
                      </div>
                    )}

                    {!reviewsLoading && reviews.length === 0 && (
                      <div className="map-detail-drawer__empty">
                        Отзывов пока нет
                      </div>
                    )}

                    <div className="map-detail-drawer__reviews-list">
                      {reviews.map((review) => {
                        const authorAvatar = review.author?.avatar;

                        return (
                          <article className="map-review" key={review._id}>
                            {authorAvatar ? (
                              <img
                                className="map-review__avatar"
                                src={authorAvatar}
                                alt={getAuthorName(review.author)}
                              />
                            ) : (
                              <div className="map-review__avatar map-review__avatar--fallback">
                                {getAuthorInitials(review.author)}
                              </div>
                            )}

                            <div className="map-review__content">
                              <div className="map-review__header">
                                <span className="map-review__author">
                                  {getAuthorName(review.author)}
                                </span>
                                <span className="map-review__rating">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <RatingStar
                                      key={rating}
                                      className="map-review__star"
                                      filled={Number(review.rating) >= rating}
                                    />
                                  ))}
                                </span>
                              </div>
                              {review.text && (
                                <p className="map-review__text">
                                  {review.text}
                                </p>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {reviewsTotal > reviews.length && (
                      <div className="map-detail-drawer__empty">
                        Показаны последние {reviews.length} из {reviewsTotal}
                      </div>
                    )}

                    {reviewMessage && (
                      <div className="map-reviews__message">
                        {reviewMessage}
                      </div>
                    )}

                    <button
                      className="map-reviews__write-button"
                      type="button"
                      onClick={openReviewDialog}
                    >
                      <svg
                        className="map-reviews__write-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M4 17.25V21h3.75L18.8 9.95l-3.75-3.75L4 17.25Zm16.7-10.2a1 1 0 0 0 0-1.4l-2.35-2.35a1 1 0 0 0-1.4 0l-1.85 1.85 3.75 3.75 1.85-1.85Z" />
                      </svg>
                      <span>Оставить отзыв</span>
                    </button>

                  </div>
                </div>
              </aside>
            )}
      {detailPlace && isReviewDialogOpen && (
        <aside
          className="map-review-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-review-dialog-title"
        >
          <button
            className="map-review-dialog__close"
            type="button"
            onClick={closeReviewDialog}
            aria-label="Закрыть окно отзыва"
          >
            ×
          </button>

          <form
            className="map-review-form map-review-dialog__form"
            onSubmit={handleReviewSubmit}
          >
            <div className="map-review-dialog__heading">
              <h3
                className="map-review-dialog__title"
                id="map-review-dialog-title"
              >
                Пользовательский отзыв
              </h3>
              <p className="map-review-dialog__subtitle">
                Поделитесь своим мнением, чтобы помочь другим пользователям!
              </p>
            </div>

            <div className="map-review-form__rating map-review-dialog__rating">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  className={`map-review-form__star ${
                    reviewRating >= rating
                      ? 'map-review-form__star--active'
                      : ''
                  }`}
                  type="button"
                  onClick={() => setReviewRating(rating)}
                  aria-label={`Оценка ${rating}`}
                >
                  <RatingStar filled={reviewRating >= rating} />
                </button>
              ))}
            </div>

            <label className="map-review-dialog__textarea-wrap">
              <span className="map-review-dialog__textarea-label">
                Напишите отзыв
              </span>
              <textarea
                className="map-review-form__textarea map-review-dialog__textarea"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Напишите здесь свой отзыв..."
                rows={2}
              />
              <svg
                className="map-review-dialog__chat-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M12 4C7.58 4 4 7.04 4 10.8c0 2.02 1.05 3.86 2.73 5.12L6.1 19.2a.7.7 0 0 0 1.02.73l3.32-2.05c.51.08 1.03.12 1.56.12 4.42 0 8-3.04 8-6.8S16.42 4 12 4Zm0 12.2c-.54 0-1.07-.06-1.58-.18a.75.75 0 0 0-.57.09l-1.91 1.18.37-1.92a.75.75 0 0 0-.31-.76c-1.54-.94-2.4-2.32-2.4-3.81 0-2.7 2.87-5 6.4-5s6.4 2.3 6.4 5-2.87 5.4-6.4 5.4Z" />
              </svg>
            </label>

            {reviewMessage && (
              <div className="map-review-form__message">
                {reviewMessage}
              </div>
            )}

            <button
              className="map-review-form__submit map-review-dialog__submit"
              type="submit"
              disabled={reviewSubmitting}
            >
              <svg
                className="map-review-dialog__submit-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M9.2 16.2 4.9 11.9 3.5 13.3l5.7 5.7L21 7.2 19.6 5.8 9.2 16.2Z" />
              </svg>
              <span>
                {reviewSubmitting ? 'Отправляем...' : 'Отправить отзыв'}
              </span>
            </button>
          </form>
        </aside>
      )}
    </YMaps>
    
    
  );
}
