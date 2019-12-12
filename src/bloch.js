// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import config from './config';
import FilterRemoveWhite from './filterRemoveWhite';

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
    
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;

        const bloch = group.add(new Bloch(game));

        bloch.blochDiagramContainer = game.add.group(bloch);
    
        bloch.blochDiagram = game.add.image(44,44,'qbloch',0,bloch.blochDiagramContainer);
        bloch.blochDiagram.crop(new Phaser.Rectangle(107,95,288,285));
        // bloch.filter = ;
        // bloch.filter.setResolution(config.game.width, config.game.height);
        bloch.blochDiagram.filters = [ new FilterRemoveWhite(bloch, {
            edge0:0.0,
            edge1:0.95
        }) ];
    
        bloch.labels.xread = game.add.image(54,240,'spritesheet',config.icons.readX, bloch);
        bloch.labels.yread = game.add.image(316,198,'spritesheet',config.icons.readY, bloch);
        bloch.labels.zread = game.add.image(156,0,'spritesheet',config.icons.readZ, bloch);

        return bloch;
    }

    reloadTexture(){
        this.blochDiagram.loadTexture('qbloch');
    }
}