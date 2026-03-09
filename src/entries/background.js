const runtimeApi = globalThis.browser || globalThis.chrome;
const downloadsApi = runtimeApi && runtimeApi.downloads;

function asPromise(maybePromise) {
  if (maybePromise && typeof maybePromise.then === 'function') {
    return maybePromise;
  }
  return Promise.resolve(maybePromise);
}

if (runtimeApi && downloadsApi && runtimeApi.runtime && runtimeApi.runtime.onMessage) {
  runtimeApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== 'theol-download-relative-paths') return false;

    (async () => {
      const items = Array.isArray(message.items) ? message.items : [];

      for (const item of items) {
        await asPromise(
          downloadsApi.download({
            url: item.url,
            filename: item.filename,
            conflictAction: 'uniquify',
            saveAs: false
          })
        );
      }

      sendResponse({ ok: true, count: items.length });
    })().catch(error => {
      sendResponse({
        ok: false,
        error: error && error.message ? error.message : String(error)
      });
    });

    return true;
  });
}
