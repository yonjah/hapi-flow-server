'use strict';

var Promise      = require('bluebird'),
	repoModel    = require('../models/repo'),
	triggerModel = require('../models/trigger'),
	jobModel = require('../models/job'),
	STATUS       = {'INIT': 1, 'STARTED': 2, 'DONE': 3};

function returnArray (item){
	return item.toArrayAsync();
}

module.exports = [{
		method: 'GET',
		path: '/',
		handler: function (request, reply) {
			repoModel.find({type: repoModel.TYPE.LIB})
				.then(
					returnArray
				).then(function (libs){
					console.log(libs);
					reply.view('index', {repos: libs}, {layout: 'base'});
				});
		}
	}, {
		method: 'GET',
		path: '/core',
		handler: function (request, reply) {
			repoModel.find({type: repoModel.TYPE.CORE})
				.then(
					returnArray
				).then(function (libs){
					console.log(libs);
					reply.view('index', {repos: libs}, {layout: 'base'});
				});
		}
	}, {
		method: 'GET',
		path: '/jobs/{id}',
		handler: function (request, reply) {
			var id = +request.params.id;
			jobModel.find({ $or: {target: id, source:id}})
				.then(
					returnArray
				).then(function (jobs){
					var repos = [],
						triggers = [];

					jobs.forEach(function (job){
						if (job.source === job.target) {
							job.source = undefined;
						}
						if (job.source && repos.indexOf(job.source) === -1) {
							repos.push(job.source);
						}
						if (job.target && repos.indexOf(job.target) === -1) {
							repos.push(job.target);
						}
						if (triggers.indexOf(job.trigger_id) === -1) {
							triggers.push(job.trigger_id);
						}
					}, []);

					Promise.all([
						repoModel.find({_id: {$in: repos}}).then(returnArray),
						triggerModel.find({_id: {$in: triggers}}).then(returnArray),
					]).spread(function (repos, triggers) {
						repos = repos.reduce(function (obj, item) {
							obj[item._id.id] = item;
							return obj;
						}, {});
						triggers = triggers.reduce(function (obj, item) {
							obj[item._id.id] = item;
							return obj;
						}, {});
						return jobs.map(function (item){
							item.source  = item.source && repos[item.source];
							item.target  = item.target && repos[item.target];
							item.trigger = item.trigger_id && repos[item.trigger_id];
							if (!item.success && item.result  && item.result.length) {
								item.successCount = 0;
								item.failCount = 0;
								item.result.forEach(function (result){
									if (result.result !== 'success') {
										item.failCount += 1;
									} else {
										item.successCount += 1;
									}
								});
							}
							return item;
						});
					}).then(function (jobs){
						reply.view('jobs', {jobs: jobs.reverse()}, {layout: 'base'});
					});
				});
		}
	}];