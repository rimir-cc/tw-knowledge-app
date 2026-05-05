/*\
title: $:/plugins/rimir/knowledge-app/test/test-pseudo-index.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the `_index` pseudo-segment shipped by knowledge-app.

\*/

"use strict";

describe("knowledge-app: _index pseudo", function() {

	var pseudo = require("$:/plugins/rimir/knowledge-app/pseudo/_index.js");
	var resolver = require("$:/plugins/rimir/namespace/resolver.js");

	function setupWiki(tiddlers) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers(tiddlers || []);
		wiki.addTiddler({title: "$:/config/rimir/namespace/walk-up", text: "yes"});
		wiki.addTiddler({title: "$:/config/rimir/namespace/aliases", text: "yes"});
		wiki.addTiddler({title: "$:/config/rimir/namespace/pseudo-expansion", text: "yes"});
		wiki.addIndexersToWiki();
		return wiki;
	}

	it("exports a name '_index'", function() {
		expect(pseudo.name).toBe("_index");
	});

	it("returns 'index' when prefix has an index child", function() {
		var wiki = setupWiki([
			{title: "knowledge/topics/programming/index", text: "Index"},
			{title: "knowledge/topics/programming/Foo", text: ""}
		]);
		expect(pseudo.resolve("knowledge/topics/programming", wiki)).toBe("index");
	});

	it("falls back to 'README' when there is no 'index' child", function() {
		var wiki = setupWiki([
			{title: "knowledge/topics/cooking/README", text: "Readme"},
			{title: "knowledge/topics/cooking/Foo", text: ""}
		]);
		expect(pseudo.resolve("knowledge/topics/cooking", wiki)).toBe("README");
	});

	it("prefers 'index' over 'README' when both exist", function() {
		var wiki = setupWiki([
			{title: "knowledge/topics/x/index", text: ""},
			{title: "knowledge/topics/x/README", text: ""}
		]);
		expect(pseudo.resolve("knowledge/topics/x", wiki)).toBe("index");
	});

	it("returns null when neither index nor README exists", function() {
		var wiki = setupWiki([
			{title: "knowledge/topics/empty/Foo", text: ""}
		]);
		expect(pseudo.resolve("knowledge/topics/empty", wiki)).toBeNull();
	});

	it("returns null for an empty prefix", function() {
		var wiki = setupWiki([]);
		expect(pseudo.resolve("", wiki)).toBeNull();
	});

	it("is registered as a pseudo module so the resolver can use it", function() {
		var mods = $tw.modules.getModulesByTypeAsHashmap("rimir-ns-pseudo");
		var found = false;
		Object.keys(mods).forEach(function(key) {
			if(mods[key] && mods[key].name === "_index") { found = true; }
		});
		expect(found).toBe(true);
	});

	it("resolves end-to-end via the namespace resolver with pseudo-expansion enabled", function() {
		var wiki = setupWiki([
			{title: "knowledge/topics/python/index", text: "Index"},
			{title: "knowledge/topics/python/Notes", text: ""}
		]);
		resolver.resetPseudoRegistry();
		resolver.invalidatePseudoCache();
		// Pseudo expansion runs on the ref itself: a ref like
		// "knowledge/topics/python/_index" expands its `_index` segment
		// against the preceding path → "knowledge/topics/python/index".
		var r = resolver.resolve("knowledge/topics/python/_index", "knowledge/topics/python/Notes", wiki, {});
		expect(r.resolved).toBe("knowledge/topics/python/index");
	});
});
