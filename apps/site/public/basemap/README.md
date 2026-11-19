# Basemap

The map's physical basemap: land, lakes and rivers from [Natural Earth](https://www.naturalearthdata.com/) at 1:50m. Natural Earth is in the public domain.

| File                                  | Source                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ne_50m_land.json`                    | https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_land.geojson                    |
| `ne_50m_lakes.json`                   | https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_lakes.geojson                   |
| `ne_50m_rivers_lake_centerlines.json` | https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_rivers_lake_centerlines.geojson |

All three come from the `natural-earth-vector` repository at release v5.1.2 (commit `f1890d9f152c896d250a77557a5751a93d494776`).

Processing, to keep the files small:

- every feature's properties are removed, along with the collection's `name`, `crs` and `bbox`;
- coordinates are rounded to 3 decimal places (about 100 m), and points the rounding makes repeat are dropped;
- a line left with fewer than 2 points, or a ring with fewer than 4, is dropped, along with a feature left with none (one river);
- every feature entirely south of 60°S is dropped: Antarctica and the islands around it, which the map never needs.

The coastlines and rivers are modern ones, not their ancient courses.
