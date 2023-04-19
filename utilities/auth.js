import fetch from 'node-fetch';

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
