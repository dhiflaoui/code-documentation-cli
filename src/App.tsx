import React, { useState, useEffect, useRef } from "react";
import * as esbuild from "esbuild-wasm";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";
import "./App.css";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";

function App() {
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");
  const ref = useRef<any>();
  const iframe = useRef<any>();
  /********************esbuild config*********************/
  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      wasmURL: "/esbuild.wasm",
    });
  };
  useEffect(() => {
    startService();
  }, []);

  const onClick = async () => {
    if (!ref.current) {
      return;
    }
    //transpiler (babel)
    /* const result = await ref.current.transform(input, {
      loader: "jsx",
      target: "es2015",
    }); */
    const result = await ref.current.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)],
      define: {
        "process.env.NODE_ENV": '"production"', //avoid some package error
        global: "window",
      },
    });

    // setCode(result.outputFiles[0].text);
    iframe.current.contentWindow.postMessage(result.outputFiles[0].text, "*");
  };

  const html = `
    <html>
      <head></head>
      <body>
        <div id="root"></div>
        <script>
          window.addEventListener('message', (event) => {
            eval(event.data);
          }, false);
        </script>
      </body>
    </html>
  `;
  /*****************************************/
  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Box
          component="form"
          sx={{
            "& .MuiTextField-root": { m: 1, width: "80ch" },
          }}
          noValidate
          autoComplete="off"
        >
          <div className="App">
            <TextField
              id="outlined-multiline-static"
              multiline
              rows={4}
              onChange={(e) => setInput(e.target.value)}
            />
            <div>
              <Button variant="contained" onClick={onClick}>
                Submit
              </Button>
            </div>
          </div>
          <pre>{code}</pre>
        </Box>
      </Grid>
      <Grid item xs={6}>
        <iframe ref={iframe} sandbox="allow-scripts" srcDoc={html} />
      </Grid>
    </Grid>
  );
}

export default App;
