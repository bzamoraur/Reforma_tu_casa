import './styles.css';
import { SpatialController } from '../game/systems/spatial-controller';
import { SpatialUIController } from '../game/ui/spatial-ui';

function bootstrap(): void {
  const uiRoot = document.getElementById('ui-root');
  const gameRoot = document.getElementById('game-root');
  if (!uiRoot) {
    throw new Error('Missing #ui-root mount point');
  }

  // The room-by-room game (ADR-0006) is an accessible HTML/CSS overlay so it is
  // e2e-testable; the room art is illustrated layers swapped on transform.
  const controller = new SpatialController();
  new SpatialUIController(uiRoot, controller).start();

  // Phaser is loaded lazily as a decorative backdrop only (ADR-0006:
  // dynamic-import so it never blocks first paint). Any failure is non-fatal.
  if (gameRoot) {
    void import('../game/scenes/ambient')
      .then(({ startAmbient }) => startAmbient(gameRoot))
      .catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
