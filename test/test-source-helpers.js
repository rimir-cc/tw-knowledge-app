/*\
title: $:/plugins/rimir/knowledge-app/test/test-source-helpers.js
type: application/javascript
tags: [[$:/tags/test-spec]]

Tests for forms/source-helpers — the YouTube URL → video-ID extraction
and medium/consume-status icon mapping.

\*/

"use strict";

describe("knowledge-app: source helpers", function() {

	var HELPERS = "$:/plugins/rimir/knowledge-app/forms/source-helpers";

	function setupWiki() {
		var wiki = new $tw.Wiki();
		var t = $tw.wiki.getTiddler(HELPERS);
		if(t) { wiki.addTiddler(t); }
		wiki.addIndexersToWiki();
		return wiki;
	}

	function callFn(wiki, fnName, arg) {
		var text = '\\import ' + HELPERS + '\n<$text text={{{ [function[' + fnName + '],<arg>] }}}/>';
		var widget = wiki.makeWidget(
			wiki.parseText("text/vnd.tiddlywiki", text, { parseAsInline: false }),
			{ document: $tw.fakeDocument, variables: { arg: arg } });
		var container = $tw.fakeDocument.createElement("div");
		widget.render(container, null);
		return container.textContent || "";
	}

	describe("knowledge.yt-id", function() {

		it("extracts ID from a watch?v= URL", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.yt-id", "https://www.youtube.com/watch?v=1g66s7UbyuU"))
				.toBe("1g66s7UbyuU");
		});

		it("extracts ID from a watch?v= URL with extra params", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.yt-id", "https://www.youtube.com/watch?v=1g66s7UbyuU&t=42s&list=PLfoo"))
				.toBe("1g66s7UbyuU");
		});

		it("extracts ID from a youtu.be short URL", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.yt-id", "https://youtu.be/1g66s7UbyuU"))
				.toBe("1g66s7UbyuU");
		});

		it("extracts ID from a youtu.be URL with timestamp", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.yt-id", "https://youtu.be/1g66s7UbyuU?t=42"))
				.toBe("1g66s7UbyuU");
		});

		it("extracts ID from an /embed/ URL", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.yt-id", "https://www.youtube.com/embed/1g66s7UbyuU"))
				.toBe("1g66s7UbyuU");
		});

		it("returns empty for non-YouTube URLs", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.yt-id", "https://example.com/article")).toBe("");
		});

		it("returns empty for blank input", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.yt-id", "")).toBe("");
		});

	});

	describe("knowledge.medium-icon", function() {

		it("maps each known medium to its emoji", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.medium-icon", "article")).toBe("📰");
			expect(callFn(wiki, "knowledge.medium-icon", "book")).toBe("📕");
			expect(callFn(wiki, "knowledge.medium-icon", "youtube")).toBe("📺");
			expect(callFn(wiki, "knowledge.medium-icon", "podcast")).toBe("🎙");
			expect(callFn(wiki, "knowledge.medium-icon", "blog")).toBe("✍");
		});

		it("falls back to a generic link icon for unknown media", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.medium-icon", "unknown-x")).toBe("🔗");
			expect(callFn(wiki, "knowledge.medium-icon", "")).toBe("🔗");
		});

	});

	describe("knowledge.consume-icon", function() {

		it("maps each known status to its emoji", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.consume-icon", "created")).toBe("✏");
			expect(callFn(wiki, "knowledge.consume-icon", "partial")).toBe("⏳");
			expect(callFn(wiki, "knowledge.consume-icon", "consumed")).toBe("✅");
			expect(callFn(wiki, "knowledge.consume-icon", "reconsumed")).toBe("🔁");
		});

		it("falls back to a bullet for unknown statuses", function() {
			var wiki = setupWiki();
			expect(callFn(wiki, "knowledge.consume-icon", "anything-else")).toBe("•");
		});

	});

});
