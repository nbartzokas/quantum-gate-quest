// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import config from './config';
import util from './util';

/**
 * Player sprite
 *
 * @export
 * @class Player
 * @extends {Phaser.Sprite}
 */
export default class Player extends Phaser.Sprite {
    constructor(){
        super(...arguments);

        this.speed = config.player.speed;
        this.currentDirection = Phaser.NONE;
        this.turnPoint = new Phaser.Point(); // center point of tile player is turning to
        this.turnThreshold = config.player.turnThreshold; // fuzziness threshold for testing when player aligns with turnpoint
        this.nearestTile = new Phaser.Point();
        this.adjacentTiles = [ null, null, null, null, null ];
        this.options = null;
    }

    /**
     * Create Player sprite
     *
     * @static
     * @param {Phaser.State} state
     * @param {object} [options={}]
     * @param {Phaser.Game} [options.game]
     * @param {Phaser.Group} [options.group] parent
     * @param {object} [options.sprite] Phaser.Sprite settings
     * @param {array} [options.animations] array of Phaser.Animation settings
     * @param {boolean} [options.physics] activate physics?
     * @param {number} [options.speed] movement speed
     * @param {number} [options.turnThreshold] close enough to turn
     * @returns {Player}
     * @memberof Player
     */
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;

        // sprite
        const player = group.add(new Player(game, options.sprite.x, options.sprite.y, options.sprite.key, options.sprite.frame));
        player.anchor.set(options.sprite.anchor);
        player.options=options;

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
        player.turnThreshold = options.turnThreshold;

        // TODO: decouple
        player.map = options.map;
        player.layerWalls = options.layerWalls;

        return player;

    }

    /**
     * Reset player to starting position
     *
     * @memberof Player
     */
    reset(){
        this.position.set(this.options.sprite.x,this.options.sprite.y);
    }

    /**
     * Receives direction key input and moves player around on the map
     *
     * @param {array} activeDirections ordered list of active directional inputs
     * @memberof Player
     */
    control(activeDirections){

        this.setNearestTile();
        this.setAdjacentTiles();
        
        // no active directions, stop
        if (activeDirections.length===0){
            if (this.currentDirection!==Phaser.NONE){
                // console.debug('update: no active direction so stopping');
                this.stop();
            }
        }

        // one active direction, move
        else if (activeDirections.length===1){
            const direction = activeDirections[0];

            // if direction is new
            if (this.currentDirection!==direction){
                // console.debug('update: one active direction',util.dirToString(direction));

                // if direction is not blocked, align with walls in that direction
                if (this.checkDirection(direction)){
                    // console.debug('update: active direction is not blocked, aligning');
                    this.turn(direction);
                }

                // move even if that direction is blocked so that player can move closer to wall until collision
                this.move(direction);
            }
        }
        
        // two+ active directions
        else if (activeDirections.length>1){
            const turning = activeDirections[0]; // where player wants to turn
            const direction = activeDirections[1]; // last known valid direction traveling
            
            // if not already moving in turning direction
            if (this.currentDirection!==turning){
                // console.debug('update: two+ active directions, turning:',util.dirToString(turning),', direction:',util.dirToString(direction));

                // if player is ready to turn
                if (this.checkDirection(turning)){
                    // console.debug('update: active turning direction is not blocked, aligning');

                    // turn
                    this.turn(turning);

                    // move
                    this.move(turning);

                }
                
                // if player isn't ready to turn, and isn't already traveling, move
                else if (this.currentDirection!==direction){
                    // console.debug('update: active turning direction is blocked, moving in secondary direction');

                    this.move(direction);
                }
            }
        }
    }

    /**
     * Moves player in a direction on the map, playing walking animation, 
     * and setting direction property
     *
     * @param {Phaser.LEFT|Phaser.RIGHT|Phaser.UP|Phaser.DOWN} direction Phaser directional constant
     * @memberof Player
     */
    move(direction) {
        // console.debug('[player] move', util.dirToString(direction) );

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

    /**
     * Stop player movement and walk animation
     *
     * @memberof Player
     */
    stop() {
        // console.debug('[player] stop');
        this.body.velocity.set(0);
        this.currentDirection=Phaser.NONE;
        this.animations.stop(null,true);
    }

    /**
     * Checks whether a turn is possible, in other words that the player is within turnThreshold of an empty tile
     *
     * @param {Phaser.LEFT|Phaser.RIGHT|Phaser.UP|Phaser.DOWN} turnTo Phaser direction to turn towards
     * @returns {boolean} whether or not a turn is possible
     * @memberof Player
     */
    turn(turnTo) {
        // console.debug('[player] attempting turn', util.dirToString(turnTo));

        this.setTurnPoint();

        var cx = Math.floor(this.x);
        var cy = Math.floor(this.y);

        // console.debug(cx, this.turnPoint.x, this.turnThreshold, cy, this.turnPoint.y, this.turnThreshold);
        if (!this.game.math.fuzzyEqual(cx, this.turnPoint.x, this.turnThreshold) || 
            !this.game.math.fuzzyEqual(cy, this.turnPoint.y, this.turnThreshold) ){
            return false;
        }

        // console.debug('[player] turning to', util.dirToString(turnTo));

        //  Grid align before turning
        if (turnTo===Phaser.LEFT||turnTo===Phaser.RIGHT){
            this.y = this.turnPoint.y;
            this.body.reset(this.turnPoint.x, this.y);

        }else if (turnTo===Phaser.UP||turnTo===Phaser.DOWN){
            this.x = this.turnPoint.x;
            this.body.reset(this.turnPoint.x, this.y);
        }

        return true;

    }

    /**
     * Set pixel coordinates of the center point of the tile nearest the player
     *
     * @memberof Player
     */
    setTurnPoint(){
        this.turnPoint.x = (this.nearestTile.x * config.gridsize) + (config.gridsize / 2);
        this.turnPoint.y = (this.nearestTile.y * config.gridsize) + (config.gridsize / 2);
        // console.debug('[player] setTurnPoint',this.turnPoint,this.nearestTile)
    }

    /**
     * Set the coordinates (in number of tiles) of the tile nearest the player
     *
     * @memberof Player
     */
    setNearestTile(){
        this.nearestTile.x = this.game.math.snapToFloor(Math.floor(this.x), config.gridsize) / config.gridsize;
        this.nearestTile.y = this.game.math.snapToFloor(Math.floor(this.y), config.gridsize) / config.gridsize;
    }

    /**
     * Fill `adjacentTiles` object with all tiles adjacent to the one nearest the player
     *
     * @memberof Player
     */
    setAdjacentTiles(){
        this.adjacentTiles[Phaser.LEFT]  = this.map.getTileLeft(this.layerWalls.index, this.nearestTile.x, this.nearestTile.y);
        this.adjacentTiles[Phaser.RIGHT] = this.map.getTileRight(this.layerWalls.index, this.nearestTile.x, this.nearestTile.y);
        this.adjacentTiles[Phaser.UP]    = this.map.getTileAbove(this.layerWalls.index, this.nearestTile.x, this.nearestTile.y);
        this.adjacentTiles[Phaser.DOWN]  = this.map.getTileBelow(this.layerWalls.index, this.nearestTile.x, this.nearestTile.y);
    }

    /**
     * Check whether player can move in a direction
     *
     * @param {Phaser.LEFT|Phaser.RIGHT|Phaser.UP|Phaser.DOWN} turnTo Phaser direction to turn towards
     * @returns {boolean} true if player can move in that direction
     * @memberof Player
     */
    checkDirection(turnTo) {

        if (this.adjacentTiles[turnTo] === null){
            // console.debug('[player] checkDirection: no valid tile that way', util.dirToString(turnTo), this.adjacentTiles[turnTo] );
            return false;
        }

        else if ( config.tiles.empty.indexOf(this.adjacentTiles[turnTo].index) === -1 ){
            // console.debug('[player] checkDirection: no floor tile that way', util.dirToString(turnTo), this.adjacentTiles[turnTo] );
            return false;
        }

        else if (this.currentDirection === util.tileOpposite(turnTo)){
            // console.debug('[player] checkDirection: permitting turn around', util.dirToString(turnTo), this.adjacentTiles[turnTo] );
            return true;
        }

        else{
            // console.debug('[player] checkDirection: permitting turn', util.dirToString(turnTo), this.adjacentTiles[turnTo] );
            return true;
        }

    }

}