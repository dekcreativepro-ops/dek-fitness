import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from './DekIcons';
import type { AuthProvider, UserAvatarConfig } from '../types/dek';
import { usePhoto } from '../utils/usePhoto';
import { AvatarStudio } from './AvatarStudio';
import { ChipTabs } from './ui/kit';

interface OnboardingAuthViewProps {
  onAuthComplete: (payload: {
    name: string;
    city: string;
    authProvider: AuthProvider;
    contactValue: string;
    avatar: UserAvatarConfig;
  }) => void;
}

const PROVIDERS: { id: AuthProvider; label: string }[] = [
  { id: 'gmail', label: 'Gmail' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Autre / Email' },
];

const COUNTRY_CODES = ['+237', '+33', '+225', '+221', '+212'];
const CITIES = ['Douala', 'Yaoundé', 'Bafoussam', 'Kribi', 'Autre'];

const FIELD = 'h-11 w-full border-b border-rim bg-transparent text-[15px] font-medium text-fg outline-none transition-colors placeholder:text-faint focus:border-lime';
const LABEL = 'block text-[12px] font-medium leading-4 text-mute';

export function OnboardingAuthView({ onAuthComplete }: OnboardingAuthViewProps) {
  const authPhoto = usePhoto('auth', 'detail');
  const [provider, setProvider] = useState<AuthProvider>('gmail');
  const [gmailInput, setGmailInput] = useState('');
  const [countryCode, setCountryCode] = useState('+237');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Douala');
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
    setCity('Douala');
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
    <div className="flex h-full w-full flex-col overflow-hidden bg-ink text-fg">
      <div className="no-scrollbar flex-1 overflow-y-auto pb-8">
        {/* Photo + titre */}
        <div className="relative h-[240px] overflow-hidden">
          <img
            src={authPhoto}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-black/20" />
          <div className="relative flex h-full flex-col justify-end px-5 pb-4">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[34px] font-extrabold leading-[38px] tracking-tight text-white"
            >
              Crée ton profil athlète
            </motion.h1>
            <p className="mt-2 text-[14px] font-medium leading-5 text-white/75">
              Tu passeras ensuite un court <strong className="font-bold text-lime">test d’initiation sans quota</strong> pour
              adapter les défis à ta santé et jouer à la régulière.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-6 px-5">
          {/* Mode d'inscription */}
          <div>
            <span className={`${LABEL} mb-2`}>Méthode d’inscription</span>
            <ChipTabs
              items={PROVIDERS}
              value={provider}
              onChange={(id) => {
                setProvider(id);
                setErrorMsg(null);
              }}
              layoutId="authProviderTab"
            />
          </div>

          {/* Champs soulignés */}
          <div className="space-y-5">
            {provider === 'gmail' && (
              <label className="block">
                <span className={LABEL}>Adresse Gmail</span>
                <input
                  type="email"
                  placeholder="prenom@gmail.com"
                  value={gmailInput}
                  onChange={(e) => setGmailInput(e.target.value)}
                  className={FIELD}
                />
              </label>
            )}

            {provider === 'whatsapp' && (
              <div>
                <span className={LABEL}>Numéro WhatsApp</span>
                <div className="flex gap-3">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label="Indicatif"
                    className={`${FIELD} w-[84px] shrink-0 font-semibold`}
                  >
                    {COUNTRY_CODES.map((code) => (
                      <option key={code} value={code} className="bg-card">
                        {code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="07 08 45 12 90"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    aria-label="Numéro WhatsApp"
                    className={`${FIELD} min-w-0 flex-1`}
                  />
                </div>
              </div>
            )}

            {provider === 'email' && (
              <label className="block">
                <span className={LABEL}>Email ou identifiant</span>
                <input
                  type="text"
                  placeholder="prenom@exemple.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={FIELD}
                />
              </label>
            )}

            <div className="grid grid-cols-[1.3fr_1fr] gap-4">
              <label className="block">
                <span className={LABEL}>Prénom / Pseudo</span>
                <input
                  type="text"
                  placeholder="Ex: Karim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>Ville</span>
                <select value={city} onChange={(e) => setCity(e.target.value)} className={FIELD}>
                  {CITIES.map((c) => (
                    <option key={c} value={c} className="bg-card">
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Studio d'avatar */}
          <AvatarStudio value={avatar} onChange={setAvatar} compact />

          {/* Engagement santé */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={healthAccepted}
              onChange={(e) => setHealthAccepted(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-lime ${
                healthAccepted ? 'border-lime bg-lime text-on-lime' : 'border-faint text-transparent'
              }`}
            >
              <Check weight="bold" className="h-3.5 w-3.5" />
            </span>
            <span className="text-[13px] font-medium leading-5 text-mute">
              <strong className="font-bold text-fg">Engagement Santé :</strong> Je confirme pratiquer à mon rythme et
              m’arrêter en cas de douleur ou d’essoufflement inhabituel.
            </span>
          </label>

          {errorMsg && (
            <div role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-[13px] font-semibold text-danger">
              {errorMsg}
            </div>
          )}

          <div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-2 text-center text-[15px] font-bold leading-5 text-on-lime"
            >
              Créer mon compte & lancer l’initiation
              <ArrowRight weight="bold" className="h-4 w-4 shrink-0" />
            </motion.button>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[13px] font-medium text-mute underline decoration-rim underline-offset-4 transition active:opacity-70"
              >
                Pré-remplir (démo rapide)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
