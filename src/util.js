// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

export default {

    // Phaser utilities

    /**
     * Maps a Phaser directional constant to a string description, for debugging purposes
     *
     * @param {Phaser.NONE|Phaser.LEFT|Phaser.RIGHT|Phaser.UP|Phaser.DOWN} dir Phaser directional constant
     * @returns
     */
    dirToString(dir){
        return dir === Phaser.NONE ? 'NONE' :
               dir === Phaser.LEFT ? 'LEFT' :
               dir === Phaser.RIGHT ? 'RIGHT' :
               dir === Phaser.UP ? 'UP' :
               dir === Phaser.DOWN ? 'DOWN' :
               '';
    },

    /**
     * Given a Phaser directional constant, returns the opposite direction. NONE returns NONE.
     *
     * @param {Phaser.NONE|Phaser.LEFT|Phaser.RIGHT|Phaser.UP|Phaser.DOWN} tile Phaser directional constant
     * @returns {Phaser.NONE|Phaser.LEFT|Phaser.RIGHT|Phaser.UP|Phaser.DOWN} opposite direction
     */
    tileOpposite(tile){
        const opposites = [ Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP ];
        return opposites[tile];
    },

};