// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

export default class Score extends Phaser.Text{
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;
        const score = group.add(new Score(game, options.x, options.y, options.text, options.style));
        score.prefix = options.prefix || options.text;
        return score;
    }
    constructor(){
        super(...arguments);
        this._value = 0;
    }
    get value(){
        return this._value;
    }
    set value(v){
        this._value=v;
        this.setText(this.toString());
    }
    toString(){
        return this.prefix+this._value;
    }
};