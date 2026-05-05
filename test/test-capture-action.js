/*\
title: $:/plugins/rimir/knowledge-app/test/test-capture-action.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for the quick-capture action sequence: creating a note from
state-tiddler input, applying defaults, and navigating to the note.
This exercises the same actions the topbar's Create button fires.

\*/

"use strict";

describe("knowledge-app: quick capture", function() {

	function setupWiki(tiddlers) {
		var wiki = new $tw.Wiki();
		wiki.addTiddlers(tiddlers || []);
		wiki.addTiddler({title: "$:/config/rimir/knowledge-app/capture-prefix", text: "knowledge/inbox/"});
		wiki.addIndexersToWiki();
		return wiki;
	}

	// Render a button that fires the same action sequence as the modal's
	// Create button, then invoke it. Returns the saved title.
	function fireCapture(wiki) {
		var text = [
			'<$let',
			'  titleState="$:/state/rimir/knowledge-app/capture/title"',
			'  bodyState="$:/state/rimir/knowledge-app/capture/body"',
			'  typeState="$:/state/rimir/knowledge-app/capture/type"',
			'>',
			'<$let',
			'  rawTitle={{{ [<titleState>get[text]] }}}',
			'  rawBody={{{ [<bodyState>get[text]] }}}',
			'  rawType={{{ [<typeState>get[text]] ~[[idea]] }}}',
			'  prefix={{{ [[$:/config/rimir/knowledge-app/capture-prefix]get[text]] ~[[knowledge/inbox/]] }}}',
			'  finalTitle={{{ [<rawTitle>prefix[knowledge/]then<rawTitle>] ~[<rawTitle>addprefix<prefix>] }}}',
			'>',
			'<$button>',
			'<$action-createtiddler $basetitle=<<finalTitle>> $savetitle="$:/state/rimir/knowledge-app/capture/last-saved" text=<<rawBody>> tags="$:/tags/rimir/knowledge-app/note" kn.tier="fleeting" kn.type=<<rawType>> context="knowledge"/>',
			'click',
			'</$button>',
			'</$let>',
			'</$let>'
		].join("\n");
		var parser = wiki.parseText("text/vnd.tiddlywiki", text, { parseAsInline: false });
		var widgetNode = wiki.makeWidget(parser, { document: $tw.fakeDocument });
		var container = $tw.fakeDocument.createElement("div");
		widgetNode.render(container, null);
		var btn = findWidget(widgetNode, "button");
		if(btn) btn.invokeActions(btn, {});
		var saved = wiki.getTiddler("$:/state/rimir/knowledge-app/capture/last-saved");
		return saved ? saved.fields.text : null;
	}

	function findWidget(widget, typeName) {
		if(widget.parseTreeNode && widget.parseTreeNode.type === typeName) return widget;
		if(widget.children) {
			for(var i = 0; i < widget.children.length; i++) {
				var f = findWidget(widget.children[i], typeName);
				if(f) return f;
			}
		}
		return null;
	}

	it("creates a note under the capture prefix from a bare title", function() {
		var wiki = setupWiki([]);
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/title", text: "Hello world"});
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/body", text: "first body"});
		var savedTitle = fireCapture(wiki);
		expect(savedTitle).toBe("knowledge/inbox/Hello world");
		var t = wiki.getTiddler(savedTitle);
		expect(t).not.toBeUndefined();
		expect(t.fields.tags).toContain("$:/tags/rimir/knowledge-app/note");
		expect(t.fields["kn.tier"]).toBe("fleeting");
		expect(t.fields["kn.type"]).toBe("idea");
	});

	it("respects a user-picked card type", function() {
		var wiki = setupWiki([]);
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/title", text: "Refactoring"});
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/body", text: ""});
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/type", text: "source"});
		var savedTitle = fireCapture(wiki);
		expect(wiki.getTiddler(savedTitle).fields["kn.type"]).toBe("source");
	});

	it("respects a user-typed title that already starts with knowledge/", function() {
		var wiki = setupWiki([]);
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/title", text: "knowledge/topics/foo/Bar"});
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/body", text: ""});
		var savedTitle = fireCapture(wiki);
		expect(savedTitle).toBe("knowledge/topics/foo/Bar");
	});

	it("auto-suffixes on title collision", function() {
		var wiki = setupWiki([{title: "knowledge/inbox/Foo", text: "existing"}]);
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/title", text: "Foo"});
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/body", text: ""});
		var savedTitle = fireCapture(wiki);
		expect(savedTitle).not.toBe("knowledge/inbox/Foo");
		expect(savedTitle.indexOf("knowledge/inbox/Foo")).toBe(0);
	});

	it("body is the raw user content (no \\context pragma) and the context lives in the field", function() {
		var wiki = setupWiki([]);
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/title", text: "Bar"});
		wiki.addTiddler({title: "$:/state/rimir/knowledge-app/capture/body", text: "user content"});
		var savedTitle = fireCapture(wiki);
		var t = wiki.getTiddler(savedTitle);
		expect(t.fields.text).toBe("user content");
		expect(t.fields.text.indexOf("\\context")).toBe(-1);
		expect(t.fields.context).toBe("knowledge");
	});
});
