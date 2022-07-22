let apngopt = null;

const getArgs = async (apngopt, args) => {
  const argv = apngopt._malloc(args.length * 4);
  for (let i = 0; i < args.length; i++) {
    const arg = apngopt._malloc(args[i].length + 1);
    apngopt.writeAsciiToMemory(args[i], arg);
    apngopt.setValue(arg + args[i].length, 0, "i8");
    apngopt.setValue(argv + i * 4, arg, "i32");
  }
  return [args.length, argv];
}

onmessage = async (e) => {
  if (e.data.type === "init") {
    try {
      importScripts(e.data.url);
      apngopt = await createAPNGOpt({
        print: (msg) => postMessage({ type: "stdout", data: msg }),
        printErr: (msg) => postMessage({ type: "stderr", data: msg }),
      });
      postMessage({code: 0, type: "init", data: null});
    } catch (e) {
      postMessage({code: 1, type: "init", error: e});
    }
  } else if (e.data.type === "run") {
    try {
      let args = e.data.args;
      args.unshift("apngopt");
      const [argc, argv] = await getArgs(apngopt, args);
      const main = apngopt.cwrap("callMain", "number", ["number", "number"]);
      const ret = main(argc, argv);
      postMessage({code: 0, type: "run", data: ret});
    } catch (e) {
      postMessage({code: 1, type: "run", error: e});
    }
  } else if (e.data.type === "writeFile") {
    try {
      const {filename, data} = e.data;
      await apngopt.FS.writeFile(filename, data);
      postMessage({code: 0, type: "writeFile", data: null});
    } catch (e) {
      postMessage({code: -1, type: "writeFile", error: e.message});
    }
  } else if (e.data.type === "readFile") {
    try {
      const {filename} = e.data;
      const data = await apngopt.FS.readFile(filename);
      postMessage({code: 0, type: "readFile", data});
    } catch (e) {
      postMessage({code: -1, type: "readFile", error: e.message});
    }
  }
}
