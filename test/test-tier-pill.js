/*\
title: $:/plugins/rimir/knowledge-app/test/test-tier-pill.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the kn-tier-pill procedure: renders a pill with the right
class and, in interactive mode, cycles fleeting → developing →
evergreen → fleeting on click.

\*/

"use strict";

describe("knowledge-app: tier pill", function() {

	var PILL = "$:/plugins/rimir/knowledge-app/procedures/tier-pill";

	function setupWiki(tiddlers) {
		var wiki = new $tw.Wiki();
		var pillTiddler = $tw.wiki.getTiddler(PILL);
		if(pillTiddler) { wiki.addTiddler(pillTiddler); }
		wiki.addTiddlers(tiddlers || []);
		wiki.addIndexersToWiki();
		return wiki;
	}

	function renderProc(wiki, args) {
		var text = '\\import ' + PILL + '\n<$transclude $variable="kn-tier-pill" ' + args + '/>';
		var parser = wiki.parseText("text/vnd.tiddlywiki", text, { parseAsInline: false });
		var widgetNode = wiki.makeWidget(parser, { document: $tw.fakeDocument });
		var container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container, null);
		return { container: container, widget: widgetNode };
	}

	function findFirstButton(widget) {
		if(widget.parseTreeNode && widget.parseTreeNode.type === "button") return widget;
		if(widget.children) {
			for(var i = 0; i < widget.children.length; i++) {
				var f = findFirstButton(widget.children[i]);
				if(f) return f;
			}
		}
		return null;
	}

	it("renders the right CSS class for each tier", function() {
		["fleeting", "developing", "evergreen"].forEach(function(tier) {
			var wiki = setupWiki([{title: "n", "kn.tier": tier, tags: "$:/tags/rimir/knowledge-app/note"}]);
			var html = renderProc(wiki, 'noteTitle="n" interactive="no"').container.outerHTML || "";
			expect(html).toContain("kn-tier-" + tier);
			expect(html.toLowerCase()).toContain(tier);
		});
	});

	it("defaults to fleeting when kn.tier is missing", function() {
		var wiki = setupWiki([{title: "n", tags: "$:/tags/rimir/knowledge-app/note"}]);
		var html = renderProc(wiki, 'noteTitle="n" interactive="no"').container.outerHTML || "";
		expect(html).toContain("kn-tier-fleeting");
	});

	it("cycles fleeting → developing on interactive click", function() {
		var wiki = setupWiki([{title: "n", "kn.tier": "fleeting", tags: "$:/tags/rimir/knowledge-app/note"}]);
		var rendered = renderProc(wiki, 'noteTitle="n" interactive="yes"');
		var button = findFirstButton(rendered.widget);
		expect(button).not.toBeNull();
		button.invokeActions(button, {});
		expect(wiki.getTiddler("n").fields["kn.tier"]).toBe("developing");
	});

	it("cycles developing → evergreen", function() {
		var wiki = setupWiki([{title: "n", "kn.tier": "developing", tags: "$:/tags/rimir/knowledge-app/note"}]);
		var rendered = renderProc(wiki, 'noteTitle="n" interactive="yes"');
		var button = findFirstButton(rendered.widget);
		button.invokeActions(button, {});
		expect(wiki.getTiddler("n").fields["kn.tier"]).toBe("evergreen");
	});

	it("cycles evergreen → fleeting (wrap)", function() {
		var wiki = setupWiki([{title: "n", "kn.tier": "evergreen", tags: "$:/tags/rimir/knowledge-app/note"}]);
		var rendered = renderProc(wiki, 'noteTitle="n" interactive="yes"');
		var button = findFirstButton(rendered.widget);
		button.invokeActions(button, {});
		expect(wiki.getTiddler("n").fields["kn.tier"]).toBe("fleeting");
	});

	it("renders no button when interactive is not 'yes'", function() {
		var wiki = setupWiki([{title: "n", "kn.tier": "fleeting"}]);
		var rendered = renderProc(wiki, 'noteTitle="n" interactive="no"');
		expect(findFirstButton(rendered.widget)).toBeNull();
	});
});
