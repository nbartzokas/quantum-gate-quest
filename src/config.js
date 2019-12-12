// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

const GRID_SIZE = 64;

export default Object.freeze({

    // phaser-ce game
    // see: https://photonstorm.github.io/phaser-ce/Phaser.Game.html
    game:{
        width: 1088,
        height: 1088,
        renderer: Phaser.AUTO,
        antialias: true,
        multiTexture: true,
        transparent: true,
    },

    scale: {
        scaleMode: Phaser.ScaleManager.SHOW_ALL,
        pageAlignHorizontally: true,
        pageAlignVertically: true,
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
        turnThreshold: GRID_SIZE / 2,
    },

    burst:{
        sprite:{
            key: 'burst',
            anchor: 0.5,
            x: 0, 
            y: 0,
            width: 256,
            height: 256,
            tint: 0xffffff,
        },
        animations:[
            { name: 'burst' },
        ],
        audio:'burst_sound',
    },

    score: {
        x:0,
        y:5000, 
        text:'Score: ',
        style: {
            font: '65px Arial',
            fill: '#ff0044',
            align: 'left'
        }
    },

    tiles:{
        empty: [-1,0],
        wall: 19,
        gate: 12,
        read: 52,
    },

    frames:{
        wall: 5,
        gate: 11,
        read: 51,
    },

    icons:{
        readX: 25,
        readY: 38,
        readZ: 51,
    },

    colors:{
        blue:0x30b0ff,
        lightgreen:0x20d5d2,
        pink:0xee538b,
        green:0x007d79,
        purple:0x924cfc,
        black:0x202529,
        orange:0xd54d20,
        yellow:0xfcc74c,
        brightgreen:0xb6fc4c,
        red:0xd54d20,
        blochred:0xcf518a,
    }

});