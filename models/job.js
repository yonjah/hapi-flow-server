'use strict';
var Promise       = require('bluebird'),
	hoek          = require('hoek'),
	Db            = require('tingodb')().Db,
	db            = new Db('./db/', {}),
	collection    = Promise.promisifyAll(db.collection('job')),
	runTimeout    = require('../modules/runTimeout'),
	timeout       = 10 * 1000, //10 sec
	statusTimeout = 1 * 60 * 1000, //1 min
	ciDriver      = require('../modules/circleCiDriver'),
	repoModel     = require('./repo'),
	// triggerModel  = require('./trigger'),
	model         = {
		STATUS: {'INIT': 1, 'STARTED': 2, 'DONE': 3},
		collection: collection,
	};


model.get = function (id) {
	return model.collection.findOneAsync({_id: id});
};

model.getByStatus = function (status) {
	return model.collection.findAsync({status: status});
};

model.insert = function (data) {
	return model.collection.insertAsync(data);
};

model.update = function (id, data) {
	return model.collection.update({_id: id}, data);
};

model.runJob = function runJob (job) {
	var buildOptions = {};
	return Promise.all([
			require('./trigger').get(job.trigger_id),
			repoModel.get(job.target)
		]).spread(function (trigger, target) {
			hoek.merge(buildOptions, {
				'TEST_REPO'    : target.url,
				'TEST_REPO_DIR': target.name,
				'TEST_COMMAND' : target.test_command,
				'REPORT_FILE'  : target.report_file
			});
			return trigger;
		}).then(function (trigger) {
			repoModel.getByType(repoModel.TYPE.CORE)
				.then(function (repos){
					return repos.toArrayAsync();
				}).map(function (repo){
					var repoId = repo.name.toUpperCase();
					buildOptions[ repoId + '_REPO'] = repo.url;
					if (job.source === repo._id) {
						buildOptions[ repoId + '_COMMIT'] = trigger.commit;
					}
				}).then(console.log.bind(this, buildOptions));
		}).then(
			ciDriver.runBuild.bind(ciDriver, buildOptions)
		).then(function (result){
			var build = result.build_num;
			return model.update(job._id, {
				status: model.STATUS.STARTED,
				build_id : build
			});
		}).then(
			model.checkStatus
		);
};

model.updateStatus = function updateStatus (job) {
	if (job.status !== model.STATUS.STARTED) {
		throw new Error('Job status should be STARTED: ' + job.status);
	}
	if (!job.build_id) {
		throw new Error('Job does\'nt have a build');
	}


	return ciDriver.getBuild(job.build_id).then(function (build) {
		console.log(build);
		if (build.lifecycle === 'finished') {
			if (build.has_artifacts) {
				ciDriver.getBuildResult(job.build_id).then(function (result){
					return model.update(job._id, {
						result: result
					});
				});
			}
			return model.update(job._id, {
				status : model.STATUS.DONE,
				success: build.outcome === 'success'
			});
		}
		return job;
	});
};

model.check = runTimeout(function checkJobsRun () {
	return model.getByStatus(model.STATUS.INIT)
		.then(function (jobs) {
			// if we had active jobs reschedule check to make sure they finish
			if (jobs.length) {
				model.check();
			}
			return jobs.toArrayAsync();
		}).map(model.runJob);
}, timeout);


model.checkStatus = runTimeout(function checkJobsStatusRun () {
	return model.getByStatus(model.STATUS.STARTED)
		.then(function (jobs) {
			return jobs.toArrayAsync();
		}).then(function (jobs) {
			// if we have started jobs we need to make sure they finish
			if (jobs.length) {
				model.checkStatus();
			}
			return jobs;
		}).map(model.updateStatus);
}, statusTimeout);


model.check();
model.checkStatus();
module.exports = model;