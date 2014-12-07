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
				parts   = url.split('/'),
				name    = parts[parts.length -1].replace('.git', '');

			repoModel.insert({
				url         : url,
				name        : name,
				type        : request.payload.type && repoModel.TYPE[request.payload.type.toUpperCase()] || repoModel.TYPE.LIB,
				branch      : 'master',
				test_command: 'npm run test-xml',
				report_file : 'result.xml',
				jobs        : []
			});
			return reply(true);
		}
}];