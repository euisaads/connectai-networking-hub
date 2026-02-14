  import React, { useState } from "react";

type Props = {
  onSubmitEmail: (email: string) => void;
};

export default function EmailGate({ onSubmitEmail }: Props) {
  const [email, setEmail] = useState("");

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    onSubmitEmail(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">
          ConnectAI
        </h1>
        <p className="text-gray-500 text-center mt-2">
          Para acessar o diretório, informe seu e-mail.
        </p>

        <form onSubmit={handle} className="mt-6 space-y-3">
          <input
            type="email"
            required
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-linkedin-500 focus:border-linkedin-500"
          />
          <button
            type="submit"
            className="w-full bg-linkedin-600 hover:bg-linkedin-700 text-white py-3 rounded-lg font-semibold"
          >
            Continuar
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-4">
          *MVP: este acesso não valida propriedade do e-mail.
        </p>
      </div>
    </div>
  );
}
