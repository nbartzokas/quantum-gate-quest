// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

/**
 * Win screen
 *
 * @export
 * @class Win
 * @extends {Phaser.Group}
 */
export default class Win extends Phaser.Group {
    constructor(){
        super(...arguments);
        this.offset=0;
    }
    
    /**
     * Create a Win screen
     *
     * @static
     * @param {Phaser.State} state
     * @param {object} [options={}]
     * @param {Phaser.Game} [options.game]
     * @param {Phaser.Group} [options.group] parent
     * @returns
     * @memberof Win
     */
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;

        const win = group.add(new Win(game));
        win.offset = game.height;
        win.image = game.add.image(win.offset,0,'win',0,win);
        win.image.inputEnabled = true;
        win.image.events.onInputDown.add(win.hide,win)

        win.sound = game.add.audio('winsound');
        
        return win;
    }

    /**
     * Move above the fold
     */
    show(){
        this.image.x=0;
        this.sound.play();
    }

    /**
     * Move below the fold
     */
    hide(){
        this.image.x=this.offset;
    }

}