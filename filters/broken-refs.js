/*\
title: $:/plugins/rimir/knowledge-app/filters/broken-refs.js
type: application/javascript
module-type: filteroperator

Filter operator: detect notes whose body contains at least one `[[…]]`
reference that the namespace resolver cannot resolve.

Usage:

  [<currentTiddler>knowledge-has-broken-ref[]]
    → input title if any `[[ref]]` in the body resolves to "unresolved",
      else nothing.

The resolver is called with the note's own title as the source so that
`\context` pragmas and walk-up rules apply exactly as they do at render
time. Refs of the form `[[text|target]]` are stripped to their target
before resolution. External links and image refs (`[img[…]]`) are
ignored — only plain `[[…]]` is considered.

\*/

"use strict";

var resolver = require("$:/plugins/rimir/namespace/resolver.js");

var REF_RE = /\[\[([^\]\|]+)(?:\|([^\]]+))?\]\]/g;

function getContextFromBody(text) {
	/* istanbul ignore if — callers gate on truthy text before invoking */
	if(!text) { return ""; }
	var m = text.match(/^\s*\\context\s+(\S+)/m);
	return m ? m[1] : "";
}

exports["knowledge-has-broken-ref"] = function(source, operator, options) {
	var wiki = options.wiki,
		results = [];
	source(function(tiddler, title) {
		if(!tiddler) { return; }
		var text = tiddler.fields.text || /* istanbul ignore next — every fixture sets text */ "";
		if(!text || text.indexOf("[[") === -1) { return; }
		var ctx = getContextFromBody(text);
		if(!ctx && tiddler.fields.context) { ctx = tiddler.fields.context; }
		var match,
			re = new RegExp(REF_RE.source, "g"),
			broken = false;
		while((match = re.exec(text)) !== null) {
			var ref = match[2] != null ? match[2] : match[1];
			/* istanbul ignore if — REF_RE always captures group(1); ref is never empty */
			if(!ref) { continue; }
			var r = resolver.resolve(ref, title, wiki, {context: ctx});
			if(r.status === "unresolved") {
				broken = true;
				break;
			}
		}
		if(broken) { results.push(title); }
	});
	return results;
};
