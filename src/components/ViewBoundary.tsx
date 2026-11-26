import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ArrowsClockwise, Warning } from './DekIcons';

interface ViewBoundaryProps {
  children: ReactNode;
  /** Change de valeur à chaque changement d'onglet pour réinitialiser l'erreur. */
  resetKey?: string;
}

interface ViewBoundaryState {
  error: Error | null;
  resetKey?: string;
}

/**
 * Filet de sécurité : si un module (ou son chargement différé hors-ligne) plante,
 * on affiche une carte de récupération au lieu d'un écran noir.
 */
export class ViewBoundary extends Component<ViewBoundaryProps, ViewBoundaryState> {
  state: ViewBoundaryState = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<ViewBoundaryState> {
    return { error };
  }

  static getDerivedStateFromProps(props: ViewBoundaryProps, state: ViewBoundaryState) {
    if (props.resetKey !== state.resetKey) {
      return { error: null, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[DEK] Erreur dans une vue :', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const isChunkError = /dynamically imported module|Failed to fetch|Importing a module script/i.test(
      this.state.error.message,
    );
    return (
      <div className="mt-6 rounded-3xl border border-[#FF2E54]/40 bg-[#19080C] p-4 text-center">
        <Warning weight="duotone" className="mx-auto h-9 w-9 text-[#FF2E54]" />
        <h3 className="font-hud mt-2 text-sm font-bold text-white">
          {isChunkError ? 'MODULE NON CHARGÉ' : 'OUPS, UN PROBLÈME'}
        </h3>
        <p className="mt-1 text-[11px] text-slate-300">
          {isChunkError
            ? 'Vérifie ta connexion internet puis réessaie.'
            : 'Cette section a rencontré une erreur. Ta progression est sauvegardée.'}
        </p>
        <button
          onClick={() => (isChunkError ? window.location.reload() : this.setState({ error: null }))}
          className="font-hud mx-auto mt-3 flex items-center gap-1.5 rounded-full bg-[#C8FF00] px-4 py-2 text-xs font-bold text-black"
        >
          <ArrowsClockwise weight="duotone" className="h-4 w-4" /> Réessayer
        </button>
      </div>
    );
  }
}
