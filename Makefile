.PHONY: clean compile test

rollup = ./node_modules/.bin/rollup -c ./build/rollup.config.js

clean:
	rm -rf dist

build: clean
	${rollup} -f cjs -o ./dist/wx.common.js
	${rollup} -f umd -n wx -o ./dist/wx.umd.js

test:
	@tput setaf 3; echo "Make sure '127.0.0.1 local.daoapp.io' enabled in/etc/hosts"
	@tput setaf 2; echo "You should open http://local.daoapp.io/debug.html in wechatDevtool"
	@tput sgr0
	sudo ./node_modules/.bin/karma start ./build/karma.config.js
