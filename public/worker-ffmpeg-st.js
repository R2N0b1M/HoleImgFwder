let ffmpeg = null;

/* hack to make ffmpeg work in a web worker */
const document = {
  createElement: (tag) => {
    if (tag == "base") return {};
    if (tag == "script") {
      let obj = {};
      obj.addEventListener = (type, cb) => {
        importScripts(obj.src);
        cb();
      }
      obj.removeEventListener = () => {};
      return obj;
    }
  },
  getElementById: (id) => {
    return [{
      appendChild: () => {},
    }];
  }
};

onmessage = async (e) => {
  if (e.data.type === "load") {
    try {
      importScripts(e.data.url);
      const { createFFmpeg } = FFmpeg;
      ffmpeg = createFFmpeg({
        log: true,
        corePath: '/ffmpeg-core.js',
      });
      ffmpeg.setLogger(({type, message}) => {
        if (type === "info")
          postMessage({ type: "stdout", data: message });
        if (type === "ffout")
          postMessage({ type: "stdout", data: message });
        if (type === "fferr")
          postMessage({ type: "stderr", data: message });
      });
      await ffmpeg.load();
      postMessage({code: 0, type: "init", data: null});
    } catch (e) {
      postMessage({code: 1, type: "init", error: e});
    }
  } else if (e.data.type === "run") {
    try {
      let args = e.data.args;
      const ret = await ffmpeg.run(...args);
      postMessage({code: 0, type: "run", data: ret});
    } catch (e) {
      postMessage({code: 1, type: "run", error: e});
    }
  } else if (e.data.type === "writeFile") {
    try {
      const {filename, data} = e.data;
      await ffmpeg.FS("writeFile", filename, data);
      postMessage({code: 0, type: "writeFile", data: null});
    } catch (e) {
      postMessage({code: -1, type: "writeFile", error: e.message});
    }
  } else if (e.data.type === "readFile") {
    try {
      const {filename} = e.data;
      const data = await ffmpeg.FS("readFile", filename);
      postMessage({code: 0, type: "readFile", data});
    } catch (e) {
      postMessage({code: -1, type: "readFile", error: e.message});
    }
  } else if (e.data.type === "exit") {
    try {
      await ffmpeg.exit();
      postMessage({code: 0, type: "exit", data});
    } catch (e) {
      postMessage({code: -1, type: "exit", error: e.message});
    }
  }
}
