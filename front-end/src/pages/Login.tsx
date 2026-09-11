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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-text">
      <div className="relative w-full max-w-md overflow-hidden border border-border bg-sidebar shadow-xl">
        <div className="relative p-8 lg:p-12">
          <div className="mb-8 text-center">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">
              UAV_DT_SYS
            </div>
            <h1 className="text-xl font-bold text-surface uppercase tracking-wider mb-1">
              AVIATION OPERATIONS SYSTEM
            </h1>
            <div className="text-xs font-mono text-muted uppercase tracking-widest">
              SECURE ACCESS
            </div>
            <div className="mt-4 py-1 px-3 bg-status-critical/20 border border-status-critical/30 text-status-critical text-[10px] font-mono uppercase tracking-widest inline-block">
              Authorized Personnel Only
            </div>
          </div>

          <div className="mb-8 p-4 bg-surface/5 border border-border/20 rounded">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={16} className="text-primary" />
              <span className="text-xs font-mono text-surface uppercase tracking-widest">Access Terminal</span>
            </div>
            <div className="space-y-1">
              {bootLines.slice(0, bootIndex + 1).map((line, index) => (
                <div
                  key={`${line}-${index}`}
                  className="font-mono text-[9px] uppercase tracking-wider text-muted/80"
                >
                  {line}
                </div>
              ))}
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
              className="flex w-full items-center justify-center gap-2 bg-surface text-sidebar px-4 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-colors hover:bg-surface-raised"
            >
              Log In
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 border-t border-border/20 pt-5">
            <button
              type="button"
              onClick={() => navigate("/fleet")}
              className="w-full border border-border/30 bg-transparent px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-surface hover:border-surface"
            >
              Skip auth — Get Started →
            </button>
          </div>

          <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-wider text-muted">
            Don’t have an account? {" "}
            <Link to="/signup" className="text-surface underline underline-offset-4 hover:text-primary transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}