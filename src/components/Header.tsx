import React, { useState } from "react";
import { Network, PlusCircle, Users } from "lucide-react";
import { NetworkingMode } from "../types";

interface HeaderProps {
  mode: NetworkingMode;
  setMode: (mode: NetworkingMode) => void;
  totalProfiles: number;

  // Auth (vem do App)
  userEmail: string | null;
  onSendMagicLink: (email: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  totalProfiles,
  userEmail,
  onSendMagicLink,
  onLogout,
}) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setBusy(true);
    try {
      await onSendMagicLink(email);
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await onLogout();
      setEmail("");
      setSent(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setMode(NetworkingMode.VIEW)}
          >
            <div className="bg-linkedin-600 p-2 rounded-lg">
              <Network className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">
                ConnectAI
              </h1>
              <span className="text-xs text-linkedin-600 font-medium tracking-wide">
                NETWORKING HUB
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Counter */}
            <div className="hidden md:flex items-center gap-2 text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <Users className="h-4 w-4" />
              <span className="font-semibold text-gray-700">{totalProfiles}</span>
              <span>profissionais conectados</span>
            </div>

            {/* Auth */}
            <div className="hidden sm:flex items-center gap-2">
              {!userEmail ? (
                sent ? (
                  <span className="text-xs text-green-600">
                    Link enviado! Verifique seu e-mail.
                  </span>
                ) : (
                  <form onSubmit={handleLogin} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Seu e-mail"
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-linkedin-500 focus:border-linkedin-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="bg-linkedin-600 hover:bg-linkedin-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      {busy ? "Enviando..." : "Entrar"}
                    </button>
                  </form>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 max-w-[180px] truncate">
                    {userEmail}
                  </span>
                  <button
                    onClick={handleLogout}
                    disabled={busy}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>

            {/* CTA (mantém o botão existente) */}
            {mode === NetworkingMode.VIEW ? (
              <button
                onClick={() => setMode(NetworkingMode.REGISTER)}
                className="flex items-center gap-2 bg-linkedin-600 hover:bg-linkedin-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Adicionar Perfil</span>
                <span className="sm:hidden">Novo</span>
              </button>
            ) : (
              <button
                onClick={() => setMode(NetworkingMode.VIEW)}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
