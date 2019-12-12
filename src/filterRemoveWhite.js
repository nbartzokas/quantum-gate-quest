// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import frag from 'raw-loader!./filterRemoveWhite.frag';

export default class FilterRemoveWhite extends Phaser.Filter{

    constructor(game,{ edge0=0.0, edge1=1.0 }={}){
        super(game);
        this.uniforms.edge0 = { type: '1f', value: edge0 };
        this.uniforms.edge1 = { type: '1f', value: edge1 };
        this.fragmentSrc = frag.split('\n');
    }

    get edge0() {
        return this.uniforms.edge0.value;
    }

    set edge0(value) {
        this.uniforms.edge0.value = value;
    }

    get edge1() {
        return this.uniforms.edge1.value;
    }

    set edge1(value) {
        this.uniforms.edge1.value = value;
    }
}