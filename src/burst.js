// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import config from './config';

export default class Burst extends Phaser.Sprite {

    static create(state,options){

        // sprite
        const burst = state.world.add(new Burst(state.game, options.sprite.x, options.sprite.y, options.sprite.key, options.sprite.frame));
        burst.anchor.set(options.sprite.anchor);
        burst.width = options.sprite.width;
        burst.height = options.sprite.height;
        burst.tint = options.sprite.tint;

        // animations
        if (options.animations && options.animations.constructor === Array){
            for (let animation of options.animations){
                burst.animations.add(animation.name, animation.frames, animation.frameRate, animation.loop);
            }
        }

        // audio
        if (options.audio){
            burst.sound = game.add.audio(options.audio);
        }

        return burst;

    }

    play(){
        super.play('burst');
        this.sound.play();
    }

}