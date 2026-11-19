// The /map view. The site imports it with a dynamic import inside onMounted, so deck.gl stays
// in its own chunk and never runs during pre-rendering.
export { default as MapView } from './components/MapView.vue';
export {
  formatMapUrl,
  formatYearParam,
  parseMapUrl,
  parseYearParam,
  type LayerId,
  type MapUrlState,
} from './url.ts';
