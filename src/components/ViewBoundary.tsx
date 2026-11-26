import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/kit';

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
      <div className="mt-6 flex flex-col items-center rounded-[28px] bg-card p-6 text-center">
        <h3 className="text-[20px] font-bold leading-[26px] text-fg">
          {isChunkError ? 'Module non chargé' : 'Un problème est survenu'}
        </h3>
        <p className="mt-2 text-[14px] font-medium leading-5 text-mute">
          {isChunkError
            ? 'Vérifie ta connexion internet puis réessaie.'
            : 'Cette section a rencontré une erreur. Ta progression est sauvegardée.'}
        </p>
        <Button
          size="md"
          className="mt-5"
          onClick={() => (isChunkError ? window.location.reload() : this.setState({ error: null }))}
        >
          Réessayer
        </Button>
      </div>
    );
  }
}
