'use strict';

var hapi    = require('hapi'),
	colm    = require('hapi-colm'),
	lout    = require('lout'),
	Promise = require('bluebird'),
	server  = new hapi.Server('localhost', 8000, { debug: { request: ['error'] } });

Promise.promisifyAll(require('tingodb')());
Promise.promisifyAll(require('tingodb/lib/tcursor').prototype);

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