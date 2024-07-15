import { useState } from "react";

import { login } from "../auth";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (username && password) {
      login(username, password);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col">
        <h1 className="text-4xl">Login to Kal.</h1>
        <div className="pt-6">
          <input
            type="text"
            className="p-2 border-b-04 border-neutral-200 bg-neutral-900 text-neutral-50 outline-none text-5xl w-full placeholder:text-neutral-500"
            placeholder="Username."
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="pt-2">
          <input
            type="password"
            className="p-2 border-b-04 border-neutral-200 bg-neutral-900 text-neutral-50 outline-none text-5xl w-full placeholder:text-neutral-500"
            placeholder="Password."
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="pt-6">
          <a
            className="cursor-pointer text-3xl underline text-violet-400"
            onClick={handleLogin}
          >
            Login
          </a>
        </div>
      </div>
    </div>
  );
}
