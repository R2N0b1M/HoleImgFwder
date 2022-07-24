const apngopt = (() => {
  const worker = new Worker('/apngopt/worker-apngopt.js');
  let resolve, reject, running = false;
  let stdout_cb = null, stderr_cb = null;
  worker.onmessage = (e) => {
    const data = e.data;
    if (data.type == "stdout") {
      stdout_cb && stdout_cb(data.data);
      return;
    }
    if (data.type == "stderr") {
      stderr_cb && stderr_cb(data.data);
      return;
    }
    if (data.code === 0) resolve(data.data);
    else reject(data.error);
  }
  return {
    init: async () => {
      if (running) throw new Error("Atmost one command can be executed at a time.");
      running = true;
      try {
        const resp = await new Promise((res, rej) => {
          resolve = res;
          reject = rej;
          worker.postMessage({
            type: "init",
            url: "/apngopt/apngopt.js",
          });
        });
        return resp;
      } catch (e) {
        throw e;
      } finally {
        running = false;
      }
    },
    run: async (...args) => {
      if (running) throw new Error("Atmost one command can be executed at a time.");
      running = true;
      try {
        const resp = await new Promise((res, rej) => {
          resolve = res;
          reject = rej;
          worker.postMessage({
            type: "run",
            args: args,
          });
        });
      } catch (e) {
        throw e;
      } finally {
        running = false;
      }
    },
    writeFile: async (filename, data) => {
      if (running) throw new Error("Atmost one command can be executed at a time.");
      running = true;
      try {
        const resp = await new Promise((res, rej) => {
          resolve = res;
          reject = rej;
          worker.postMessage({
            type: "writeFile",
            filename: filename,
            data: data,
          });
        });
      } catch (e) {
        throw e;
      } finally {
        running = false;
      }
    },
    readFile: async (filename) => {
      if (running) throw new Error("Atmost one command can be executed at a time.");
      running = true;
      try {
        const resp = await new Promise((res, rej) => {
          resolve = res;
          reject = rej;
          worker.postMessage({
            type: "readFile",
            filename: filename,
          });
        });
        return resp;
      } catch (e) {
        throw e;
      } finally {
        running = false;
      }
    },
    onStdout: (cb) => {
      stdout_cb = cb;
    },
    onStderr: (cb) => {
      stderr_cb = cb;
    }
  }
})();