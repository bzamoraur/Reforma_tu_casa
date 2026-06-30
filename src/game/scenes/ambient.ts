/**
 * Lazy Phaser ambient backdrop (ADR-0006: Phaser is dynamic-imported so it never
 * blocks first paint). It draws a decorative placeholder behind the DOM game and
 * is entirely optional — the game is fully playable without it.
 */
export async function startAmbient(parent: HTMLElement): Promise<void> {
  const Phaser = (await import('phaser')).default;
  const { ApartmentScene, apartmentSceneDesign } = await import('./apartment-scene');
  const { BootScene } = await import('./boot-scene');

  new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#0e1726',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: apartmentSceneDesign.width,
      height: apartmentSceneDesign.height,
    },
    scene: [BootScene, ApartmentScene],
  });
}
