// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import util from './util';

export default class Player extends Phaser.Sprite {
    constructor(){
        super(...arguments);

        this.speed = 0;
        this.currentDirection = Phaser.NONE;
    }
    static create(state,options){

        // sprite
        const player = state.world.add(new Player(state.game, options.sprite.x, options.sprite.y, options.sprite.key, options.sprite.frame));
        player.anchor.set(options.sprite.anchor);

        // animations
        if (options.animations && options.animations.constructor === Array){
            for (let animation of options.animations){
                player.animations.add(animation.name, animation.frames, animation.frameRate, animation.loop);
            }
        }

        // physics
        if (options.physics){
            state.physics.arcade.enable(player);
        }

        player.speed = options.speed;

        return player;

    }

    move(direction) {
        console.debug('[player] move', util.dirToString(direction) );

        var speed = this.speed;

        if (direction === Phaser.LEFT || direction === Phaser.UP) {
            speed = -speed;
        }

        if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
            this.body.velocity.x = speed;
            this.body.velocity.y = 0;
        } else {
            this.body.velocity.x = 0;
            this.body.velocity.y = speed;
        }

        if (direction === Phaser.LEFT){
            this.play('walk-left');
        }
        else if (direction === Phaser.RIGHT){
            this.play('walk-right');
        }
        else if (direction === Phaser.UP){
            this.play('walk-up');
        }
        else if (direction === Phaser.DOWN){
            this.play('walk-down');
        }

        this.currentDirection = direction;

    }

    stop() {
        console.debug('[player] stop');
        this.body.velocity.set(0);
        this.currentDirection=Phaser.NONE;
        this.animations.stop(null,true);
    }

}