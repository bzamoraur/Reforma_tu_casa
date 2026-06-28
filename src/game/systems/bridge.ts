/**
 * Tiny decoupling seam between the HTML/CSS UI overlay and the Phaser scene.
 *
 * The UI owns the interactive game flow (decisions, panels, scorecard); Phaser
 * renders the apartment backdrop. The UI calls `sceneBridge.setActiveRoom(i)`
 * to nudge the visuals; if the scene is not ready yet it is a harmless no-op.
 */
export interface SceneBridge {
  setActiveRoom(index: number): void;
}

export const sceneBridge: SceneBridge = {
  setActiveRoom: () => {
    /* no-op until the apartment scene registers itself */
  },
};
