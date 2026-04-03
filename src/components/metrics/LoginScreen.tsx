"use client";

import { useState } from "react";
import { MONO } from "./types";
import { Lock } from "lucide-react";

interface LoginScreenProps {
  onAuth: (key: string) => void;
}

export default function LoginScreen({ onAuth }: LoginScreenProps) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === "ZuoQ6k*_6wmBbUQQim!B") {
      onAuth(pw);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0f14]">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
      <div
        className="w-full max-w-sm bg-[#161920] rounded-2xl border border-white/[0.08] p-8"
        style={shake ? { animation: "shake 0.4s ease-in-out" } : undefined}
      >
        <div className="flex items-center justify-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-xl font-semibold text-gray-100 text-center mb-1">
          GetNearMe
        </h1>
        <p
          className={`${MONO} text-[11px] tracking-wider uppercase text-gray-500 text-center mb-8`}
        >
          Metrics Console
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(false);
            }}
            className={`${MONO} w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 outline-none transition-all ${
              error
                ? "border-red-500/50 focus:ring-2 focus:ring-red-500/50"
                : "border-white/10 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            }`}
            autoFocus
          />
          {error && (
            <p className={`${MONO} text-xs text-red-400 mt-2`}>
              Password errata
            </p>
          )}
          <button
            type="submit"
            className={`${MONO} w-full mt-4 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-500 transition-colors text-sm tracking-wider`}
          >
            Access
          </button>
        </form>
      </div>
    </div>
  );
}
