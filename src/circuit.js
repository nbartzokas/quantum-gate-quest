// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

export default class Circuit extends Phaser.Group {
    constructor(){
        super(...arguments);
        this.circuitDiagram = null;
    }
    
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;

        const circuit = group.add(new Circuit(game));
        circuit.circuitDiagram = game.add.image(0,0,'qcircuit',0,circuit);
        // circuit.circuitDiagram.crop(new Phaser.Rectangle(96,0,1000,1000));

        return circuit;
    }

    reloadTexture(){
        this.circuitDiagram.loadTexture('qcircuit');
    }
}