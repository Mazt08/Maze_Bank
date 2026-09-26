"use client";

/**
 * TransferForm — client component.
 * Uses React's useFormState + useFormStatus to call the transferFunds server action.
 */
import { useFormState, useFormStatus } from "react-dom";
import { transferFunds, type TransferState } from "@/actions/transfer";
import { useEffect, useRef } from "react";

const initialState: TransferState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-brand hover:bg-brand-light disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
    >
      {pending ? "Sending…" : "Send money"}
    </button>
  );
}

export default function TransferForm() {
  const [state, formAction] = useFormState(transferFunds, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form on success
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="accountNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Recipient account number
          </label>
          <input
            id="accountNumber"
            name="accountNumber"
            type="text"
            inputMode="numeric"
            pattern="\d{10}"
            maxLength={10}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent font-mono"
            placeholder="0000000000"
          />
          <p className="text-xs text-gray-400 mt-1">10-digit account number</p>
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              $
            </span>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              max="10000"
              step="0.01"
              required
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Maximum $10,000 per transfer</p>
        </div>

        <div>
          <label
            htmlFor="note"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Note{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="note"
            name="note"
            type="text"
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            placeholder="e.g. Rent, dinner, etc."
          />
        </div>

        {/* Error */}
        {state.error && (
          <p
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
          >
            {state.error}
          </p>
        )}

        {/* Success */}
        {state.success && (
          <p
            role="status"
            className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
          >
            ✓ Transfer complete! The funds have been sent.
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
