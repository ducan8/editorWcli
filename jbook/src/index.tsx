import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import * as esbuild from "esbuild-wasm";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

const App = () => {
  const ref = useRef<any>();
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");

  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: "https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm",
    });
  };

  useEffect(() => {
    startService();
  }, []);

  const handleSubmit = async () => {
    if (!ref.current) return;
    console.log(ref.current);
    console.log(input);

    const result = await ref.current.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      // format: "esm",
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        "process.env.NODE_ENV": "production",
        global: "window",
      },
    });
    console.log(result);
    setCode(result.outputFiles[0].text);

    // const result = await ref.current.transform(input, {
    //   loader: "jsx",
    //   target: "es2015",
    // });
    // setCode(result.code);
  };

  return (
    <>
      <div>
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
          ></textarea>
        </div>
        <button type="submit" onClick={handleSubmit}>
          Submit
        </button>
      </div>
      <pre>{code}</pre>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
