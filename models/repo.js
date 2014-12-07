'use strict';
var Promise       = require('bluebird'),
	Db            = require('tingodb')().Db,
	db            = new Db('./db/', {}),
	collection    = Promise.promisifyAll(db.collection('repo')),
	model         = {
		TYPE: {'CORE': 1, 'LIB' : 2},
		collection: collection
	};


model.get = function (id) {
	return model.collection.findOneAsync({_id: id});
};

model.getByType = function (type) {
	return model.collection.findAsync({type: type});
};


model.insert = function (data) {
	return model.collection.insertAsync(data);
};

module.exports = model;