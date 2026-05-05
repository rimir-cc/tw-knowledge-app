/*\
title: $:/plugins/rimir/knowledge-app/test/test-helpers.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the knowledge.* filter helpers (\function definitions in
filters/helpers.tid). They drive the Write-tab maintenance views.

\*/

"use strict";

describe("knowledge-app: filter helpers", function() {

	var HELPERS = "$:/plugins/rimir/knowledge-app/filters/helpers";
	var indexer = require("$:/plugins/rimir/namespace/indexer.js");
	var flags = require("$:/plugins/rimir/namespace/featureflags.js");

	function setupWiki(tiddlers) {
		var wiki = new $tw.Wiki();
		var helpers = $tw.wiki.getTiddler(HELPERS);
		if(helpers) { wiki.addTiddler(helpers); }
		wiki.addTiddlers(tiddlers || []);
		wiki.addTiddler({title: "$:/config/rimir/namespace/walk-up", text: "yes"});
		wiki.addTiddler({title: "$:/config/rimir/namespace/aliases", text: "yes"});
		wiki.addTiddler({title: "$:/config/rimir/namespace/pseudo-expansion", text: "yes"});
		wiki.addIndexersToWiki();
		indexer.rebuildAll(wiki);
		return wiki;
	}

	beforeEach(function() {
		flags.invalidate();
		indexer.reset();
	});

	// Render a filter via wikitext so the \function helpers in HELPERS are
	// in scope. Returns the resulting list as an array of titles.
	function runFilter(wiki, filterExpr) {
		var text = '\\import ' + HELPERS + '\n<$list filter="' + filterExpr + '" variable="t"><$text text=<<t>>/>|</$list>';
		var parser = wiki.parseText("text/vnd.tiddlywiki", text, { parseAsInline: false });
		var widgetNode = wiki.makeWidget(parser, { document: $tw.fakeDocument });
		var container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container, null);
		var rendered = container.textContent || "";
		return rendered.split("|").filter(function(s) { return s.length > 0; });
	}

	function makeNote(title, text, tier) {
		return {
			title: title,
			text: text || "",
			tags: "$:/tags/rimir/knowledge-app/note",
			"kn.tier": tier || "fleeting"
		};
	}

	describe("knowledge.notes", function() {
		it("returns all tiddlers tagged as knowledge notes", function() {
			var wiki = setupWiki([
				makeNote("knowledge/A", "", "fleeting"),
				makeNote("knowledge/B", "", "developing"),
				{ title: "not-a-note", text: "" }
			]);
			var result = runFilter(wiki, "[function[knowledge.notes]] +[sort[]]");
			expect(result).toEqual(["knowledge/A", "knowledge/B"]);
		});
	});

	describe("knowledge.orphans", function() {
		it("returns notes with zero backlinks", function() {
			var wiki = setupWiki([
				makeNote("knowledge/A", "[[knowledge/B]]", "developing"),
				makeNote("knowledge/B", "", "developing"),
				makeNote("knowledge/C", "", "developing")
			]);
			var result = runFilter(wiki, "[function[knowledge.orphans]] +[sort[]]");
			expect(result).toContain("knowledge/A");
			expect(result).toContain("knowledge/C");
			expect(result).not.toContain("knowledge/B");
		});
	});

	describe("knowledge.dead-ends", function() {
		it("returns notes with zero forward links", function() {
			var wiki = setupWiki([
				makeNote("knowledge/A", "[[knowledge/B]]", "developing"),
				makeNote("knowledge/B", "", "developing")
			]);
			var result = runFilter(wiki, "[function[knowledge.dead-ends]] +[sort[]]");
			expect(result).toEqual(["knowledge/B"]);
		});
	});

	describe("knowledge.stubs", function() {
		it("returns notes whose body is shorter than the stub threshold", function() {
			var wiki = setupWiki([
				makeNote("knowledge/short", "tiny", "fleeting"),
				makeNote("knowledge/long",
					new Array(250).join("x"), "fleeting")
			]);
			wiki.addTiddler({title: "$:/config/rimir/knowledge-app/stub-threshold", text: "200"});
			var result = runFilter(wiki, "[function[knowledge.stubs]] +[sort[]]");
			expect(result).toEqual(["knowledge/short"]);
		});

		it("respects an updated stub threshold", function() {
			var wiki = setupWiki([
				makeNote("knowledge/medium", new Array(50).join("x"), "fleeting")
			]);
			wiki.addTiddler({title: "$:/config/rimir/knowledge-app/stub-threshold", text: "10"});
			var result = runFilter(wiki, "[function[knowledge.stubs]]");
			expect(result).toEqual([]);
		});
	});

	describe("knowledge.broken", function() {
		it("returns notes with at least one unresolved [[ref]]", function() {
			var wiki = setupWiki([
				makeNote("knowledge/A", "\\context knowledge\n\n[[Missing]]", "developing"),
				makeNote("knowledge/B", "all good here", "developing")
			]);
			var result = runFilter(wiki, "[function[knowledge.broken]] +[sort[]]");
			expect(result).toEqual(["knowledge/A"]);
		});
	});
});
