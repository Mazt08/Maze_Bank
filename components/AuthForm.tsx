"use client";

/**
 * AuthForm — shared client component for login and register.
 * Handles Firebase client-side auth, then calls server actions to set the
 * HttpOnly session cookie before redirecting.
 *
 * Regex validation (register mode):
 *   NAME_REGEX     — letters (incl. accented), spaces, hyphens, apostrophes; 2–50 chars
 *   EMAIL_REGEX    — standard email format
 *   PASSWORD_REGEX — min 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special char
 *   confirm        — must match password
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { setSession, registerUser } from "@/actions/auth";

// ─── Regex patterns ────────────────────────────────────────────────────────────

/** Letters (including common accented chars), spaces, hyphens, apostrophes; 2–50 chars. */
const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]{2,50}$/;

/** Standard email format. */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/**
 * Strong password — all four character classes + minimum length:
 *   (?=.*[a-z])           at least one lowercase letter
 *   (?=.*[A-Z])           at least one uppercase letter
 *   (?=.*\d)              at least one digit
 *   (?=.*[special chars]) at least one special character
 *   .{8,}                 minimum 8 characters total
 */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?`~]).{8,}$/;

// ─── Validation helpers ────────────────────────────────────────────────────────

function validateName(value: string): string | null {
  if (!value.trim()) return "Full name is required.";
  if (!NAME_REGEX.test(value.trim()))
    return "Name may only contain letters, spaces, hyphens, or apostrophes (2–50 chars).";
  return null;
}

function validateEmail(value: string): string | null {
  if (!value.trim()) return "Email address is required.";
  if (!EMAIL_REGEX.test(value.trim())) return "Please enter a valid email address.";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (!PASSWORD_REGEX.test(value))
    return "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.";
  return null;
}

function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

// ─── Password strength meter ───────────────────────────────────────────────────

type Strength = "weak" | "fair" | "good" | "strong";

function getStrength(password: string): Strength | null {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?`~]/.test(password)) score++;
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score <= 4) return "good";
  return "strong";
}

const STRENGTH_META: Record<Strength, { label: string; color: string; bars: number }> = {
  weak: { label: "Weak", color: "bg-red-500", bars: 1 },
  fair: { label: "Fair", color: "bg-orange-400", bars: 2 },
  good: { label: "Good", color: "bg-yellow-400", bars: 3 },
  strong: { label: "Strong", color: "bg-green-500", bars: 4 },
};

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getStrength(password);
  if (!strength) return null;
  const { label, color, bars } = STRENGTH_META[strength];
  const textColor =
    strength === "weak" ? "text-red-500" :
      strength === "fair" ? "text-orange-500" :
        strength === "good" ? "text-yellow-600" :
          "text-green-600";

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${bar <= bars ? color : "bg-gray-200"
              }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColor}`}>{label} password</p>
    </div>
  );
}

// ─── Inline field error ────────────────────────────────────────────────────────

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-red-600 flex items-center gap-1">
      <span aria-hidden="true">⚠</span> {message}
    </p>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

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
const [confirm, setConfirm] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Track which fields the user has interacted with (blur-triggered errors)
  const [touched, setTouched] = useState({
    name: false, email: false, password: false, confirm: false,
  });

  const isRegister = mode === "register";

  // Compute live per-field errors only after the field has been touched
  const nameError = isRegister && touched.name ? validateName(name) : null;
  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;
  const confirmError = isRegister && touched.confirm ? validateConfirm(password, confirm) : null;

  function touch(field: keyof typeof touched) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // Mark all fields touched to reveal any remaining errors
    setTouched({ name: true, email: true, password: true, confirm: true });

    // Client-side validation gate before calling Firebase
    if (isRegister) {
      if (validateName(name)) return;
      if (validateEmail(email)) return;
      if (validatePassword(password)) return;
      if (validateConfirm(password, confirm)) return;
    } else {
      if (validateEmail(email)) return;
      if (!password) { setSubmitError("Password is required."); return; }
    }

    startTransition(async () => {
      try {
        if (mode === "register") {
if (!name.trim()) {
            setSubmitError("Full name is required.");
            return;
          }
          if (!PASSWORD_PATTERN.test(password)) {
            setSubmitError(`Password must contain ${PASSWORD_HINT}.`);
            return;
          }
          if (password !== confirm) {
            setSubmitError("Passwords do not match.");
            return;
          }
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          const idToken = await cred.user.getIdToken();

          const regResult = await registerUser(cred.user.uid, name.trim(), email);
          if (regResult.error) { setSubmitError(regResult.error); return; }

          const sessionResult = await setSession(idToken);
          if (sessionResult.error) { setSubmitError(sessionResult.error); return; }
        } else {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          const idToken = await cred.user.getIdToken();

          const sessionResult = await setSession(idToken);
          if (sessionResult.error) { setSubmitError(sessionResult.error); return; }
        }

        router.push("/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const code =
          err instanceof Error && "code" in err
            ? (err as { code: string }).code
            : "";

        if (
          code === "auth/user-not-found" ||
          code === "auth/wrong-password" ||
          code === "auth/invalid-credential"
        ) {
          setSubmitError("Invalid email or password.");
        } else if (code === "auth/email-already-in-use") {
          setSubmitError("An account with this email already exists.");
        } else if (code === "auth/weak-password") {
          setSubmitError("Password must be at least 8 characters.");
        } else if (code === "auth/invalid-email") {
          setSubmitError("Please enter a valid email address.");
        } else {
          setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        }
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

      {/* ── Full name (register only) ── */}
      {isRegister && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => touch("name")}
            aria-invalid={!!nameError}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors ${nameError ? "border-red-400 bg-red-50" : "border-gray-300"
              }`}
            placeholder="Michael De Santa"
          />
          <FieldError message={nameError} />
        </div>
      )}

      {/* ── Email ── */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => touch("email")}
          aria-invalid={!!emailError}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors ${emailError ? "border-red-400 bg-red-50" : "border-gray-300"
            }`}
          placeholder="you@example.com"
        />
        <FieldError message={emailError} />
      </div>

      {/* ── Password ── */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
onBlur={() => touch("password")}
          aria-invalid={!!passwordError}
          className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors ${passwordError ? "border-red-400 bg-red-50" : "border-gray-300"}`}
          placeholder={isRegister ? "Min 8 chars, uppercase, number, symbol" : "••••••••"}
        />
        {isRegister && <PasswordStrengthMeter password={password} />}
        {isRegister && <p className="text-xs text-gray-400 mt-1">{PASSWORD_HINT}</p>}
        {isRegister && !password && (
          <p className="mt-1 text-xs text-gray-400">
            Must include uppercase, lowercase, digit &amp; special character.
          </p>
        )}
        <FieldError message={passwordError} />
      </div>

      {/* ── Confirm password (register only) ── */}
      {isRegister && (
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={64}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => touch("confirm")}
            aria-invalid={!!confirmError}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-colors ${confirmError
              ? "border-red-400 bg-red-50"
              : confirm && !confirmError
                ? "border-green-400"
                : "border-gray-300"
              }`}
            placeholder="Re-enter your password"
          />
          {confirm && !confirmError && (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <span aria-hidden="true">✓</span> Passwords match
            </p>
          )}
          <FieldError message={confirmError} />
        </div>
      )}

      {/* ── Server / Firebase submit error ── */}
      {submitError && (
        <p
          role="alert"
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {submitError}
        </p>
      )}

      {/* ── Submit button ── */}
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
