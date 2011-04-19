index.html: lib/connect-sessionvoc.js
	dox \
		--title "Connect SessionVOC" \
		--desc "secure, reliable, external session database SessionVOC" \
		--ribbon "http://github.com/triAGENS/connect-sessionvoc" \
		$< > $@



TEST = expresso
TESTS ?= test/*.test.js

.PHONY: test

test:
	@NODE_ENV=test $(TEST) \
		-I lib \
		-I ../connect/lib \
		$(TEST_FLAGS) $(TESTS)

