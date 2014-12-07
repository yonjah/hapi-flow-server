'use strict';

var hapi    = require('hapi'),
	colm    = require('hapi-colm'),
	path    = require('path'),
	lout    = require('lout'),
	Promise = require('bluebird'),
	server  = new hapi.Server('localhost', 8000, { debug: { request: ['error'] } });

Promise.promisifyAll(require('tingodb')());
Promise.promisifyAll(require('tingodb/lib/tcursor').prototype);


server.views({
    engines: {
        html: require('handlebars')
    },
    context: {},
    isCached: false,
    path: path.join(__dirname, 'templates'),
    layoutPath: path.join(__dirname, 'templates/layouts')
});


server.pack.register([colm, lout], function (err){
	if (err) {
		throw err;
	}
	var controllers = {};

	server.plugins.colm.load('controllers', controllers, function (path, base, ext, scope){
		var controller = require(path);
		scope[base] = controller;
		server.route(controller);
	}).then(server.start.bind(server));
});