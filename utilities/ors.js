import Openrouteservice from "openrouteservice-js";
// Class instantiation


const secondsToMinutes = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  return minutes
}

const handleResponse = (response, parameters) => {
  try{
    const {  destinations: _destinations, origin: _origin } = parameters

    const destinations = _destinations.map((item, index) => {
      const duration = response.durations[0][index]
      return {
        id: item.id,
        duration: secondsToMinutes(duration)
      }
      
    })

    return {
      origin: _origin,
      destinations
    }


  } catch (err) {
    return new Error({status: 500, text: 'Issue translating response in handleResponse function'}) 
  }


}

// Helpers
export const generateMatrix = async (parameters) => {
  const Matrix = new Openrouteservice.Matrix({ api_key: process.env.OPENROUTESERVICE_API_KEY});
  
  const sources = parameters.origin
  const destinations = parameters.destinations.map(item => item.coords)

  const locations = [
    ...sources,
    ...destinations
  ]

  const profile = 'driving-car' // driving-car, driving-hgv, cycling-regular, cycling-road, cycling-mountain, cycling-electric, foot-walking, foot-hiking, wheelchair
  const metrics = ['duration'] // duration, distance
  const units = 'mi' // mi, km, m
  const id = 'vsda-matrix-routing'

  try{
    const response = await Matrix.calculate({
      sources: sources.map((item, index) => index),
      destinations: destinations.map((item, index) => index + sources.length),
      locations,
      profile,
      metrics,
      units, 
      id
    })

    const results = handleResponse(response, parameters)
    return results
  } catch (err) {
    return new Error({status: err.status, message: err.text})
  }
}

// origin, destination are [lng,lat]
export const generateDirections = async ({ origin, destination}) => {
  let Directions = new Openrouteservice.Directions({ api_key: process.env.OPENROUTESERVICE_API_KEY});
  
  const coordinates = [
    origin,
    destination
  ]

  const profile = 'driving-car' // driving-car, driving-hgv, cycling-regular, cycling-road, cycling-mountain, cycling-electric, foot-walking, foot-hiking, wheelchair

  try{
    let response = await Directions.calculate({
      coordinates,
      profile,
      geometry: true, 
      instructions: false,
      format: 'geojson'
    })
    return response
  } catch (err) {
    throw new Error({status: err.status, message: err.text})
  }
}
