import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { TerminalInput } from "../components/TerminalInput";

const bootLines = [
  "INITIALIZING SECURE LINK...",
  "VERIFYING CREDENTIALS MODULE...",
  "SYNCING UAV_DT_SYS NODE STATUS...",
  "ACCESS TERMINAL READY.",
];

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bootIndex, setBootIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBootIndex((current) => {
        if (current >= bootLines.length - 1) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 220);

    return () => window.clearInterval(timer);
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("login payload", { username, password });
    navigate("/fleet");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-auth px-4 py-10 text-text-primary">
      <div className="relative w-full max-w-xl overflow-hidden border border-accent-green/60 bg-surface/90 shadow-[0_0_28px_rgba(57,255,136,0.15)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(57,255,136,0.12),_transparent_60%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(57,255,136,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,136,0.05)_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="mb-6 space-y-2 border-b border-border-hairline pb-5">
            {bootLines.slice(0, bootIndex + 1).map((line, index) => (
              <div
                key={`${line}-${index}`}
                className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-green/80"
              >
                {line}
              </div>
            ))}
          </div>

          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-accent-green bg-accent-green/10 text-accent-green">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted">
                UAV_DT_SYS
              </div>
              <h1 className="mt-1 font-mono text-xl font-bold uppercase tracking-[0.2em] text-text-primary">
                &gt; ACCESS TERMINAL <span className="inline-block h-4 w-2 animate-pulse bg-accent-green align-middle" />
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <TerminalInput
              label="Username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="ENTER USERNAME"
              autoComplete="username"
              required
            />

            <TerminalInput
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="ENTER PASSWORD"
              autoComplete="current-password"
              required
            />

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-accent-green px-4 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-accent-green/90"
            >
              Login
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 border-t border-border-hairline pt-5">
            <button
              type="button"
              onClick={() => navigate("/fleet")}
              className="w-full border border-border-hairline bg-surface-raised px-4 py-3 font-mono text-xs uppercase tracking-[0.28em] text-text-primary transition-colors hover:border-accent-green hover:text-accent-green"
            >
              Skip auth — Get Started →
            </button>
          </div>

          <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary">
            Don’t have an account? {" "}
            <Link to="/signup" className="text-accent-green underline-offset-4 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
