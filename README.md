# tw-knowledge-app

A TiddlyWiki plugin: zettelkasten-style knowledge app powered by [`rimir/namespace`](https://github.com/rimir-cc/tw-namespace) and [`rimir/appify`](https://github.com/rimir-cc/tw-appify).

## What it does

Notes live under the `knowledge/…` title namespace. They link with short refs (`[[Foo]]`) — the namespace plugin walks up the source path, plus aliases / mounts / pseudos. This plugin adds the app surface:

- **Quick-capture** — title + body modal in the topbar.
- **Three-tier status** — fleeting → developing → evergreen.
- **Backlinks panel** in the Note view (reads namespace's reverse index).
- **Write tab** — orphans, stubs, dead-ends, broken refs.
- **Search** over knowledge notes.
- **Starter mount `kn`** so any tiddler can write `[[kn/topics/foo]]`.
- **Custom pseudo `_index`** so `[[_index]]` resolves to a topic's index/README.

## Prerequisites

- `rimir/appify`
- `rimir/namespace`
- `rimir/theme`
- `rimir/doc-template` (soft — for the documentation tab)

## Install

Add `rimir/knowledge-app` to your wiki's `tiddlywiki.info` `plugins` list and restart the server.

## License

MIT.
