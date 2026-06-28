import Phaser from 'phaser';
import './styles.css';
import { ApartmentScene, apartmentSceneDesign } from '../game/scenes/apartment-scene';
import { BootScene } from '../game/scenes/boot-scene';
import { GameController } from '../game/systems/game-controller';
import { UIController } from '../game/ui/ui-controller';

function bootstrap(): void {
  const gameRoot = document.getElementById('game-root');
  const uiRoot = document.getElementById('ui-root');
  if (!gameRoot || !uiRoot) {
    throw new Error('Missing #game-root or #ui-root mount points');
  }

  // Phaser renders the apartment backdrop only; the interactive loop lives in
  // the HTML overlay (UIController) so it is accessible and e2e-testable.
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: gameRoot,
    backgroundColor: '#0e1726',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: apartmentSceneDesign.width,
      height: apartmentSceneDesign.height,
    },
    scene: [BootScene, ApartmentScene],
  });

  const controller = new GameController();
  const ui = new UIController(uiRoot, controller);
  ui.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
