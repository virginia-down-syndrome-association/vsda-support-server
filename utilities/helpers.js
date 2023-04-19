import fetch from 'node-fetch';
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

const validateToken = async (token) => {
  const url = 'https://www.arcgis.com/sharing/rest/portals/self';
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.ok
}

export const checkEsriAuthentication = async (req, res, next) => {
  console.log(req.headers)
  try {
    if (!req.headers['esri-token']) throw new Error({type: 'missing-access-token-header'})
    const token = req.headers['esri-token'];
    const isAuthenticated = await validateToken(token);

    if (isAuthenticated) {
      next();
    } else {
      throw new Error({type: 'invalid-access-token'})
    }
  } catch (err){
    if (err.type === 'missing-access-token-header'){
      res.status(401).send({
        msg: 'Missing required "esri-token" header'
      });
    } else{
      res.status(401).send({
        msg: 'Unable to validate access token'
      });
    }
  }
};
