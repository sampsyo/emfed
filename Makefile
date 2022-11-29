.PHONY: all dev

all: emfed.js

dev:
	packup example.html

%.js: %.ts
	deno bundle $^ > $@
