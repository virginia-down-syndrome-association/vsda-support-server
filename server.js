/*
  Inspired by Websocket server with express.js and express-ws.js
  (https://www.npmjs.com/package/express-ws)

  Major credit to Tom Igoe
*/

import express from 'express'		    // include express.js
import bodyParser from 'body-parser'
import cors from 'cors'
import ws from 'express-ws'
import dotenv from 'dotenv'
import { generateMatrix } from './utilities/ors.js'
import { generateGreatCircleRoutes } from './utilities/helpers.js'
import { checkEsriAuthentication } from './utilities/auth.js'
import { getIsochrone } from './utilities/here.js'

dotenv.config()

// a local instance of express:
var server = express();
// instance of the websocket server:
var wsServer = ws(server);
// list of client connections:
var clients = new Array;

server.use(bodyParser.json())
server.use(cors())

var corsOptions = {
  origin: 'http://127.0.0.1:5173/',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

// static server should be removed prior to moving to production
// but it's helpful for testing
// serve static files from /public:
server.use('/', express.static('public'));
// server.use(checkEsriAuthentication);

server.post('/matrix', cors(corsOptions), async (req, res) => {
  try {
    const { destinations, origin} = req.body;     // handle request body and convert to message to pass to clientResponse

    const parameters = {
      origin: [origin],
      destinations
    }
    
    const results = await generateMatrix(parameters)
    const { circleRoutes, bbox } = generateGreatCircleRoutes(parameters)

    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      ...results, 
      circleRoutes,
      bbox,
      status: 'success'
    }));


  } catch (err) {
    console.log(err);
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify(err));
  }

});

server.post('/isochrone', cors(corsOptions), async (req, res) => {
  try {
    // location {lat, lng}, travelMode=car, travelDuration is minutes
    console.log(req.body)
    const { location, travelMode, travelDuration} = req.body;
    const params = { 
      location, 
      travelMode, 
      travelDuration
    }     // handle request body and convert to message to pass to clientResponse 

    const { isochrone, areaExtent} = await getIsochrone(params);

    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      isochrone,
      areaExtent,
      status: 'success'
    }));


  } catch (err) {
    console.log(err);
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify(err));
  }
});

server.post('/directions', cors(corsOptions), async (req, res) => {
  try {
   

    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      ...results, 
      circleRoutes,
      bbox,
      status: 'success'
    }));


  } catch (err) {
    console.log(err);
    res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify(err));
  }
});








// this runs after the server successfully starts:
function serverStart() {
  var port = this.address().port;
  console.log('Server listening on port ' + port);
}

// if a client sends a message, print it out:
function clientResponse(data) {
  broadcast(data);
}

function handleClient(thisClient, request) {
  console.log("New Connection");        // you have a new client
  clients.push(thisClient);    // add this client to the clients array

  function endClient() {
    // when a client closes its connection
    // get the client's position in the array
    // and delete it from the array:
    var position = clients.indexOf(thisClient);
    clients.splice(position, 1);
    console.log("connection closed");
  }

  // set up client event listeners:
  thisClient.on('message', clientResponse);
  thisClient.on('close', endClient);
}

// This function broadcasts messages to all webSocket clients
function broadcast(data) {
  // iterate over the array of clients & send data to each
  for (let c in clients) {
    clients[c].send(data);
  }
}

// start the server:
server.listen(process.env.PORT || 3000, serverStart);
// listen for websocket connections:
server.ws('/', handleClient);