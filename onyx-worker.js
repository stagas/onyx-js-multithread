function stringDecode(memory, ptr, len) {
  const buffer = new Uint8Array(memory.buffer, ptr, len);
  let s = "";
  for (const char of buffer) {
    s += String.fromCharCode(char);
  }
  return s;
}

export function createImports(memory) {
  const imports = {};
  imports.onyx = { memory };
  imports.host = createHost(memory);
  return imports;
}

export function createHost(memory) {
  const threads = {};
  return {
    print_str(ptr, len) {
      console.log(stringDecode(memory, ptr, len));
    },
    time() {
      return performance.now();
    },
    exit(status) {
      console.log("[worker] Exit", status);
    },
    spawn_thread(
      thread_id,
      tls_base,
      stack_base,
      funcidx,
      closureptr,
      closuresize,
      dataptr
    ) {
      try {
        const payload = {
          thread_id,
          tls_base,
          stack_base,
          funcidx,
          closureptr,
          closuresize,
          dataptr,
        };
        postMessage({ cmd: "spawn", payload });
        threads[thread_id] = 1;
        return 1;

      } catch (e) {
        console.error(e);
        return 0;
      }
    },
    kill_thread(thread_id) {
      if (threads[thread_id] == null) {
        return 0;
      }
      const payload = { thread_id };
      postMessage({ cmd: "kill", payload });
      delete threads[thread_id];
      return 1;
    },
  };
}

self.onmessage = async function ({ data: { cmd, setup, payload } }) {
  switch (cmd) {
    case 'start': {
      const { binary, memory } = setup;
      const imports = createImports(memory);
      const mod = await WebAssembly.instantiate(binary, imports);
      const exports = mod.instance.exports;
      console.log("[worker] Main starting");
      exports._start();
      console.log("[worker] Main ended");
      break;
    }
    case 'thread': {
      const { binary, memory } = setup;
      const imports = createImports(memory);
      const mod = await WebAssembly.instantiate(binary, imports);
      const exports = mod.instance.exports;
      console.log("[worker] Thread %d started", payload.thread_id);
      exports._thread_start(
        payload.thread_id,
        payload.tls_base,
        payload.stack_base,
        payload.funcidx,
        payload.closureptr,
        payload.closuresize,
        payload.dataptr
      );
      exports._thread_exit(payload.thread_id);
      console.log("[worker] Thread %d ended", payload.thread_id);
      break;
    }
  }
};
