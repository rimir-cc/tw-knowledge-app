/*\
title: $:/plugins/rimir/knowledge-app/test/test-areas.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the area registry / discovery / metadata helpers.

\*/

"use strict";

describe("knowledge-app: areas", function() {

	var HELPERS = "$:/plugins/rimir/knowledge-app/filters/helpers";

	function setupWiki(tiddlers) {
		var wiki = new $tw.Wiki();
		// Pull in the helpers + every shipped area so \import + filter
		// helpers resolve.
		var helpers = $tw.wiki.getTiddler(HELPERS);
		if(helpers) { wiki.addTiddler(helpers); }
		var areaTitles = $tw.wiki.filterTiddlers(
			"[all[shadows+tiddlers]tag[$:/tags/rimir/knowledge-app/area]]"
		);
		areaTitles.forEach(function(title) {
			var t = $tw.wiki.getTiddler(title);
			if(t) { wiki.addTiddler(t); }
		});
		wiki.addTiddlers(tiddlers || []);
		wiki.addIndexersToWiki();
		return wiki;
	}

	function runFilter(wiki, filterExpr) {
		var text = '\\import ' + HELPERS + '\n<$list filter="' + filterExpr + '" variable="t"><$text text=<<t>>/>|</$list>';
		var parser = wiki.parseText("text/vnd.tiddlywiki", text, { parseAsInline: false });
		var widgetNode = wiki.makeWidget(parser, { document: $tw.fakeDocument });
		var container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container, null);
		var rendered = container.textContent || "";
		return rendered.split("|").filter(function(s) { return s.length > 0; });
	}

	it("ships the 4 starter areas as registered tiddlers", function() {
		var wiki = setupWiki([]);
		var registered = runFilter(wiki, "[function[knowledge.areas-registered]] +[sort[]]");
		expect(registered).toContain("llm");
		expect(registered).toContain("it-security");
		expect(registered).toContain("health");
		expect(registered).toContain("gaming");
	});

	it("derives areas from existing notes' first segment", function() {
		var wiki = setupWiki([
			{ title: "knowledge/custom/Foo", tags: "$:/tags/rimir/knowledge-app/note" }
		]);
		var derived = runFilter(wiki, "[function[knowledge.areas-derived]]");
		expect(derived).toContain("custom");
	});

	it("knowledge.areas() unions registered + derived (deduped, sorted)", function() {
		var wiki = setupWiki([
			{ title: "knowledge/llm/X", tags: "$:/tags/rimir/knowledge-app/note" },
			{ title: "knowledge/custom/Y", tags: "$:/tags/rimir/knowledge-app/note" }
		]);
		var all = runFilter(wiki, "[function[knowledge.areas]]");
		expect(all).toContain("llm");
		expect(all).toContain("custom");
		// llm should appear once even though both registered AND derived.
		expect(all.filter(function(a) { return a === "llm"; }).length).toBe(1);
	});

	it("knowledge.area-caption falls back to area-id when no metadata exists", function() {
		var wiki = setupWiki([]);
		var captionRegistered = runFilter(wiki, "[function[knowledge.area-caption],[llm]]");
		expect(captionRegistered).toEqual(["LLM"]);
		var captionUnknown = runFilter(wiki, "[function[knowledge.area-caption],[custom-thing]]");
		expect(captionUnknown).toEqual(["custom-thing"]);
	});

	it("knowledge.area-icon returns the registered emoji or a default folder", function() {
		var wiki = setupWiki([]);
		var iconLlm = runFilter(wiki, "[function[knowledge.area-icon],[llm]]");
		expect(iconLlm[0]).toBe("🤖");
		var iconUnknown = runFilter(wiki, "[function[knowledge.area-icon],[unknown]]");
		expect(iconUnknown[0]).toBe("📂");
	});
});
