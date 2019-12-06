// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import Quest from './quest';

window.addEventListener('load',function(){
    var game = new Phaser.Game(1280, 1280, Phaser.AUTO);
    game.state.add('Game', Quest, true);
    window.game = game;
});