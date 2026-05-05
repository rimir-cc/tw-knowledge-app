/*\
title: $:/plugins/rimir/knowledge-app/test/test-types.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the TZK card-type system: config tiddler, helpers, capture default.

\*/

"use strict";

describe("knowledge-app: types", function() {

	var HELPERS = "$:/plugins/rimir/knowledge-app/filters/helpers";
	var TYPES_CONFIG = "$:/config/rimir/knowledge-app/types";

	function setupWiki(tiddlers) {
		var wiki = new $tw.Wiki();
		var helpers = $tw.wiki.getTiddler(HELPERS);
		if(helpers) { wiki.addTiddler(helpers); }
		var typesCfg = $tw.wiki.getTiddler(TYPES_CONFIG);
		if(typesCfg) { wiki.addTiddler(typesCfg); }
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

	it("ships a JSON config of card types with the expected ids", function() {
		var wiki = setupWiki([]);
		var ids = runFilter(wiki, "[function[knowledge.types]] +[sort[]]");
		expect(ids).toContain("idea");
		expect(ids).toContain("source");
		expect(ids).toContain("sink");
		expect(ids).toContain("conversation");
		expect(ids).toContain("note");
		expect(ids).toContain("pao");
		expect(ids).toContain("place");
		expect(ids).toContain("index");
		expect(ids).toContain("bibliography");
		expect(ids).toContain("class");
		expect(ids).toContain("publication");
		expect(ids).toContain("tool");
		expect(ids).toContain("meta");
		expect(ids).toContain("attachment");
		expect(ids).toContain("image");
		expect(ids.length).toBe(15);
	});

	it("knowledge.type-caption resolves caption from JSON or falls back to the id", function() {
		var wiki = setupWiki([]);
		expect(runFilter(wiki, "[function[knowledge.type-caption],[idea]]")).toEqual(["Idea"]);
		expect(runFilter(wiki, "[function[knowledge.type-caption],[source]]")).toEqual(["Source"]);
		expect(runFilter(wiki, "[function[knowledge.type-caption],[bibliography]]")).toEqual(["Bibliography"]);
		expect(runFilter(wiki, "[function[knowledge.type-caption],[unknown-x]]")).toEqual(["unknown-x"]);
	});

	it("knowledge.type-icon resolves the emoji or falls back to a generic tag", function() {
		var wiki = setupWiki([]);
		var ideaIcon = runFilter(wiki, "[function[knowledge.type-icon],[idea]]");
		expect(ideaIcon[0]).toBe("💡");
		var unknownIcon = runFilter(wiki, "[function[knowledge.type-icon],[xyz]]");
		expect(unknownIcon[0]).toBe("🏷");
	});

	it("knowledge.type-group resolves the group label", function() {
		var wiki = setupWiki([]);
		expect(runFilter(wiki, "[function[knowledge.type-group],[idea]]")).toEqual(["core"]);
		expect(runFilter(wiki, "[function[knowledge.type-group],[pao]]")).toEqual(["entity"]);
		expect(runFilter(wiki, "[function[knowledge.type-group],[bibliography]]")).toEqual(["structural"]);
	});
});
