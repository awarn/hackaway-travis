
require('dotenv').config();

const Bluebird = require('bluebird');
const foursquare = (require('foursquarevenues'))
	(process.env.FOURSQUARE_ID, process.env.FOURSQUARE_SECRET);
const restify = require('restify');

if (!process.env.FOURSQUARE_ID) {
	process.exit(1);
}
if (!process.env.FOURSQUARE_SECRET) {
	process.exit(1);
}

let chain = [];

function getVenues(lat, long, radius) {

	radius = radius != undefined ? radius : 2000;

	return new Promise((resolve, reject) => {

		let params = {
			ll: `${lat},${long}`,
			radius: radius,
			limit: 10,
			intent: 'browse',
			categoryId: '4d4b7104d754a06370d81259,4d4b7105d754a06374d81259'
		}

		foursquare.getVenues(params, function(error, response) {
			if (!error) {
				let venues = response.response.venues;
				let promises = [];
				for (var i = venues.length - 1; i >= 0; i--) {
					promises.push(getVenue(venues[i].id));
				}
				Bluebird.all(promises).then((response) => {
					resolve(response);
				});
			}
			else {
				reject(error);
			}
		});

	});

}

function getVenue(id) {
	return new Promise((resolve, reject) => {
		let params = {
			venue_id: id
		}
		foursquare.getVenue(params, function(error, response) {
			if (!error) {
				let venue = response.response.venue;
				venue.listed = null;
				venue.photos = null;
				venue.popular = null;
				venue.tips = null;
				resolve(venue);
			}
			else {
				reject(error);
			}
		})
	})
}

function makeChoice(venues) {

	let filteredVenues = venues.map((venue) => {
		if (venue.rating >= 7) {
			return venue;
		}
	});

	let choice = null;
	if (filteredVenues.length > 0) {
		choice = filteredVenues[Math.floor(Math.random()*filteredVenues.length)];
	}
	else {
		choice = venues[Math.floor(Math.random()*venues.length)];
	}

	chain.push(choice);
	return chain;

}

function getMidpoint(lat1,lon1,lat2,lon2) {

	let convertN = (Math.PI / 180);

	let dLon = (lon2 - lon1) * convertN;

	//convert to radians
	lat1 = lat1 * convertN;
	lat2 = lat2 * convertN;
	lon1 = lon1 * convertN;

	let Bx = Math.cos(lat2) * Math.cos(dLon);
	let By = Math.cos(lat2) * Math.sin(dLon);
	let lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
	let lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

	let degLat = lat3 / convertN;
	let degLng = lon3 / convertN;

	let location = {
		lat: degLat,
		lng: degLng
	}
	//print out in degrees
	return location;
}

function getVenueChain(lat, lng) {
	return new Promise((resolve, reject) => {
		getVenues(lat, lng, 8000)
		.then((response) => {
			let chain = makeChoice(response);
			let choice = chain[chain.length-1];
			if (choice) {
				return getVenues(choice.location.lat, choice.location.lng);
			}
			let rejection = {
				error: "No venues found for that location."
			}
			reject(rejection);
		})
		.then((response) => {
			let chain = makeChoice(response);
			let choice = chain[chain.length-1];
			if (choice) {
				return getVenues(choice.location.lat, choice.location.lng, 4000);
			}
			resolve(chain);
		})
		.then((response) => {
			let chain = makeChoice(response);
			let choice = chain[chain.length-1];
			if (choice) {
				return getVenues(choice.location.lat, choice.location.lng);
			}
			resolve(chain);
		})
		.then((response) => {
			let chain = makeChoice(response);
			let choice = chain[chain.length-1];
			let midPoint = getMidpoint(
				choice.location.lat, choice.location.lng, 
				lat, lng);
			if (choice) {
				return getVenues(choice.location.lat, choice.location.lng);
			}
			resolve(chain);
		})
		.then((response) => {
			let chain2 = makeChoice(response);
			chain = [];
			resolve(chain2);
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
 
server.get('/venues/:lat/:lng', function (req, res, next) {
  getVenues(req.params.lat, req.params.lng)
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

server.get('/chain/:lat/:lng', function (req, res, next) {
  getVenueChain(req.params.lat, req.params.lng)
	.then((venues) => {
		console.log(venues.length);
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

