// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import config from './config';

/**
 * A graphical element displaying the Bloch sphere
 * labeled with the measurement gates that the player
 * can pass through when the diagram's arrow points in
 * that direction
 *
 * @export
 * @class Bloch
 * @extends {Phaser.Group}
 */
export default class Bloch extends Phaser.Group {

    constructor(){
        super(...arguments);
        this.blochDiagramContainer = null;
        this.blochDiagram = null;
        this.labels = {
            xread:null,
            yread:null,
            zread:null,
        };
    }
    
    /**
     * Create a Bloch sphere diagram
     *
     * @static
     * @param {Phaser.State} state
     * @param {object} [options={}]
     * @param {Phaser.Game} [options.game]
     * @param {Phaser.Group} [options.group] parent
     * @returns {Bloch}
     * @memberof Bloch
     */
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;

        const bloch = group.add(new Bloch(game));

        bloch.blochDiagramContainer = game.add.group(bloch);
    
        bloch.blochDiagram = game.add.image(44,44,'qbloch',0,bloch.blochDiagramContainer);
        bloch.blochDiagram.crop(new Phaser.Rectangle(107,95,288,285));
    
        bloch.labels.xread = game.add.image(54,240,'spritesheet',config.frames.readX, bloch);
        bloch.labels.yread = game.add.image(316,198,'spritesheet',config.frames.readY, bloch);
        bloch.labels.zread = game.add.image(156,0,'spritesheet',config.frames.readZ, bloch);

        return bloch;
    }
 
    /**
     * Reloads Bloch texture when quantum state changes
     *
     * @memberof Bloch
     */
    reloadTexture(){
        this.blochDiagram.loadTexture('qbloch');
    }
}