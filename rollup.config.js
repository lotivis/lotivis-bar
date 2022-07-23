import { terser } from "rollup-plugin-terser";
import nodeResolve from "@rollup/plugin-node-resolve";
import * as meta from "./package.json";

const copyright = "Lukas Danckwerth";

const config = {
  input: "src/index.js",
  external: Object.keys(meta.dependencies || {}).filter((key) =>
    /^lotivis-/.test(key)
  ),
  output: {
    file: `dist/${meta.name}.js`,
    name: "lotivis",
    format: "umd",
    indent: false,
    extend: true,
    banner: `// ${meta.name} v${meta.version} Copyright ${copyright}`,
    globals: Object.assign(
      {},
      ...Object.keys(meta.dependencies || {})
        .filter((key) => /^lotivis-/.test(key))
        .map((key) => ({ [key]: "lotivis" }))
    ),
  },
  plugins: [nodeResolve()],
  onwarn(message, warn) {
    if (message.code === "CIRCULAR_DEPENDENCY") return;
    warn(message);
  },
};

export default [
  config,
  {
    ...config,
    output: {
      ...config.output,
      file: `dist/${meta.name}.min.js`,
    },
    plugins: [
      ...config.plugins,
      terser({
        output: {
          preamble: config.output.banner,
        },
      }),
    ],
  },
];
