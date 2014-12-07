'use strict';
var Promise       = require('bluebird'),
	Db            = require('tingodb')().Db,
	db            = new Db('./db/', {}),
	collection    = db.collection('trigger'),
	runTimeout    = require('../modules/runTimeout'),
	timeout       = 10 * 1000, //10 sec
	repoModel     = require('./repo'),
	jobModel      = require('./job'),
	model         = {
		STATUS: {'INIT': 1, 'STARTED': 2, 'DONE': 3},
		collection: collection,
	};

model.get = function (id) {
	return collection.findOneAsync({_id: id});
};

model.getByStatus = function (status) {
	return collection.findAsync({status: status});
};

model.insert = function (data) {
	return collection.insertAsync(data);
};

model.update = function (id, data) {
	return collection.update({_id: id}, data);
};

model.findOne = function () {
	return model.collection.findOneAsync.apply(model.collection, arguments);
};

model.find = function () {
	return model.collection.findAsync.apply(model.collection, arguments);
};

model.check = runTimeout(function checkTriggersRun () {
	return repoModel.getByType(repoModel.TYPE.LIB)
		.then(function (libRepos){
			return libRepos.toArrayAsync();
		}).then(function (libRepos){ // cache lib repos for this call
			return model.getByStatus({status: model.STATUS.INIT})
				.then(function (triggers) {
					// if we had active triggers reschedule check to make sure they finish
					if (triggers.length) {
						model.check();
					}
					return triggers.toArrayAsync();
				}).map(function (trigger) {
					return repoModel.get(trigger.repo_id)
						.then(function (repo){
							if (repo.type === repoModel.TYPE.CORE) {
								return Promise.each(libRepos, function (target) {
									return jobModel.insert({
										trigger_id: trigger._id.id,
										status: model.STATUS.INIT,
										target: target._id.id,
										source: repo._id.id
									});
								});
							} else {
								return jobModel.insert({
									trigger_id: trigger._id.id,
									status: model.STATUS.INIT,
									target: repo._id.id,
									source: repo._id.id
								});
							}
						}).then(
							jobModel.check
						).then(
							model.update.bind(model, trigger._id, {$set: {status: model.STATUS.STARTED}})
						);
				});
		});
}, timeout);


model.check();
module.exports = model;