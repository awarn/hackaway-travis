
require('dotenv').config();

const foursquare = (require('foursquarevenues'))
	(process.env.FOURSQUARE_ID, process.env.FOURSQUARE_SECRET);
const restify = require('restify');

if (!process.env.FOURSQUARE_ID) {
	process.exit(1);
}
if (!process.env.FOURSQUARE_SECRET) {
	process.exit(1);
}

function getVenues(lat, long, radius) {

	radius = radius != undefined ? radius : 2000;

	return new Promise((resolve, reject) => {

		let params = {
			ll: `${lat},${long}`,
			radius: radius,
			limit: 50,
			intent: 'browse',
			categoryId: '4d4b7104d754a06370d81259,4d4b7105d754a06374d81259'
		}

		foursquare.getVenues(params, function(error, response) {
			if (!error) {
				resolve(response);
			}
			else {
				reject(error);
			}
		});

	});
}

let chain = [];
function getVenueChain(lat, long) {
	return new Promise((resolve, reject) => {
		getVenues(lat, long)
		.then((response) => {
			let venues = response.response.venues;
			let choice = venues[Math.floor(Math.random()*venues.length)];
			chain.push(choice);
			return getVenues(choice.location.lat, choice.location.lng);
		})
		.then((response) => {
			let venues = response.response.venues;
			let choice = venues[Math.floor(Math.random()*venues.length)];
			chain.push(choice);
			return getVenues(choice.location.lat, choice.location.lng);
		})
		.then((response) => {
			let venues = response.response.venues;
			let choice = venues[Math.floor(Math.random()*venues.length)];
			chain.push(choice);
			return getVenues(choice.location.lat, choice.location.lng);
		})
		.then((response) => {
			let venues = response.response.venues;
			let choice = venues[Math.floor(Math.random()*venues.length)];
			chain.push(choice);
			return getVenues(choice.location.lat, choice.location.lng);
		})
		.then((response) => {
			let venues = response.response.venues;
			let choice = venues[Math.floor(Math.random()*venues.length)];
			chain.push(choice);
			return getVenues(choice.location.lat, choice.location.lng);
		})
		.then((response) => {
			resolve(chain);
		})
		.catch((error) => {
			reject(error);
		});
	});
}
 
let server = restify.createServer({
  name: 'travis',
  version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
 
server.get('/venues/:lat/:long', function (req, res, next) {
  getVenues(req.params.lat, req.params.long)
	.then((venues) => {
		console.log(venues);
		res.send(venues);
	})
	.catch((error) => {
		console.log(error);
		res.send(error);
	})
  return next();
});

server.get('/chain/:lat/:long', function (req, res, next) {
  getVenueChain(req.params.lat, req.params.long)
	.then((venues) => {
		console.log(venues);
		res.send(venues);
	})
	.catch((error) => {
		console.log(error);
		res.send(error);
	})
  return next();
});
 
let port = process.env.PORT || 8080;
server.listen(port, function () {
  console.log('%s listening at %s', server.name, server.url);
});

