# [Onyx](https://onyxlang.io/) / JS multithreading example


## Steps

1. Clone the repo.

2. Compile the example:

```sh
onyx build atomics.onyx -r js --multi-threaded
```

3. Serve this directory with a [COOP/COEP](https://web.dev/articles/coop-coep) enabled static server (this is so [SAB](https://devdocs.io/javascript/global_objects/sharedarraybuffer)/[Atomics](https://devdocs.io/javascript/global_objects/atomics) work).

4. Open `index.html` and check the console.

## License

Public domain.
