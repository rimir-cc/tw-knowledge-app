/*\
title: $:/plugins/rimir/knowledge-app/test/test-broken-refs.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the knowledge-has-broken-ref filter operator.

\*/

"use strict";

describe("knowledge-app: knowledge-has-broken-ref", function() {

	var flags = require("$:/plugins/rimir/namespace/featureflags.js");

	function setupWiki(tiddlers) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers(tiddlers || []);
		wiki.addTiddler({title: "$:/config/rimir/namespace/walk-up", text: "yes"});
		wiki.addTiddler({title: "$:/config/rimir/namespace/aliases", text: "yes"});
		wiki.addTiddler({title: "$:/config/rimir/namespace/pseudo-expansion", text: "yes"});
		wiki.addIndexersToWiki();
		return wiki;
	}

	beforeEach(function() { flags.invalidate(); });

	function run(wiki, filter) {
		return wiki.filterTiddlers(filter);
	}

	it("flags a note whose body contains an unresolved [[ref]]", function() {
		var wiki = setupWiki([
			{title: "knowledge/notes/A", text: "\\context knowledge\n\nLink: [[Missing]]", tags: "$:/tags/rimir/knowledge-app/note"}
		]);
		expect(run(wiki, "[[knowledge/notes/A]knowledge-has-broken-ref[]]"))
			.toEqual(["knowledge/notes/A"]);
	});

	it("does not flag notes whose refs all resolve", function() {
		var wiki = setupWiki([
			{title: "knowledge/notes/A", text: "\\context knowledge\n\nSee [[B]]", tags: "$:/tags/rimir/knowledge-app/note"},
			{title: "knowledge/notes/B", text: "", tags: "$:/tags/rimir/knowledge-app/note"}
		]);
		expect(run(wiki, "[[knowledge/notes/A]knowledge-has-broken-ref[]]"))
			.toEqual([]);
	});

	it("does not flag notes with no refs at all", function() {
		var wiki = setupWiki([
			{title: "knowledge/notes/A", text: "Plain text, no refs.", tags: "$:/tags/rimir/knowledge-app/note"}
		]);
		expect(run(wiki, "[[knowledge/notes/A]knowledge-has-broken-ref[]]"))
			.toEqual([]);
	});

	it("handles [[text|target]] form by resolving the target", function() {
		var wiki = setupWiki([
			{title: "knowledge/notes/A", text: "\\context knowledge\n\n[[click here|Existing]]", tags: "$:/tags/rimir/knowledge-app/note"},
			{title: "knowledge/notes/Existing", text: "", tags: "$:/tags/rimir/knowledge-app/note"}
		]);
		expect(run(wiki, "[[knowledge/notes/A]knowledge-has-broken-ref[]]"))
			.toEqual([]);
	});

	it("flags [[label|missing]] when the target is missing", function() {
		var wiki = setupWiki([
			{title: "knowledge/notes/A", text: "\\context knowledge\n\n[[click|Gone]]", tags: "$:/tags/rimir/knowledge-app/note"}
		]);
		expect(run(wiki, "[[knowledge/notes/A]knowledge-has-broken-ref[]]"))
			.toEqual(["knowledge/notes/A"]);
	});

	it("returns nothing for a non-existent input title", function() {
		var wiki = setupWiki([]);
		expect(run(wiki, "[[knowledge/notes/Ghost]knowledge-has-broken-ref[]]"))
			.toEqual([]);
	});
});
