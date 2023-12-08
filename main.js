const script = "./onyx-worker.js";
const wasm = "./out.wasm";

async function fetchBinary() {
  const res = await fetch(wasm);
  const buffer = await res.arrayBuffer();
  // We copy the binary to a shared buffer so that we send it
  // to the workers without a copy.
  const shared = new SharedArrayBuffer(buffer.byteLength);
  const binary = new Uint8Array(shared);
  binary.set(new Uint8Array(buffer));
  return binary;
}

async function main() {
  const memory = new WebAssembly.Memory({ initial: 1024, maximum: 65536, shared: true });
  const binary = await fetchBinary();
  const setup = { binary, memory };
  const threads = {};
  const worker = new Worker(script);
  worker.postMessage({ cmd: "start", setup });
  worker.onmessage = ({ data: { cmd, payload } }) => {
    switch (cmd) {
      case "spawn": {
        const thread = new Worker(script);
        thread.postMessage({ cmd: "thread", setup, payload });
        threads[payload.thread_id] = thread;
        console.log("[browser] Spawned thread %d", payload.thread_id);
        break;
      }
      case "kill": {
        threads[payload.thread_id].terminate();
        delete threads[payload.thread_id];
        console.log("[browser] Thread %d killed!", payload.thread_id);
        break;
      }
    }
  };
}

main();
