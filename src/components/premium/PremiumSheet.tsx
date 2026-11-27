import { useState, type ReactNode } from 'react';
import { BottomSheet, Button } from '../ui/kit';
import { CheckCircle, Crown, Lock, Warning } from '../DekIcons';
import {
  FEATURE_LABEL,
  PREMIUM_BENEFITS,
  PREMIUM_PRICE_FCFA,
  activatePremium,
  closePaywall,
  openPaywall,
  usePaywall,
  usePremium,
  type PremiumFeature,
} from '../../utils/premium';
import { loginAccount, refreshAccount, registerAccount, useAccount } from '../../utils/account';
import { OPERATORS, PAYMENTS_LIVE, getPaymentConfig, guessOperator, normalizePhone, payPremium, type Operator } from '../../utils/payments';

const FIELD =
  'h-12 w-full rounded-2xl bg-tile px-4 text-[14px] font-medium text-fg outline-none placeholder:text-faint focus:ring-1 focus:ring-lime';

const fcfa = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

type Step = 'offer' | 'pay' | 'wait' | 'done';

function PaywallBody({ feature }: { feature: PremiumFeature | null }) {
  const { paid, trial, trialDays, days } = usePremium();
  const account = useAccount();
  const price = fcfa(account?.nextPrice ?? PREMIUM_PRICE_FCFA);
  const needsAccount = PAYMENTS_LIVE && !account;
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [password, setPassword] = useState('');
  const [accountName, setAccountName] = useState('');
  const [step, setStep] = useState<Step>(paid ? 'done' : 'offer');
  const [operator, setOperator] = useState<Operator>('mtn');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [hosted, setHosted] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const submitAccount = async () => {
    const local = normalizePhone(phone);
    if (!local) return setError('Numéro invalide : 9 chiffres commençant par 6 (ex. 6 70 12 34 56).');
    setError(null);
    setStep('wait');
    const res = mode === 'register' ? await registerAccount(local, accountName, password) : await loginAccount(local, password);
    setStep('pay');
    if (!res.ok) setError(res.error);
  };

  const submit = async () => {
    const local = normalizePhone(phone);
    if (!local) {
      setError('Numéro invalide : 9 chiffres commençant par 6 (ex. 6 70 12 34 56).');
      return;
    }
    if (hosted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Entre une adresse e-mail valide : elle sert au reçu de paiement.');
      return;
    }
    setError(null);
    setStep('wait');
    const [firstName, ...rest] = name.trim().split(/\s+/);
    const res = await payPremium({ operator, phone: local, amount: PREMIUM_PRICE_FCFA, email: email.trim(), firstName: firstName || undefined, lastName: rest.join(' ') || undefined });
    if (res.ok) {
      // En vrai paiement, c'est le serveur qui a activé l'abonnement : on relit le compte. En démo, on active ici.
      if (res.demo) activatePremium({ operator, reference: res.reference, demo: true });
      else await refreshAccount();
      setDemo(res.demo);
      setStep('done');
    } else {
      setError(res.message ?? 'Paiement impossible.');
      setStep('pay');
    }
  };

  if (step === 'done') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-on-lime">
          <CheckCircle className="h-8 w-8" />
        </div>
        <div>
          <div className="text-[20px] font-bold text-fg">Tu es Premium</div>
          <div className="text-[13px] font-medium text-mute">
            {days} jour{days > 1 ? 's' : ''} restant{days > 1 ? 's' : ''}. Tournois, pistes et modes spéciaux sont débloqués.
          </div>
          {demo && <div className="mt-2 text-[12px] font-medium text-faint">Mode démo : aucun argent n’a été débité.</div>}
        </div>
        <Button fullWidth onClick={closePaywall}>
          C’est parti
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {feature && (
        <div className="flex items-start gap-3 rounded-[20px] bg-tile p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-lime" />
          <div className="text-[13px] font-medium leading-5 text-mute">
            <span className="font-bold text-fg">{FEATURE_LABEL[feature]}</span> sont réservés aux membres Premium.
          </div>
        </div>
      )}

      {trial && (
        <div className="rounded-[20px] bg-lime/15 p-3 text-center text-[13px] font-semibold text-lime">
          Essai gratuit : tout est ouvert encore {trialDays} jour{trialDays > 1 ? 's' : ''}
        </div>
      )}

      <div className="text-center">
        <div className="num text-[34px] font-extrabold leading-10 text-fg">{price}</div>
        <div className="text-[13px] font-medium text-mute">
          par mois · sans engagement
          {account && account.discountPct > 0 && ` · remise de performance −${account.discountPct} % (au lieu de ${fcfa(PREMIUM_PRICE_FCFA)})`}
        </div>
      </div>

      <ul className="space-y-3">
        {PREMIUM_BENEFITS.map((b) => (
          <li key={b.id} className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-lime" />
            <div>
              <div className="text-[14px] font-bold leading-5 text-fg">{b.title}</div>
              <div className="text-[12px] font-medium leading-4 text-mute">{b.desc}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="text-[12px] font-medium text-faint">Toujours gratuit : ton coach personnel, les séances guidées, le suivi, le classement et le Réseau.</div>

      {step === 'offer' && (
        <Button
          fullWidth
          onClick={async () => {
            setHosted((await getPaymentConfig()).hostedCheckout);
            setStep('pay');
          }}
        >
          Passer Premium · {price}
        </Button>
      )}

      {(step === 'pay' || step === 'wait') && needsAccount && (
        <div className="space-y-3">
          <div className="text-[14px] font-bold text-fg">{mode === 'register' ? 'Crée ton compte DEK' : 'Connecte-toi'}</div>
          <div className="text-[12px] font-medium text-mute">Ton abonnement et tes XP sont rattachés à ton compte : tu les retrouves sur un nouveau téléphone.</div>
          {mode === 'register' && (
            <input type="text" autoComplete="name" placeholder="Ton prénom" value={accountName} disabled={step === 'wait'} onChange={(e) => setAccountName(e.target.value)} className={FIELD} />
          )}
          <input type="tel" inputMode="tel" autoComplete="tel" placeholder="Ton numéro (ex. 6 70 12 34 56)" value={phone} disabled={step === 'wait'} onChange={(e) => setPhone(e.target.value)} className={FIELD} />
          <input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="Mot de passe (6 caractères minimum)" value={password} disabled={step === 'wait'} onChange={(e) => setPassword(e.target.value)} className={FIELD} />
          {error && (
            <div role="alert" className="flex items-start gap-2 text-[13px] font-medium text-danger">
              <Warning className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Button fullWidth disabled={step === 'wait'} onClick={() => void submitAccount()}>
            {step === 'wait' ? 'Un instant…' : mode === 'register' ? 'Créer mon compte' : 'Me connecter'}
          </Button>
          <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(null); }} className="w-full text-center text-[13px] font-semibold text-mute">
            {mode === 'register' ? 'J’ai déjà un compte' : 'Créer un compte'}
          </button>
        </div>
      )}

      {(step === 'pay' || step === 'wait') && !needsAccount && (
        <div className="space-y-3">
          <div className={hosted ? 'hidden' : 'grid grid-cols-2 gap-2'} role="radiogroup" aria-label="Opérateur Mobile Money">
            {OPERATORS.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={operator === o.id}
                disabled={step === 'wait'}
                onClick={() => setOperator(o.id)}
                className={`h-12 rounded-2xl text-[14px] font-bold transition active:scale-95 ${operator === o.id ? 'bg-lime text-on-lime' : 'bg-tile text-fg'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Numéro Mobile Money (ex. 6 70 12 34 56)"
            value={phone}
            disabled={step === 'wait'}
            onChange={(e) => {
              setPhone(e.target.value);
              const g = guessOperator(normalizePhone(e.target.value) ?? '');
              if (g) setOperator(g);
            }}
            className={FIELD}
          />
          {hosted && (
            <>
              <input
                type="text"
                autoComplete="name"
                placeholder="Ton nom (facultatif)"
                value={name}
                disabled={step === 'wait'}
                onChange={(e) => setName(e.target.value)}
                className={FIELD}
              />
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Ton e-mail (pour le reçu)"
                value={email}
                disabled={step === 'wait'}
                onChange={(e) => setEmail(e.target.value)}
                className={FIELD}
              />
            </>
          )}
          {error && (
            <div role="alert" className="flex items-start gap-2 text-[13px] font-medium text-danger">
              <Warning className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Button fullWidth disabled={step === 'wait'} onClick={() => void submit()}>
            {step === 'wait' ? (hosted ? 'Termine sur la page de paiement…' : 'Valide sur ton téléphone…') : hosted ? `Payer ${price} en ligne` : `Payer ${price}`}
          </Button>
          <div className="text-center text-[12px] font-medium text-faint">
            {!PAYMENTS_LIVE ? 'Mode démo : le paiement est simulé, aucun argent n’est débité.' : hosted ? 'Une page de paiement sécurisée s’ouvre : choisis Mobile Money, paie, puis reviens ici.' : 'Tu vas recevoir une demande de validation sur ton téléphone (code secret).'}
          </div>
        </div>
      )}
    </div>
  );
}

/** À monter une seule fois (dans App) : affiche l'écran d'abonnement quand `openPaywall()` est appelé. */
export function PremiumHost() {
  const req = usePaywall();
  return (
    <BottomSheet
      open={req !== null}
      onClose={closePaywall}
      title={
        <span className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-lime" /> DEK Premium
        </span>
      }
    >
      {req && <PaywallBody key={`${req.feature ?? 'general'}`} feature={req.feature} />}
    </BottomSheet>
  );
}

/** Contenu réservé : affiche `children` si Premium, sinon une carte « Débloquer ». */
export function PremiumGate({ feature, title, children }: { feature: PremiumFeature; title?: string; children: ReactNode }) {
  const { active } = usePremium();
  if (active) return <>{children}</>;
  const price = fcfa(PREMIUM_PRICE_FCFA);
  return (
    <div className="space-y-4 rounded-[28px] bg-card p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tile text-lime">
        <Lock className="h-7 w-7" />
      </div>
      <div>
        <div className="text-[18px] font-bold leading-6 text-fg">{title ?? FEATURE_LABEL[feature]}</div>
        <div className="mt-1 text-[13px] font-medium leading-5 text-mute">Réservé aux membres Premium · {price} / mois.</div>
      </div>
      <Button fullWidth onClick={() => openPaywall(feature)}>
        Débloquer avec Premium
      </Button>
    </div>
  );
}
