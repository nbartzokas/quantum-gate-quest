// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

/**
 * A graphical element displaying the quantum circuit
 *
 * @export
 * @class Circuit
 * @extends {Phaser.Group}
 */
export default class Circuit extends Phaser.Group {

    constructor(){
        super(...arguments);
        this.circuitDiagram = null;
    }
    
    /**
     * Create a Circuit diagram
     *
     * @static
     * @param {Phaser.State} state
     * @param {object} [options={}]
     * @param {Phaser.Game} [options.game]
     * @param {Phaser.Group} [options.group] parent
     * @returns {Circuit}
     * @memberof Circuit
     */
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;

        const circuit = group.add(new Circuit(game));
        circuit.circuitDiagram = game.add.image(0,0,'qcircuit',0,circuit);
        // diagrams can get quite wide, so for now, shrink to fit
        // TODO: handle more gracefully, and extract that magic number
        circuit.circuitDiagram.width = circuit.circuitDiagram.width > 700 ? 700 : circuit.circuitDiagram.width;

        return circuit;
    }

    /**
     * Reloads Circuit texture when quantum state changes
     *
     * @memberof Circuit
     */
    reloadTexture(){
        this.circuitDiagram.loadTexture('qcircuit');
        // diagrams can get quite wide, so for now, shrink to fit
        // TODO: handle more gracefully, and extract that magic number
        this.circuitDiagram.width = this.circuitDiagram.width > 700 ? 700 : this.circuitDiagram.width;
    }
}