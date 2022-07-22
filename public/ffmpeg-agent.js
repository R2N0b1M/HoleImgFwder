const ffmpeg = (() => {
  let worker;
  let resolve, reject, running = false;
  let stdout_cb = null, stderr_cb = null;
  return {
    load: async () => {
      if (running) throw new Error("Atmost one command can be executed at a time.");
      running = true;
      try {
        worker = new Worker('./worker-ffmpeg-st.js');
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
        const resp = await new Promise((res, rej) => {
          resolve = res;
          reject = rej;
          worker.postMessage({
            type: "load",
            url: "/ffmpeg.min.js",
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
    FS: async (method, filename, data) => {
      if (running) throw new Error("Atmost one command can be executed at a time.");
      running = true;
      try {
        if (method === "writeFile") {
          const resp = await new Promise((res, rej) => {
            resolve = res;
            reject = rej;
            worker.postMessage({
              type: "writeFile",
              filename,
              data,
            });
          });
          return resp;
        } else if (method === "readFile") {
          const resp = await new Promise((res, rej) => {
            resolve = res;
            reject = rej;
            worker.postMessage({
              type: "readFile",
              filename,
            });
          });
          return resp;
        }
      } catch (e) {
        throw e;
      } finally {
        running = false;
      }
    },
    exit: async () => {
      if (running) throw new Error("Atmost one command can be executed at a time.");
      running = true;
      try {
        const resp = await new Promise((res, rej) => {
          try {
            worker.terminate();
            res();
          } catch (e) {
            console.error(e);
            rej(e);
          }
        });
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

export { ffmpeg };