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
import { OPERATORS, PAYMENTS_LIVE, guessOperator, normalizePhone, payPremium, type Operator } from '../../utils/payments';

const FIELD =
  'h-12 w-full rounded-2xl bg-tile px-4 text-[14px] font-medium text-fg outline-none placeholder:text-faint focus:ring-1 focus:ring-lime';

const price = `${PREMIUM_PRICE_FCFA.toLocaleString('fr-FR')} FCFA`;

type Step = 'offer' | 'pay' | 'wait' | 'done';

function PaywallBody({ feature }: { feature: PremiumFeature | null }) {
  const { active, days } = usePremium();
  const [step, setStep] = useState<Step>(active ? 'done' : 'offer');
  const [operator, setOperator] = useState<Operator>('mtn');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  const submit = async () => {
    const local = normalizePhone(phone);
    if (!local) {
      setError('Numéro invalide : 9 chiffres commençant par 6 (ex. 6 70 12 34 56).');
      return;
    }
    setError(null);
    setStep('wait');
    const res = await payPremium({ operator, phone: local, amount: PREMIUM_PRICE_FCFA });
    if (res.ok) {
      activatePremium({ operator, reference: res.reference, demo: res.demo });
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

      <div className="text-center">
        <div className="num text-[34px] font-extrabold leading-10 text-fg">{price}</div>
        <div className="text-[13px] font-medium text-mute">par mois · sans engagement</div>
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
        <Button fullWidth onClick={() => setStep('pay')}>
          Passer Premium · {price}
        </Button>
      )}

      {(step === 'pay' || step === 'wait') && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Opérateur Mobile Money">
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
          {error && (
            <div role="alert" className="flex items-start gap-2 text-[13px] font-medium text-danger">
              <Warning className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Button fullWidth disabled={step === 'wait'} onClick={() => void submit()}>
            {step === 'wait' ? 'Valide sur ton téléphone…' : `Payer ${price}`}
          </Button>
          <div className="text-center text-[12px] font-medium text-faint">
            {PAYMENTS_LIVE ? 'Tu vas recevoir une demande de validation sur ton téléphone (code secret).' : 'Mode démo : le paiement est simulé, aucun argent n’est débité.'}
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
