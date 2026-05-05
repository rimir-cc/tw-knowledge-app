/*\
title: $:/plugins/rimir/knowledge-app/pseudo/_index.js
type: application/javascript
module-type: rimir-ns-pseudo

Pseudo-segment `_index` — resolves to the canonical entry-point of the
preceding prefix. Tries an `index` child first, then `README`. Returns
null if neither exists.

Use case: in any knowledge note, write `[[_index]]` and the namespace
walk-up + pseudo expansion will resolve it to the topic's index page.
E.g. from `knowledge/topics/programming/typescript/Foo` the ref
`[[_index]]` resolves to `knowledge/topics/programming/typescript/index`
(if it exists), else `…/typescript/README`, else `…/programming/index`,
and so on up the path.

\*/

"use strict";

var util = require("$:/plugins/rimir/namespace/resolver.js");

exports.name = "_index";

var CANDIDATES = ["index", "README"];

exports.resolve = function(prefix, wiki) {
	if(!prefix) { return null; }
	var children = util.listImmediateChildren(prefix, wiki);
	for(var i = 0; i < CANDIDATES.length; i++) {
		if(children.indexOf(CANDIDATES[i]) !== -1) {
			return CANDIDATES[i];
		}
	}
	return null;
};
