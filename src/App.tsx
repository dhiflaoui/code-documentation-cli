import React, { useState, useEffect, useRef } from "react";
import * as esbuild from "esbuild-wasm";
import "./App.css";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

function App() {
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");
  const ref = useRef<any>();
  //esbuild config
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
    const result = await ref.current.transform(input, {
      loader: "jsx",
      target: "es2015",
    });
    setCode(result.code);
  };

  return (
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
  );
}

export default App;
