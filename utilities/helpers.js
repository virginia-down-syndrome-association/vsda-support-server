import greatCircle from '@turf/great-circle'
import bbox from '@turf/bbox'

export const generateGreatCircleRoutes = (parameters) => {
  const { origin, destinations } = parameters

  const start = origin[0];

  const routes = destinations.map(destination => {
    const end = destination.coords
    const gc = greatCircle(start, end, {properties: {id: destination.id}})
    return gc
  })

  const featureCollection = {
    "type": "FeatureCollection",
    "features": routes
  }

  return {
    circleRoutes: featureCollection,
    bbox: bbox(featureCollection)
  }
}
