index.html: lib/connect-sessionvoc.js
	dox \
		--title "Connect SessionVOC" \
		--desc "secure, reliable, external session database SessionVOC" \
		--ribbon "http://github.com/triAGENS/connect-sessionvoc" \
		$< > $@
