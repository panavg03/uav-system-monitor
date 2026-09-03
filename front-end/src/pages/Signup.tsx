import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { TerminalInput } from "../components/TerminalInput";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    orgId: "",
    employeeId: "",
    username: "",
    password: "",
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("signup payload", form);
    navigate("/fleet");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-auth px-4 py-10 text-text-primary">
      <div className="relative w-full max-w-xl overflow-hidden border border-accent-green/60 bg-surface/90 shadow-[0_0_28px_rgba(57,255,136,0.15)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(57,255,136,0.12),_transparent_60%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(57,255,136,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,136,0.05)_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-accent-green bg-accent-green/10 text-accent-green">
              <ShieldCheck size={18} />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted">
                UAV_DT_SYS
              </div>
              <h1 className="mt-1 font-mono text-xl font-bold uppercase tracking-[0.18em] text-text-primary">
                &gt; CREATE ACCOUNT <span className="inline-block h-4 w-2 animate-pulse bg-accent-green align-middle" />
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <TerminalInput
              label="Organization ID"
              value={form.orgId}
              onChange={(event) => handleChange("orgId", event.target.value)}
              placeholder="ENTER ORG ID"
              autoComplete="organization"
              required
            />

            <TerminalInput
              label="Organization Employee ID"
              value={form.employeeId}
              onChange={(event) => handleChange("employeeId", event.target.value)}
              placeholder="ENTER EMPLOYEE ID"
              autoComplete="off"
              required
            />

            <TerminalInput
              label="Username"
              value={form.username}
              onChange={(event) => handleChange("username", event.target.value)}
              placeholder="ENTER USERNAME"
              autoComplete="username"
              required
            />

            <TerminalInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
              placeholder="ENTER PASSWORD"
              autoComplete="new-password"
              hint={form.password.length >= 10 ? "Password strength: high" : "Password strength: nominal"}
              required
            />

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 bg-accent-green px-4 py-3 font-mono text-sm font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-accent-green/90"
            >
              Create Account
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-text-secondary">
            Already have an account? {" "}
            <Link to="/login" className="text-accent-green underline-offset-4 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
