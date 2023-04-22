import { decode } from './flexipoly.js';
import bbox from '@turf/bbox';
/**
 * Reworks order of coordinates to be lng/lat instead of lat/lng
 *
 * @param {Array} coordinates - Array of Arrays. Each inner array is a coordinate pair [lat, lng]

 * @returns {Array}
 */
const reworkCoordinates = (coords) => {
  const coordinates =  coords.map((coordinate) => {
     var newPair = [];
     newPair.push(coordinate[1]);
     newPair.push(coordinate[0]);
     return newPair;
   });
   const initialPair = coordinates[0];
   coordinates.push(initialPair); //close the polygon since coords returned from HERE are not technically equivelent to successfully close polygon. Force to ensure same start/end point.
   return { coordinates }
 }
 
 /**
 * Converts minutes to seconds for use in the HERE isoline API
 *
 * @param {Number} minutes - # of minutesestrian', 'taxi', 'bicycle', 'scooter']

 * @returns {Number}
 */
const convertToSeconds = (minutes) => minutes * 60


/**
 * Reworks order of coordinates to be lng/lat instead of lat/lng
 *
 * @param {Array} coordinates - Array of Arrays. Each inner array is a coordinate pair [lat, lng]

 * @returns {Array}
 */


/**
 * Decodes the polyline geometry returned from the HERE isoline API - https://github.com/heremaps/flexible-polyline
 * 
 * @param {Array} polygons - isolines[i].polygons

 * @returns {Array} coordinates suitable for use in a GeoJSON Polygon
*/
const decodePolylines = (polygons) => {
  const [polygon] = polygons;
  const { polyline }  = decode(polygon.outer);
  return { polyline }
}

/**
 * Returns a GeoJSON Polygon feature

 * @param {Array} coordinates - decodePolylines return value

 * @returns {Object} GeoJSON Polygon
*/
const compileGeojsonPolygon = (polygons) => {
  const { polyline } = decodePolylines(polygons);
  const { coordinates } = reworkCoordinates(polyline);
  const geojson = {
    type: "Feature",
    geometry: {
      "type": "Polygon",
      "coordinates": [coordinates]
    },
    properties: {}
  }
  console.log('compileGeojsonPolygon:geojson', geojson);
  return { geojson }; 
}


/**
 * Calls the Isoline Routing API to calculate a reverse isochrone
 *
 * @param {Object} location - The location around which to build the isoline { lat, lon}
 * @param {string} mode - The mode of transport to use for the isoline ['car', 'truck', 'pedestrian', 'taxi', 'bicycle', 'scooter']
 * @param {number} travelTime - time (in minutes)

 * @returns {Object}
 */
const getIsochrone = async ({location, mode, travelTime}) => {
  try { 
    const origin = `${location.lat},${location.lng}`;

    const formattedTravelTime = convertToSeconds(travelTime)
    
    const apikey = process.env.HERE_API_KEY;
    const query = `transportMode=${mode}&range[type]=time&range[values]=${formattedTravelTime}&origin=${origin}&apiKey=${apikey}`

    const url = 'https://isoline.router.hereapi.com/v8/isolines' + '?' + new URLSearchParams(query); // HERE isoline API 
    console.log(url)
    const response = await fetch(url);
    const data  = await response.json();
    const { isolines } = data;

    if (isolines.length > 1) console.warning('More than one isoline returned. Only the first will be used.');
    const [ primaryIsoline ] = isolines; //ASSUMPTION: only one isoline is returned/used from isolines[]

    const { geojson } = compileGeojsonPolygon(primaryIsoline.polygons);
    const areaExtent = bbox(geojson);
    return { isochrone: geojson, areaExtent };
    

  } catch (err) {
    console.error('Error while querying Isoline Routing API', err.status, err.message, err.response && err.response.body);
    return Promise.reject(new Error(err.message));
  }
}
export {
  getIsochrone
}

