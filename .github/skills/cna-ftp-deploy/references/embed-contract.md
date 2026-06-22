# CNA embed deployment contract

## Deployment boundary

- Publish a production artifact directory rather than the entire repository.
- Target `/missions/embed/<slug>` over Explicit FTPS on
  `webap.cna.com.tw:21`.
- Serve the result from
  `https://www.cna.com.tw/missions/embed/<slug>`.
- Keep all local asset references relative to the project directory.

## Required embed behavior

Each iframe entrypoint must:

- render correctly at mobile and desktop widths;
- avoid navigating or scrolling the parent page;
- send a project-specific height event after content size changes; and
- use a bounded, finite numeric height.

Example child message:

```js
window.parent.postMessage(
  { type: 'project-resize', height: Math.ceil(document.documentElement.scrollHeight) },
  'https://www.cna.com.tw'
);
```

The loader or host page must match both the message type and the sending iframe's
`contentWindow`. Validate `event.origin` when the iframe and host origins are
known.

## Required validation

Before upload:

1. Verify all declared entrypoints, the loader, and the test page exist.
2. Verify entrypoints emit the declared resize message.
3. Verify the loader listens for that message and matches `event.source`.
4. Verify referenced local assets exist and do not use root-relative paths.
5. Test representative widths such as 375 px and 900 px.
6. Verify service-worker cache cleanup is limited to the project cache prefix.

The generated GitHub Actions workflow enforces these checks as a smoke-test gate
before installing the FTP client or opening a production connection. A failed
smoke test must stop the job before upload.

After upload:

1. Fetch every declared public entrypoint over HTTPS.
2. Confirm JavaScript and assets return successful responses.
3. Check `X-Frame-Options` and CSP `frame-ancestors` do not block the intended
   CNA host page.
4. Load an iframe test page and confirm resizing and internal scrolling.

## Service-worker isolation

Cache Storage is shared by all service workers on the same origin. Do not delete
every cache except the current cache.

Unsafe:

```js
caches.keys().then(keys =>
  Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
);
```

Safe:

```js
const CACHE_PREFIX = 'project-slug-';
caches.keys().then(keys =>
  Promise.all(
    keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE)
      .map(key => caches.delete(key))
  )
);
```

Register the worker with the project directory as its maximum scope.

## Reference implementation

The `world_cup_2026` repository demonstrates:

- a dedicated `wc2026-v1.0-deploy` publish directory;
- `embed-loader.js` creating iframes and matching their source windows;
- project-specific `wc2026-resize` messages;
- `test-embed.html` exercising mobile and desktop widths; and
- `wc2026-embed-info.html` generating editor-facing embed snippets.

Its current service worker uses broad cache deletion; fix that pattern before
using it as a multi-project production template.
