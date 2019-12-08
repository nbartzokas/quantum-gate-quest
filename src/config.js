// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

const GRID_SIZE = 64;

export default {

    // phaser-ce game
    // see: https://photonstorm.github.io/phaser-ce/Phaser.Game.html
    game:{
        width: 2560,
        height: 1280,
        renderer: Phaser.AUTO,
        antialias: true,
        multiTexture: true,
    },

    gridsize: GRID_SIZE,

    player:{
        startPoint: {
            x: 1.5 * GRID_SIZE, 
            y: 7.5 * GRID_SIZE
        },
        speed: 200,
    },

    tiles:{
        empty: [-1,0],
        wall: 4,
        gate: 75,
        read: 41,
    },

};