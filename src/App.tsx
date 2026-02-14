import React, { useEffect, useState } from "react";

import Header from "./components/Header";
import EmailGate from "./components/EmailGate";
import ProfileCard from "./components/ProfileCard";
import RegistrationForm from "./components/RegistrationForm";
import IcebreakerModal from "./components/IcebreakerModal";

import { Profile, NetworkingMode } from "./types";
import { api } from "./services/api";

import { Search, Filter, Loader2, UserPlus, X, MapPin } from "lucide-react";

/**
 * App principal
 * - Adiciona EmailGate (primeira tela: inserir e-mail)
 * - Salva e-mail em localStorage (connectai_current_email)
 * - Depois mostra o diretório / registro normalmente
 *
 * Observação: este fluxo NÃO valida propriedade do e-mail (MVP).
 */

const App: React.FC = () => {
  // Data State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // "Sessão" simples via e-mail (MVP)
  const [currentEmail, setCurrentEmail] = useState<string | null>(() => {
    return localStorage.getItem("connectai_current_email");
  });

  // UI State
  const [mode, setMode] = useState<NetworkingMode>(NetworkingMode.VIEW);
  const [myProfileId, setMyProfileId] = useState<string | null>(() => {
    return localStorage.getItem("connectai_my_id") || null;
  });
  const [editTarget, setEditTarget] = useState<Profile | undefined>(undefined);

  // Filter State
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("Todas");
  const [cityFilter, setCityFilter] = useState("Todas");

  // Icebreaker State
  const [icebreakerTarget, setIcebreakerTarget] = useState<Profile | null>(null);
  const [isIcebreakerOpen, setIsIcebreakerOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    // Carrega dados iniciais (sempre)
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, areaFilter, cityFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getProfiles({
        search,
        area: areaFilter,
        city: cityFilter,
      });
      setProfiles(data);

      const actions = api.getMyActions();
      setFollowedIds(actions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Email Gate handlers (Etapa 1) ---
  const handleEmailAccess = (email: string) => {
    const normalized = email.trim().toLowerCase();
    localStorage.setItem("connectai_current_email", normalized);
    setCurrentEmail(normalized);
    // opcional: podemos tentar localizar automaticamente o perfil vinculado ao e-mail
    // isso ficará para a Etapa 2 (integração com Supabase)
  };

  const handleLogoutEmail = () => {
    localStorage.removeItem("connectai_current_email");
    setCurrentEmail(null);
  };

  // --- Profile CRUD UI handlers (mantidos) ---
  const handleSaveProfile = (savedProfile: Profile) => {
    if (mode === NetworkingMode.EDIT) {
      setProfiles(profiles.map((p) => (p.id === savedProfile.id ? savedProfile : p)));
    } else {
      setProfiles([savedProfile, ...profiles]);
      setMyProfileId(savedProfile.id);
      localStorage.setItem("connectai_my_id", savedProfile.id);
    }

    setMode(NetworkingMode.VIEW);
    setEditTarget(undefined);
    loadData();
  };

  const handleEdit = (profile: Profile) => {
    setEditTarget(profile);
    setMode(NetworkingMode.EDIT);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir seu perfil? Esta ação não pode ser desfeita.")) {
      try {
        await api.deleteProfile(id);
        if (id === myProfileId) {
          setMyProfileId(null);
          localStorage.removeItem("connectai_my_id");
        }
        await loadData();
      } catch (e) {
        alert("Erro ao excluir perfil");
      }
    }
  };

  const handleFollow = (id: string, url: string) => {
    // abre linkedin
    window.open(url, "_blank");

    // track action local
    api.trackAction(id, "assumed_follow");

    // update UI
    const newFollowed = new Set(followedIds);
    newFollowed.add(id);
    setFollowedIds(newFollowed);
  };

  const handleOpenIcebreaker = (target: Profile) => {
    if (!myProfileId) {
      if (confirm("Para gerar uma mensagem personalizada, precisamos saber quem é você. Deseja criar seu perfil agora?")) {
        setMode(NetworkingMode.REGISTER);
      }
      return;
    }
    const myProfile = profiles.find((p) => p.id === myProfileId);
    if (!myProfile) return;

    setIcebreakerTarget(target);
    setIsIcebreakerOpen(true);
  };

  // Extract unique values for filters
  const uniqueAreas = Array.from(new Set(profiles.map((p) => p.area))).sort();
  const uniqueCities = Array.from(new Set(profiles.map((p) => p.city))).sort();

  const myProfile = profiles.find((p) => p.id === myProfileId) || null;

  // === EmailGate: se não houver e-mail salvo, mostra a tela de inserção ===
  if (!currentEmail) {
    return <EmailGate onSubmitEmail={handleEmailAccess} />;
  }

  // === App principal ===
  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans pb-20">
      <Header
        mode={mode}
        setMode={setMode}
        totalProfiles={profiles.length}
        // Passa e-mail atual e função para "sair"
        userEmail={currentEmail}
        // onSendMagicLink mantém-se por compatibilidade com o Header anterior — passamos um noop
        onSendMagicLink={async () => {}}
        onLogout={async () => {
          handleLogoutEmail();
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === NetworkingMode.REGISTER || mode === NetworkingMode.EDIT ? (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <RegistrationForm
              initialData={mode === NetworkingMode.EDIT ? editTarget : undefined}
              onSave={handleSaveProfile}
              onCancel={() => {
                setMode(NetworkingMode.VIEW);
                setEditTarget(undefined);
              }}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* CTA Box - Show only if user doesn't have a profile */}
            {!myProfileId && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Faça parte do diretório</h2>
                  <p className="text-gray-500">Cadastre-se para aparecer nas buscas e usar a IA de conexão.</p>
                </div>
                <button
                  onClick={() => setMode(NetworkingMode.REGISTER)}
                  className="bg-linkedin-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-linkedin-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <UserPlus className="w-5 h-5" />
                  Criar Perfil Grátis
                </button>
              </div>
            )}

            {/* Search & Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4 md:space-y-0 md:flex gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-linkedin-500 focus:border-linkedin-500"
                  placeholder="Buscar por nome, cargo ou tags..."
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <div className="relative min-w-[140px]">
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-linkedin-500 focus:border-linkedin-500 appearance-none bg-white"
                  >
                    <option value="Todas">Todas Áreas</option>
                    {uniqueAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <Filter className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>

                <div className="relative min-w-[140px]">
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-linkedin-500 focus:border-linkedin-500 appearance-none bg-white"
                  >
                    <option value="Todas">Todas Cidades</option>
                    {uniqueCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Clear Filters */}
              {(search || areaFilter !== "Todas" || cityFilter !== "Todas") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setAreaFilter("Todas");
                    setCityFilter("Todas");
                  }}
                  className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                  title="Limpar filtros"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Results */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-linkedin-600" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                <p className="text-gray-500 font-medium mb-4">Nenhum profissional encontrado.</p>
                <button onClick={() => setMode(NetworkingMode.REGISTER)} className="text-linkedin-600 font-semibold hover:underline">
                  Seja o primeiro a se cadastrar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {profiles.map((profile) => (
                  <ProfileCard
                    key={profile.id}
                    profile={profile}
                    isFollowed={followedIds.has(profile.id)}
                    onFollow={handleFollow}
                    onGenerateIcebreaker={handleOpenIcebreaker}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    // isMe logic -> atualmente usa myProfileId (localStorage). Na Etapa 2 iremos ligar por email/owner_id.
                    isMe={profile.id === myProfileId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* AI Modal */}
      <IcebreakerModal isOpen={isIcebreakerOpen} onClose={() => setIsIcebreakerOpen(false)} targetProfile={icebreakerTarget} myProfile={myProfile} />
    </div>
  );
};

export default App;
