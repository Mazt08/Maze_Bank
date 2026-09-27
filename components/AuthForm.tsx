"use client";

/**
 * AuthForm — shared client component for login and register.
 * Handles Firebase client-side auth, then calls server actions to set the
 * HttpOnly session cookie before redirecting.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { setSession, registerUser } from "@/actions/auth";

interface Props {
  mode: "login" | "register";
}

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,64}$/;
const PASSWORD_HINT = "8-64 characters with uppercase, lowercase, number, and symbol";

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        let uid: string;

        if (mode === "register") {
          if (!name.trim()) {
            setError("Full name is required.");
            return;
          }
          if (!PASSWORD_PATTERN.test(password)) {
            setError(`Password must contain ${PASSWORD_HINT}.`);
            return;
          }
          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
          }
          const cred = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          uid = cred.user.uid;
          const idToken = await cred.user.getIdToken();

          // Create Firestore user doc
          const regResult = await registerUser(uid, name.trim(), email);
          if (regResult.error) {
            setError(regResult.error);
            return;
          }

          // Set session cookie
          const sessionResult = await setSession(idToken);
          if (sessionResult.error) {
            setError(sessionResult.error);
            return;
          }
        } else {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const idToken = await cred.user.getIdToken();

          const sessionResult = await setSession(idToken);
          if (sessionResult.error) {
            setError(sessionResult.error);
            return;
          }
        }

        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const code =
          err instanceof Error && "code" in err
            ? (err as { code: string }).code
            : "";
        if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
          setError("Invalid email or password.");
        } else if (code === "auth/email-already-in-use") {
          setError("An account with this email already exists.");
        } else if (code === "auth/weak-password") {
          setError("Password must be at least 8 characters.");
        } else if (code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    });
  }

  const isRegister = mode === "register";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {isRegister && (
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="Michael De Santa"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
            minLength={isRegister ? 8 : undefined}
            maxLength={isRegister ? 64 : undefined}
            pattern={isRegister ? PASSWORD_PATTERN.source : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder={isRegister ? "Strong password" : "••••••••"}
        />
          {isRegister && (
            <p className="text-xs text-gray-400 mt-1">{PASSWORD_HINT}</p>
          )}
      </div>

        {isRegister && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={64}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Repeat your password"
            />
          </div>
        )}

      {error && (
        <p
          role="alert"
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-brand hover:bg-brand-light disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
      >
        {isPending
          ? isRegister
            ? "Creating account…"
            : "Signing in…"
          : isRegister
          ? "Create account"
          : "Sign in"}
      </button>
    </form>
  );
}
