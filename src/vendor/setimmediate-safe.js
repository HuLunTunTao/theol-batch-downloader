const scheduleTask = typeof queueMicrotask === 'function'
  ? queueMicrotask.bind(globalThis)
  : callback => Promise.resolve().then(callback);

let nextHandle = 1;
const tasks = new Map();

function runTask(handle) {
  const task = tasks.get(handle);
  if (!task) return;
  tasks.delete(handle);
  task.callback(...task.args);
}

function setImmediate(callback, ...args) {
  if (typeof callback !== 'function') {
    throw new TypeError('setImmediate only accepts function callbacks');
  }

  const handle = nextHandle++;
  tasks.set(handle, { callback, args });
  scheduleTask(() => runTask(handle));
  return handle;
}

function clearImmediate(handle) {
  tasks.delete(handle);
}

if (typeof globalThis.setImmediate !== 'function') {
  globalThis.setImmediate = setImmediate;
}

if (typeof globalThis.clearImmediate !== 'function') {
  globalThis.clearImmediate = clearImmediate;
}

export {
  clearImmediate,
  setImmediate
};
