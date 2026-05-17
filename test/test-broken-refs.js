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

	it("uses the source tiddler's context field when no \\context pragma is present", function() {
		// A note can declare its namespace context via the `context` field
		// (without an explicit \context pragma in the body). The broken-refs
		// detector must honour that field for resolution to match render-time.
		var wiki = setupWiki([
			{title: "knowledge/topics/python/intro",
			 text: "See [[advanced]] and [[other]].",
			 context: "knowledge/topics/python",
			 tags: "$:/tags/rimir/knowledge-app/note"},
			{title: "knowledge/topics/python/advanced", text: ""}
			// "other" intentionally missing — should mark the note as broken
		]);
		wiki.addTiddler({title: "$:/config/rimir/namespace/implicit-context", text: "yes"});
		flags.invalidate();
		expect(run(wiki, "[[knowledge/topics/python/intro]knowledge-has-broken-ref[]]"))
			.toEqual(["knowledge/topics/python/intro"]);
	});

	it("does not flag a note whose refs resolve via the context field", function() {
		// Mirror of the previous case: when context-field resolution succeeds
		// for every ref, the note must NOT be flagged.
		var wiki = setupWiki([
			{title: "knowledge/topics/python/intro",
			 text: "See [[advanced]].",
			 context: "knowledge/topics/python",
			 tags: "$:/tags/rimir/knowledge-app/note"},
			{title: "knowledge/topics/python/advanced", text: ""}
		]);
		wiki.addTiddler({title: "$:/config/rimir/namespace/implicit-context", text: "yes"});
		flags.invalidate();
		expect(run(wiki, "[[knowledge/topics/python/intro]knowledge-has-broken-ref[]]"))
			.toEqual([]);
	});
});
