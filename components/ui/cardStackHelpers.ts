const SCROLLBAR_OFFSET = 8;
const SCROLLBAR_THUMB_SIZE = 36;
const TRACK_THICKNESS = 6;
const TRACK_GAP = 12;

const getTrackLength = (isVertical: boolean, height: number, width: number) =>
  isVertical ? height : width;

// Смещение карточек влево, чтобы они визуально не перекрывали вертикальный скроллбар.
const getCardLeft = (
  containerWidth: number,
  cardWidth: number,
  showScrollBar: boolean,
  isVertical: boolean
) => {
  'worklet';
  const center = (containerWidth - cardWidth) / 2;
  return showScrollBar && isVertical ? center - SCROLLBAR_OFFSET : center;
};


export {
  SCROLLBAR_OFFSET,
  SCROLLBAR_THUMB_SIZE,
  TRACK_THICKNESS,
  TRACK_GAP,
  getTrackLength,
  getCardLeft,
};
