// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

/**
 * Animated sprite that plays when player walks over a gate
 *
 * @export
 * @class Burst
 * @extends {Phaser.Sprite}
 */
export default class Burst extends Phaser.Sprite {

    /**
     * Create a Burst sprite
     *
     * @static
     * @param {Phaser.State} state
     * @param {object} [options={}]
     * @param {Phaser.Game} [options.game]
     * @param {Phaser.Group} [options.group] parent
     * @param {object} [options.sprite] Phaser.Sprite settings
     * @param {array} [options.animations] array of Phaser.Animation settings
     * @param {string} [options.audio] audio asset key
     * @returns {Burst}
     * @memberof Burst
     */
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;

        // sprite
        const burst = group.add(new Burst(game, options.sprite.x, options.sprite.y, options.sprite.key, options.sprite.frame));
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

    /**
     * Play burst's animation and sound
     *
     * @memberof Burst
     */
    play(){
        super.play('burst');
        this.sound.play();
    }

    /**
     * Play burst's animation and sound, killing on completion
     *
     * @memberof Burst
     */
    playAndKill(){
        super.play('burst',null,false,true);
        this.sound.play();
    }

}