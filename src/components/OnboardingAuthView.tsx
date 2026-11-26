import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  AtSign,
  HeartPulse,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import type { AuthProvider, UserAvatarConfig } from '../types/dek';
import { AvatarStudio } from './AvatarStudio';

interface OnboardingAuthViewProps {
  onAuthComplete: (payload: {
    name: string;
    city: string;
    authProvider: AuthProvider;
    contactValue: string;
    avatar: UserAvatarConfig;
  }) => void;
}

const PROVIDERS: { id: AuthProvider; label: string; icon: typeof Mail }[] = [
  { id: 'gmail', label: 'Gmail', icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'Autre / Email', icon: AtSign },
];

const COUNTRY_CODES = ['+225', '+33', '+221', '+237', '+212'];
const CITIES = ['Abidjan', 'Paris', 'Dakar', 'Lyon', 'Autre'];

export function OnboardingAuthView({ onAuthComplete }: OnboardingAuthViewProps) {
  const [provider, setProvider] = useState<AuthProvider>('gmail');
  const [gmailInput, setGmailInput] = useState('');
  const [countryCode, setCountryCode] = useState('+225');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Abidjan');
  const [avatar, setAvatar] = useState<UserAvatarConfig>({
    mode: 'preset',
    presetId: 'manga-sprint',
    diceStyle: 'lorelei',
    seed: 'DEK_Hero',
    bgColor: '0f172a',
    auraColor: '#C8FF00',
  });
  const [healthAccepted, setHealthAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickFill = () => {
    setErrorMsg(null);
    setName('Karim_DEK');
    setCity('Abidjan');
    if (provider === 'gmail') {
      setGmailInput('karim.dek@gmail.com');
    } else if (provider === 'whatsapp') {
      setPhoneInput('07 08 45 12 90');
    } else {
      setEmailInput('karim@sport-dek.com');
    }
    setHealthAccepted(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setErrorMsg('Indique ton prénom ou pseudo sportif (2 caractères minimum).');
      return;
    }

    let contactValue = '';
    if (provider === 'gmail') {
      const g = gmailInput.trim();
      if (!g.includes('@')) {
        setErrorMsg('Entre une adresse Gmail valide (ex. prenom@gmail.com).');
        return;
      }
      contactValue = g;
    } else if (provider === 'whatsapp') {
      const digits = phoneInput.replace(/\D/g, '');
      if (digits.length < 6) {
        setErrorMsg('Entre un numéro WhatsApp valide.');
        return;
      }
      contactValue = `${countryCode} ${phoneInput.trim()}`;
    } else {
      const em = emailInput.trim();
      if (em.length < 3) {
        setErrorMsg('Entre ton email ou identifiant.');
        return;
      }
      contactValue = em;
    }

    if (!healthAccepted) {
      setErrorMsg('Coche l’engagement santé pour garantir une pratique sécurisée.');
      return;
    }

    setErrorMsg(null);
    onAuthComplete({
      name: cleanName,
      city,
      authProvider: provider,
      contactValue,
      avatar,
    });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080A0E] text-slate-100">
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-5">
        {/* En-tête identitaire */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#C8FF00]/25 bg-gradient-to-br from-[#161D2A] via-[#11151D] to-[#0B0E14] p-4"
        >
          <div className="flex items-center gap-2.5">
            <div className="font-hud flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#C8FF00] text-base font-black tracking-tighter text-black shadow-lg shadow-[#C8FF00]/20">
              DEK
            </div>
            <div>
              <h1 className="font-hud text-lg font-bold tracking-wide text-white">
                BIENVENUE SUR <span className="text-[#C8FF00]">DEK FITNESS</span>
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck className="h-3 w-3" /> Sécurité & Matchmaking équitable
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-300">
            Crée ton profil athlète — Tu passeras ensuite un court{' '}
            <strong className="text-[#C8FF00]">test d’initiation sans quota</strong> pour adapter les
            défis à ta santé et jouer à la régulière.
          </p>
        </motion.div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Choix méthode de connexion */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-slate-400">
              Méthode d’inscription
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-white/10 bg-[#11151D] p-1">
              {PROVIDERS.map((p) => {
                const Icon = p.icon;
                const active = provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProvider(p.id);
                      setErrorMsg(null);
                    }}
                    className={`font-hud relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition ${
                      active ? 'text-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="authProviderTab"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-[#C8FF00]"
                      />
                    )}
                    <Icon className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Champ dynamique selon la méthode */}
          <div className="rounded-2xl border border-white/10 bg-[#11151D] p-3.5 space-y-3">
            {provider === 'gmail' && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Adresse Gmail
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#080A0E] px-3 py-2.5 focus-within:border-[#C8FF00]">
                  <Mail className="h-4 w-4 shrink-0 text-[#C8FF00]" />
                  <input
                    type="email"
                    placeholder="prenom@gmail.com"
                    value={gmailInput}
                    onChange={(e) => setGmailInput(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {provider === 'whatsapp' && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Numéro WhatsApp
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="rounded-xl border border-white/10 bg-[#080A0E] px-2.5 py-2.5 text-xs font-semibold text-[#C8FF00] outline-none"
                  >
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#080A0E] px-3 py-2.5 focus-within:border-[#C8FF00]">
                    <MessageCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                    <input
                      type="tel"
                      placeholder="07 08 45 12 90"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {provider === 'email' && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Email ou identifiant
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#080A0E] px-3 py-2.5 focus-within:border-[#C8FF00]">
                  <AtSign className="h-4 w-4 shrink-0 text-[#00E5FF]" />
                  <input
                    type="text"
                    placeholder="prenom@exemple.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            {/* Pseudo & Ville */}
            <div className="grid grid-cols-[1.3fr_1fr] gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">
                  Prénom / Pseudo
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#080A0E] px-3 py-2.5 focus-within:border-[#C8FF00]">
                  <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Karim"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-300">Ville</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#080A0E] px-2.5 py-2.5 text-xs text-white outline-none focus:border-[#C8FF00]"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Choix rapide ou personnalisation Avatar Manga / Fantaisie */}
          <AvatarStudio value={avatar} onChange={setAvatar} compact />

          {/* Engagement santé obligatoire */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-3">
            <input
              type="checkbox"
              checked={healthAccepted}
              onChange={(e) => setHealthAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#C8FF00]"
            />
            <span className="text-[11px] leading-relaxed text-slate-200">
              <strong className="inline-flex items-center gap-1 text-emerald-400">
                <HeartPulse className="h-3.5 w-3.5" /> Engagement Santé :
              </strong>{' '}
              Je confirme pratiquer à mon rythme et m’arrêter en cas de douleur ou d’essoufflement
              inhabituel.
            </span>
          </label>

          {errorMsg && (
            <div className="rounded-xl border border-[#FF2E54]/40 bg-[#FF2E54]/12 px-3 py-2 text-[11px] font-medium text-[#FF2E54]">
              {errorMsg}
            </div>
          )}

          {/* Bouton principal */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            className="font-hud flex w-full items-center justify-center gap-2 rounded-2xl bg-[#C8FF00] py-3.5 text-xs font-bold tracking-wider text-black shadow-lg shadow-[#C8FF00]/15"
          >
            CRÉER MON COMPTE & LANCER L’INITIATION
            <ArrowRight className="h-4 w-4" />
          </motion.button>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={handleQuickFill}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 underline decoration-slate-600 underline-offset-4 hover:text-[#00E5FF]"
            >
              <Sparkles className="h-3 w-3 text-[#00E5FF]" /> Pré-remplir (démo rapide)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
