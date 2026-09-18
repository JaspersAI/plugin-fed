# Federal Reserve for Jaspers Terminal

The constant maturity Treasury yield curve, daily, from the Fed's own H.15 release. No key.

Sources: `fed/yields`.

## Install

In Jaspers Terminal: **Settings > Plugins > Add a plugin**, and paste this repository's link. Or
clone this folder into `~/Jaspers/plugins/fed` and the app builds it on the next save.

## What it needs

No key and no account. The data is public and this asks for it directly, saying who it is in its
`User-Agent`.

## Working on it

```sh
npm install
npm run typecheck
npm test
```

MIT.
