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
        sprite:{
            key: 'spritesheet',
            frame: 66,
            anchor: 0.5,
            // starting point
            x: 1.5 * GRID_SIZE, 
            y: 7.5 * GRID_SIZE,
        },
        animations:[
            { name: 'walk-left',  frames: [94,95,94,96], frameRate: 10, loop: true },
            { name: 'walk-right', frames: [91,92,91,93], frameRate: 10, loop: true },
            { name: 'walk-up',    frames: [68,69,68,70], frameRate: 10, loop: true },
            { name: 'walk-down',  frames: [65,66,65,67], frameRate: 10, loop: true },
        ],
        physics: true,
        speed: 200,
    },

    tiles:{
        empty: [-1,0],
        wall: 4,
        gate: 75,
        read: 41,
    },

};