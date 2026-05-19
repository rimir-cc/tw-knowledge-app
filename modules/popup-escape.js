/*\
title: $:/plugins/rimir/knowledge-app/modules/popup-escape.js
type: application/javascript
module-type: startup

Lift the kn-type-pill popup to `position: fixed` so it escapes appify-slot's
`overflow: auto` (and any other overflow:auto/hidden ancestors between the
mindmap preview pane and the document root). TW's `<$reveal type="popup">`
positions the popup with `position: absolute`, which gets clipped by any
ancestor with overflow:auto/hidden — and the appify-slot wrapping the
knowledge-app's mindmap view is exactly such an ancestor, so the popup's
bottom edge disappears below the slot's clip box.

The cleanest fix WITHIN TW's rules (no `!important`) is to set the popup
wrapper's inline `style.position` to "fixed" via JS — the user-feedback
memory permits inline-style overrides via JS where CSS can't win against
TW's inline `position: absolute`. With the pill's `popup` button using
`popupAbsCoords="yes"` the coords saved into the popup state tiddler are
page-absolute, which equals viewport-absolute when the SPA page itself
doesn't scroll (the appify shell pins the viewport).

Detection: a MutationObserver on document.body watches for `.kn-type-popup`
elements being added (the reveal renders its content only when triggered;
the wrapper `.tc-popup` already carries inline `position: absolute`). When
detected, walk up to find the `.tc-popup` ancestor and set its
`style.position = "fixed"`.

\*/

"use strict";

exports.name = "rimir-knowledge-app-popup-escape";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.synchronous = true;

// Any popup whose body element carries one of these classes gets its
// .tc-popup wrapper lifted to position:fixed. Keep the list short — every
// addedNode in the body subtree gets matched against each selector.
var ESCAPE_SELECTORS = ".kn-type-popup, .kn-fields-popup, .kn-escape-popup";

function isMatch(node) {
    if (!node || node.nodeType !== 1) { return null; }
    if (node.matches && node.matches(ESCAPE_SELECTORS)) { return node; }
    return node.querySelector ? node.querySelector(ESCAPE_SELECTORS) : null;
}

exports.startup = function () {
    if (!$tw.browser || typeof MutationObserver !== "function") { return; }
    var observer = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
                var inner = isMatch(added[j]);
                if (!inner) { continue; }
                var wrapper = inner.parentElement;
                while (wrapper && wrapper !== document.body) {
                    if (wrapper.classList && wrapper.classList.contains("tc-popup")) {
                        wrapper.style.position = "fixed";
                        break;
                    }
                    wrapper = wrapper.parentElement;
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
};
