'use strict';
// return a function that runs func in a minimum fixed timeout,
// function will not be called until previous call is complete.
module.exports = (function runTimeout (func, timeout) {
	var running = false,
		timer   = 0,
		cb = function () {
			running =false;
		},
		runner = function () {
			timer = clearTimeout(timer);
			if (running) { //didn't finish last call, try again after timeout
				timer = setTimeout(runner, timeout);
				return;
			}
			running = true;
			func().finally(cb);
			return;
		};

	return (function timeoutRunner () {
		if (timer) { //do nothing since timer is already active
			return ;
		}
		timer = setTimeout(runner, timeout);

	});
});