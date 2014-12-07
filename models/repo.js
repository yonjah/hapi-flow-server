'use strict';
var Promise       = require('bluebird'),
	Db            = require('tingodb')().Db,
	db            = new Db('./db/', {}),
	collection    = Promise.promisifyAll(db.collection('repo')),
	model         = {
		TYPE: {'CORE': 1, 'LIB' : 2},
		collection: collection
	};

model.getBy = function (param, value) {
	var data = {};
	data[param] = value;
	return model.collection.findAsync(data);
};

model.get = function (id) {
	return model.collection.findOneAsync({_id: id});
};

model.findOne = function () {
	return model.collection.findOneAsync.apply(model.collection, arguments);
};

model.find = function () {
	return model.collection.findAsync.apply(model.collection, arguments);
};

model.getByType = model.getBy.bind(model, 'type');
model.getByName = model.getBy.bind(model, 'name');
model.getByUrl = model.getBy.bind(model, 'url');


model.insert = function (data) {
	return model.collection.insertAsync(data);
};

module.exports = model;