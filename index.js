
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

function getVenues(lat, long) {
	return new Promise((resolve, reject) => {

		let params = {
			ll: `${lat},${long}`
		}

		foursquare.getVenues(params, function(error, venues) {
			if (!error) {
				resolve(venues);
			}
			else {
				resolve(error);
			}
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
 
server.get('/echo/:lat/:long', function (req, res, next) {
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
 
server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});

