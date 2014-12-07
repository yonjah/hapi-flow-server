'use strict';

var Promise      = require('bluebird'),
	repoModel    = require('../models/repo'),
	triggerModel = require('../models/trigger'),
	STATUS       = {'INIT': 1, 'STARTED': 2, 'DONE': 3};

module.exports = [{
		method: ['GET', 'POST'],
		path: '/hooks/{repo}',
		handler: function (request, reply) {
			var id = request.params.repo;

			if (request.payload || request.payload.ref) { //only run calls with payload
				repoModel.get(id).then(function (item){
					if (!item) {
						throw Error('Could not find repo: ' + name);
					}
					return triggerModel.insert({
								repo_id: item._id,
								status : STATUS.INIT,
								commit : request.payload.after,
								branch : request.payload.ref.split('refs/heads/')[1],
								tag    : request.payload.ref.split('refs/tags/')[1]
							}).then(triggerModel.check);
				}).catch(
				 	console.log.bind(console)
				);
			}
			return reply(true);
		}
	}, {
		method : 'POST',
		path   : '/repo',
		handler: function (request, reply) {
			var url     = request.payload.url,
				type    = request.payload.type || '',
				branch  = request.payload.branch || 'master',
				parts = url.split('/'),
				name  = parts[parts.length -1].replace('.git', '');

			type =  type && repoModel.TYPE[type.toUpperCase()] || repoModel.TYPE.LIB,
			Promise.resolve().then(function () {
				if (type === repoModel.TYPE.CORE) {
					return repoModel.findOne({
							name: name,
							type: type
						}).then(function (repo){
							if (repo && repo.url !== url) {
								throw Error('Already has core repo named: '+ name);
							}
							return repo;
						});
				} else {
					return repoModel.findOne({
							name: name,
							url: url
						});
				}
			}).then(function (repo){
				if (repo) {
					return repo;
				}
				return repoModel.insert({
					url         : url,
					name        : name,
					type        : type,
					branch      : branch,
					test_command: 'npm run test-xml',
					report_file : 'result.xml',
					jobs        : []
				}).then(function (result){
					return result[0];
				});
			}).then(function (repo) {
				repo.hook = 'http://' + request.headers.host + '/hooks/' + repo._id;
				return repo;
			}).then(function (repo){
				reply(repo);
			}).catch(function (err){
				reply(err.message);
			});
		}
}];