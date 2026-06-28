import Phaser from 'phaser';

/**
 * Minimal boot scene. No external assets are loaded for the MVP (placeholders
 * are drawn procedurally), so this simply hands off to the apartment scene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    this.scene.start('apartment');
  }
}
