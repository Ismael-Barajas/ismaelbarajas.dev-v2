import { useState, FormEvent } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import clsx from "clsx";
import { Button, FROSTED_CARD } from "components/library/Button";
import { getSession } from "lib/session";
import { readApiError } from "lib/apiError";
import { setAdminHint, setView } from "lib/adminStore";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getSession(req, res);
  if (session.isAdmin) {
    return { redirect: { destination: "/", permanent: false } };
  }
  return { props: {} };
};

/** Human message per status; anything else falls back to the API's error text. */
const messageFor = (status: number, apiMessage: string): string => {
  switch (status) {
    case 401:
      return "Invalid password";
    case 429:
      return "Too many attempts. Wait 15 minutes and try again.";
    case 403:
      return "Request blocked. Reload the page and try again.";
    default:
      return apiMessage || "Sign-in failed. Try again.";
  }
};

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Editing happens inline on the homepage: remember this browser has
        // signed in, then land there with admin view already on.
        setAdminHint(true);
        setView(true);
        router.push("/");
        return;
      }
      const apiMessage = await readApiError(res, "");
      setError(messageFor(res.status, apiMessage));
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <Head>
        <title>Sign in · Ismael Barajas</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className={clsx(FROSTED_CARD, "w-full max-w-sm p-8")}>
        <h1 className="font-display font-black text-text text-3xl text-center mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoFocus
            className="w-full rounded-xl bg-black/[0.04] px-4 py-2.5 text-text placeholder:text-gray-500 outline-none ring-text focus-visible:ring-2 dark:bg-white/[0.06] dark:placeholder:text-gray-400"
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" disabled={loading} className="w-full disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
