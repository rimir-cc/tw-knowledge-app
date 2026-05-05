/*\
title: $:/plugins/rimir/knowledge-app/modules/focus-rewind.js
type: application/javascript
module-type: startup

Adds a `tm-focus-rewind` message that focuses an input matching a CSS
selector AND moves the caret to the start. Use after programmatically
setting a long value the user just picked from a suggestion list.

Why a custom message: TW's simple-engine setText skips the DOM update
when the input has focus (editor/engines/simple.js — to avoid stomping
on user typing). After clicking a suggestion, focus on the input may
or may not have moved depending on browser behaviour, so we may end
up with an updated wiki state but a stale DOM input.value. This handler
optionally re-reads the wiki state and forces the DOM value to match.

Trigger:

  <$action-sendmessage $message="tm-focus-rewind"
                       $param=".kn-title-input"
                       state=<<titleState>>/>

  $param        — CSS selector for the input element
  state         — optional tiddler whose `text` field is force-pushed
                  into the input's DOM value (bypassing edit-text's
                  focus-aware skip)

\*/

"use strict";

exports.name = "knowledge-app-focus-rewind";
exports.platforms = ["browser"];
exports.after = ["startup"];

exports.startup = function() {
	$tw.rootWidget.addEventListener("tm-focus-rewind", function(event) {
		var selector = event.param || "";
		if(!selector) { return; }
		var paramObject = event.paramObject || {};
		var stateTitle = paramObject.state || "";
		var baseElement = (event.event && event.event.target && event.event.target.ownerDocument) || document;
		// Defer to the next animation frame so any pending TW refresh
		// (e.g. the action-setfield that just changed the input's bound
		// state) has propagated to the DOM before we focus + rewind.
		var doFocus = function() {
			var el = $tw.utils.querySelectorSafe(selector, baseElement);
			if(!el) { return; }
			// Force-sync the DOM value with the wiki state. simple-engine
			// skips updateDomNodeText when the input has focus; this
			// brings the DOM in line regardless.
			if(stateTitle) {
				var t = $tw.wiki.getTiddler(stateTitle);
				var desired = (t && t.fields && t.fields.text) || "";
				if(el.value !== desired) { el.value = desired; }
			}
			if(typeof el.focus === "function") { el.focus(); }
			if(typeof el.setSelectionRange === "function") {
				try { el.setSelectionRange(0, 0); } catch(e) { /* readonly inputs */ }
			}
			if("scrollLeft" in el) { el.scrollLeft = 0; }
		};
		if(typeof requestAnimationFrame === "function") {
			requestAnimationFrame(doFocus);
		} else {
			setTimeout(doFocus, 0);
		}
	});
};
