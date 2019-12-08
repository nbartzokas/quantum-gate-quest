// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

export default class Player extends Phaser.Sprite {
    static create(game,options){

        // sprite
        const player = game.add.sprite(options.sprite.x, options.sprite.y, options.sprite.key, options.sprite.frame);
        player.anchor.set(options.sprite.anchor);

        // animations
        if (options.animations && options.animations.constructor === Array){
            for (let animation of options.animations){
                player.animations.add(animation.name, animation.frames, animation.frameRate, animation.loop);
            }
        }

        // physics
        if (options.physics){
            game.physics.arcade.enable(player);
        }

        return player;

    }
}