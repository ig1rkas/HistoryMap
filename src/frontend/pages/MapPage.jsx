import { useEffect, useMemo, useRef, useState } from 'react';
import { YMaps, Map } from '@pbe/react-yandex-maps';
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
  {
    id: 1,
    title: 'Дом быта на Коломенской улице',
    coords: [59.923, 30.352],
    image: './assets/images/kolomenskiy.png',
    shortDescription:
      'Первый дом быта Ленинграда, с которого началась вся система централизованных бытовых услуг.',
    description:
      'Дом быта на Коломенской улице, построенный в 1966 году по проекту архитектора Раисы Абрамовны Брегман, стал первым специализированным зданием такого типа в Ленинграде. Он был создан как экспериментальный объект в рамках государственной программы развития бытового обслуживания населения. Основная идея заключалась в концентрации различных услуг в одном здании, что позволяло жителям решать бытовые задачи быстрее и удобнее. Здание представляло собой четырёхэтажный корпус с чётко организованной системой распределения функций.',
    address: 'Коломенская ул., 29',
    workHours: [],
    extraTitle: 'Подробная информация',
    extraText:
      'На первом этаже располагалась химчистка, на втором — мастерские по ремонту обуви, на третьем — трикотажное ателье, а на четвёртом — фотоателье. Такая вертикальная структура была новаторской для своего времени и позволяла эффективно организовать потоки клиентов и сотрудников. Дом быта стал прототипом для последующих проектов и доказал востребованность централизованной системы бытовых услуг. После распада СССР функции здания изменились: часть помещений была переоборудована под коммерческие нужды, а в настоящее время здание используется как гостиница и коммерческое пространство.',
  },
  {
    id: 2,
    title: 'Дом быта на Нарвском проспекте',
    coords: [59.901, 30.274],
    image: './assets/images/narvskiy.png',
    shortDescription:
      'Один из первых домов быта с продуманной интеграцией в историческую городскую среду.',
    description:
      'Дом быта на Нарвском проспекте был построен в 1967 году по проекту архитекторов Якова Болотина и Олега Василенко. В отличие от первого дома быта, здесь архитекторы уделили большое внимание взаимодействию нового здания с окружающей исторической застройкой. Здание было отодвинуто от линии улицы, благодаря чему перед ним появился небольшой сквер, создающий буфер между модернистской архитектурой и старой городской средой.',
    address: 'Нарвский пр., 18',
    workHours: [],
    extraTitle: 'Подробная информация',
    extraText:
      'Внутреннее пространство было организовано с учётом разделения потоков: на первом этаже располагались зоны приёма заказов и обслуживания клиентов, а на верхних этажах находились мастерские и производственные помещения. В здании работали ремонт обуви и часов, ателье, фотоателье, парикмахерская и химчистка. Такое зонирование позволяло повысить эффективность работы. В настоящее время здание сохранилось и используется как многофункциональный коммерческий и сервисный центр.',
  },
  {
    id: 3,
    title: 'Дом быта на Подольской улице',
    coords: [59.915, 30.329],
    image: './assets/images/podolskaya.png',
    shortDescription:
      'Районный центр бытовых услуг, со временем превратившийся в ювелирный кластер.',
    description:
      'Дом быта на Подольской улице был построен в 1967 году как один из районных центров бытового обслуживания. Изначально он включал широкий спектр мастерских и сервисов, ориентированных на повседневные нужды жителей. Здание играло важную роль в обеспечении доступности бытовых услуг на уровне района.',
    address: 'Подольская ул., 35',
    workHours: [],
    extraTitle: 'Подробная информация',
    extraText:
      'Со временем здание приобрело узкую специализацию и стало центром ювелирных услуг. Здесь располагались мастерские по ремонту и изготовлению изделий из драгоценных металлов. В советский период такие услуги были особенно востребованы, так как новые украшения было сложно приобрести. Эта специализация сохранилась и сегодня: здание используется под ювелирные мастерские и магазины.',
  },
  {
    id: 4,
    title: 'Дом быта на Суворовском проспекте',
    coords: [59.939, 30.38],
    image: './assets/images/syvoroskiy.png',
    shortDescription:
      'Яркий пример советского модернизма, контрастирующий с исторической застройкой.',
    description:
      'Дом быта на Суворовском проспекте был построен в 1964–1968 годах по проекту архитектора Раисы Брегман. Он стал одним из наиболее выразительных примеров архитектуры советского модернизма в центре Ленинграда. Здание было возведено на месте старой застройки и резко выделялось своим стеклянным фасадом и строгими геометрическими формами.',
    address: 'Суворовский пр., 35',
    workHours: [],
    extraTitle: 'Подробная информация',
    extraText:
      'Внутри располагались мастерские ремонта одежды, обуви, часов, кожгалантереи, а также парикмахерская и фотоателье. Архитектура здания отражает принципы функционализма: минимум декора и максимум практичности. После распада СССР часть помещений была переоборудована под коммерческие нужды, однако здание продолжает использоваться и сегодня.',
  },
  {
    id: 5,
    title: 'Дом быта на Бармалеева улице',
    coords: [59.966, 30.306],
    image: './assets/images/barmaleeva.png',
    shortDescription:
      'Интересный архитектурный объект, не сохранившийся до наших дней.',
    description:
      'Дом быта на Бармалеева улице был построен в 1968 году по проекту архитекторов Олега Голынкина и Леонида Келлера. Он представлял собой комплексное здание, состоящее из уличной части и более крупного производственного корпуса во дворе.',
    address: 'ул. Бармалеева, 6',
    workHours: [],
    extraTitle: 'Подробная информация',
    extraText:
      'Такое архитектурное решение позволяло сохранить масштаб улицы, не перегружая её крупным объёмом здания. Внутри располагались мастерские по ремонту обуви, одежды, часов и другие сервисы. Дом быта обслуживал жителей района и был важной частью городской инфраструктуры. В начале XXI века здание было снесено, что делает его примером утраченного архитектурного наследия.',
  },
  {
    id: 6,
    title: 'Дом быта в Финском переулке',
    coords: [59.941, 30.359],
    image: './assets/images/finskiy.png',
    shortDescription:
      'Типовой дом быта, отражающий массовое развитие системы услуг в городе.',
    description:
      'Дом быта в Финском переулке был построен в 1968 году и открыт в 1969 году по проекту архитектора Раисы Брегман. Он входил в серию типовых зданий бытового обслуживания, разработанных для масштабного строительства.',
    address: 'Финский пер., 4',
    workHours: [],
    extraTitle: 'Подробная информация',
    extraText:
      'В здании располагались мастерские ремонта одежды, обуви и бытовой техники, а также парикмахерская и фотоателье. Такие типовые проекты позволяли быстро развивать сеть бытовых услуг в городе. Сегодня здание утратило свою первоначальную функцию и используется как административное и коммерческое пространство.',
  },
  {
    id: 7,
    title: 'Дом быта на Разъезжей улице',
    coords: [59.925, 30.343],
    image: './assets/images/razezhaya.png',
    shortDescription:
      'Характерный пример советского модернизма с выразительным стеклянным фасадом.',
    description:
      'Дом быта на Разъезжей улице был построен в 1964–1968 годах по проекту Раисы Брегман и Олега Василенко. Он расположен на важном перекрёстке и является ярким примером архитектуры советского модернизма.',
    address: 'Разъезжая ул., 12',
    workHours: [],
    extraTitle: 'Подробная информация',
    extraText:
      'Главной особенностью здания является стеклянный фасад, заключённый в бетонную рамку. Внутри располагались многочисленные мастерские: ремонт бытовой техники, обуви, одежды, кожгалантереи, а также химчистка. Здание играло важную роль в повседневной жизни жителей района. Сегодня оно используется как коммерческое пространство.',
  },
  {
    id: 8,
    title: 'Дом быта на Лермонтовском проспекте',
    coords: [59.925, 30.291],
    image: './assets/images/lermontovskiy.png',
    shortDescription:
      'Крупный районный центр бытовых услуг с выразительной модернистской архитектурой.',
    description:
      'Дом быта на Лермонтовском проспекте был построен в конце 1960-х годов по проекту архитекторов Голынкина, Келлера и Бровчина. Он входил в систему районных центров бытового обслуживания.',
    address: 'Лермонтовский пр., 1',
    workHours: [],
    extraTitle: 'Подробная информация',
    extraText:
      'Здание отличается крупными стеклянными фасадами и строгими геометрическими формами. Внутри располагались мастерские ремонта бытовой техники, фотоателье, парикмахерские и другие сервисы. В последние годы обсуждался вопрос о его сносе в связи со строительством метро, однако здание продолжает использоваться как коммерческое.',
  },
  {
    id: 9,
    title: 'Дом быта «Кристалл»',
    coords: [59.881, 30.442],
    image: './assets/images/image.png',
    shortDescription:
      'Крупнейший дом быта в Ленинграде и один из самых масштабных в СССР.',
    description:
      'Дом быта «Кристалл» был построен в период с 1968 по 1975 год и стал крупнейшим центром бытового обслуживания в Ленинграде. Он обслуживал жителей Невского района и других частей города.',
    address: 'ул. Седова, 37',
    workHours: [],
    extraTitle: 'Подробная информация',
    extraText:
      'Комплекс включал десятки различных сервисов: ремонт бытовой техники, прачечную самообслуживания, химчистку, фотоателье, переплётные мастерские и другие. По масштабу и функциональности он не имел аналогов в городе и считался крупнейшим домом быта в СССР. В постсоветский период здание было реконструировано и преобразовано в бизнес-центр.',
  },
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

function getCardMetrics() {
  if (window.innerWidth <= 900) {
    return { width: 300, height: 320 };
  }
  return { width: 370, height: 380 };
}

export default function MapPage() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showNearbyOnly, setShowNearbyOnly] = useState(true);
  const [zoom, setZoom] = useState(13);
  const [markerPoints, setMarkerPoints] = useState([]);
  const [activePlace, setActivePlace] = useState(null);
  const [placeCardStyle, setPlaceCardStyle] = useState(null);
  const [detailPlace, setDetailPlace] = useState(null);

  const mapRef = useRef(null);
  const mapShellRef = useRef(null);
  const activePlaceRef = useRef(null);
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

    top -= 50;
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

  const openDetailDrawer = (place) => {
    setDetailPlace(place);
    closePlaceCard();
    setIsFiltersOpen(false);
  };

  useEffect(() => {
    const handleDocumentClick = (event) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      if (
        target.closest('.map-place-card-overlay') ||
        target.closest('.map-detail-drawer') ||
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
  }, [markerPoints, detailPlace]);

  return (
    <YMaps query={ymapsQuery}>
      <div className="map-page">
        <div className="map-page__header-wrap">
          <div className="map-page__inner">
            <Header variant="map" user={mockUser} showLogin={false} />
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

                        scheduleSync();
                      } catch (_) {}
                    }, 100);
                  }}
                />
              </div>

              <div className="map-page__markers-layer">
                {locations.map((location) => {
                  const point = markerPoints.find((item) => item.id === location.id);
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
                      onMouseEnter={() => openPlaceCard(location)}
                      onClick={() => openPlaceCard(location)}
                      aria-label={location.title}
                    >
                      <img src={pinIcon} alt="" draggable="false" />
                    </button>
                  );
                })}
              </div>
            </div>

            {activePlace && placeCardStyle && (
              <div
                className={`map-place-card-overlay map-place-card-overlay--${placeCardStyle.placement}`}
                style={{
                  left: `${placeCardStyle.left}px`,
                  top: `${placeCardStyle.top}px`,
                }}
              >
                <article className="map-place-card">
                  <div className="map-place-card__image-wrap">
                    <img
                      className="map-place-card__image"
                      src={activePlace.image}
                      alt={activePlace.title}
                    />
                    {/* <div className="map-place-card__fav" aria-hidden="true">
                      ★
                    </div> */}
                  </div>

                  <div className="map-place-card__content">
                    <div className="map-place-card__tags">{activePlace.tags}</div>
                    <div className="map-place-card__title">{activePlace.title}</div>
                    <div className="map-place-card__description">
                      {activePlace.description}
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
            <h2 className="map-detail-drawer__title">{detailPlace.title}</h2>

            <div className="map-detail-drawer__section">
              <div className="map-detail-drawer__label">
                {detailPlace.shortDescription}
              </div>
              <p className="map-detail-drawer__text">
                {detailPlace.description}
              </p>
            </div>

            <div className="map-detail-drawer__section">
              <div className="map-detail-drawer__label">Галерея</div>

              <div className="map-detail-drawer__gallery">
                <img
                  className="map-detail-drawer__gallery-image"
                  src={detailPlace.image}
                  alt={detailPlace.title}
                />
              </div>
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
          </div>
        </aside>
      )}

      <div
        className={`map-page__map-dim ${
          isFiltersOpen || detailPlace ? 'map-page__map-dim--visible' : ''
        }`}
        onClick={() => {
          setIsFiltersOpen(false);
          closePlaceCard();
          closeDetailDrawer();
        }}
      />

        <div className="map-page__footer-wrap">
          <div className="map-page__inner">
            <Footer className="site-footer--map" />
          </div>
        </div>
      </div>
    </YMaps>
  );
}