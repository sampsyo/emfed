.PHONY: all
all: emfed.js

%.js: %.ts
	deno bundle $^ > $@
