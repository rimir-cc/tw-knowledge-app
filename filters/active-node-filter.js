/*\
title: $:/plugins/rimir/knowledge-app/filters/active-node-filter.js
type: application/javascript
module-type: filteroperator

Filter operator backing the mindmap's chip-driven filter strip. Reads the
current tier and type chip selections from state tiddlers and narrows the
input set to tiddlers whose kn.tier / kn.type matches one of the selected
chips (multi-select OR within axis; AND across axes). An empty selection
on an axis means "no constraint" on that axis.

State tiddlers are TW title lists (space-separated; `[[multi word]]` for
values with spaces, though tier/type ids never contain spaces):
    $:/state/rimir/knowledge-app/filter/tiers
    $:/state/rimir/knowledge-app/filter/types

Usage in a producer's node-filter arg:
    [all[shadows+tiddlers]prefix[knowledge/]] +[kn-active-node-filter[]]

\*/

"use strict";

var STATE_TIERS = "$:/state/rimir/knowledge-app/filter/tiers";
var STATE_TYPES = "$:/state/rimir/knowledge-app/filter/types";

function parseList(wiki, title) {
    var text = wiki.getTiddlerText(title, "");
    if (!text) { return []; }
    return $tw.utils.parseStringArray(text) || [];
}

exports["kn-active-node-filter"] = function (source, operator, options) {
    var wiki = options.wiki;
    var tiers = parseList(wiki, STATE_TIERS);
    var types = parseList(wiki, STATE_TYPES);
    var noTiers = tiers.length === 0;
    var noTypes = types.length === 0;
    var results = [];
    source(function (tiddler, title) {
        if (!tiddler) { return; }
        if (!noTiers) {
            var tier = tiddler.fields["kn.tier"] || "";
            if (tiers.indexOf(tier) === -1) { return; }
        }
        if (!noTypes) {
            var type = tiddler.fields["kn.type"] || "";
            if (types.indexOf(type) === -1) { return; }
        }
        results.push(title);
    });
    return results;
};
