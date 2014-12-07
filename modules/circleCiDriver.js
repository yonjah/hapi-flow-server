'use strict';

var Promise      = require('bluebird'),
	request      = require('request'),
	CiUrl        = 'https://circleci.com/api/v1/',
	buildPath    = 'project/yonjah/hapi-flow-tester/',
	newBuildPath = buildPath + 'tree/master',
	CiToken      = 'TOKEN';


function httpReq (options) {
	return new Promise(function (resolve, reject) {
		request(options, function (error, response, body) {
			if (error) {
				reject(error);
			} else {
				resolve([body, response]);
			}
		});
	});
}

function ciReq (options) {
	options.url     =  CiUrl + options.url + '?circle-token=' + CiToken;
	options.method  = options.method || (options.body ? 'POST' : 'GET');
	options.json    = true;
	return httpReq(options);
}

function runBuild(options) {
	return ciReq({url: newBuildPath, body: { build_parameters: options}})
		.spread(function (body/*, response*/) {
				/*
					all_commit_details: Array[1]
					author_date: "2014-12-06T11:36:22Z"
					author_email: "yonjah@gmail.com"
					author_name: "Yoni Jah"
					body: ""
					branch: "master"
					build_num: 11
					build_parameters: Object
					build_time_millis: null
					build_url: "https://circleci.com/gh/yonjah/hapi-flow-tester/11"
					canceled: false
					circle_yml: null
					committer_date: "2014-12-06T11:36:22Z"
					committer_email: "yonjah@gmail.com"
					committer_name: "Yoni Jah"
					compare: null
					dont_build: null
					failed: null
					feature_flags: Object
					infrastructure_fail: false
					is_first_green_build: false
					job_name: null
					lifecycle: "not_running"
					messages: Array[0]
					node: null
					oss: true
					outcome: null
					parallel: 1
				*/
				return body;
			});
}


function getBuild(id) {
	return ciReq({url: buildPath + id})
		.spread(function (body/*, response*/) {
				/*
					"steps" : [],
					"build_url" : "https://circleci.com/gh/yonjah/hapi-flow-tester/24",
					"failed" : null,
					"has_artifacts" : true,
					"status" : "fixed",
					"lifecycle" : "finished",
					"build_time_millis" : 46196,
					"messages" : [ ],
					"job_name" : null,
					"outcome" : "success",
					"canceled" : false
				*/
				return body;
			});
}

function getBuildResult(id) {
	return ciReq({url: buildPath + id + '/tests'})
		.spread(function (body/*, response*/) {
				/*
					"steps" : [],
					"build_url" : "https://circleci.com/gh/yonjah/hapi-flow-tester/24",
					"failed" : null,
					"has_artifacts" : true,
					"status" : "fixed",
					"lifecycle" : "finished",
					"build_time_millis" : 46196,
					"messages" : [ ],
					"job_name" : null,
					"outcome" : "success",
					"canceled" : false
				*/
				return body.tests || [];
			});
}

module.exports = {
	getBuildResult: getBuildResult,
	runBuild: runBuild,
	getBuild: getBuild
};