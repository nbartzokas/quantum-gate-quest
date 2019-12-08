// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import config from './config';
import util from './util';

export default class Player extends Phaser.Sprite {
    constructor(){
        super(...arguments);

        this.speed = config.player.speed;
        this.currentDirection = Phaser.NONE;
        this.turnPoint = new Phaser.Point(); // center point of tile player is turning to
        this.turnThreshold = config.player.turnThreshold; // fuzziness threshold for testing when player aligns with turnpoint
        this.nearestTile = new Phaser.Point();
        this.adjacentTiles = [ null, null, null, null, null ];
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
        player.turnThreshold = options.turnThreshold;

        // TODO: decouple
        player.map = options.map;
        player.layerWalls = options.layerWalls;

        return player;

    }

    update(){
        super.update(...arguments);
        this.setNearestTile();
        this.setAdjacentTiles();
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

    turn(turnTo) {
        console.debug('[player] attempting turn', util.dirToString(turnTo));

        this.setTurnPoint();

        var cx = Math.floor(this.x);
        var cy = Math.floor(this.y);

        console.debug(cx, this.turnPoint.x, this.turnThreshold, cy, this.turnPoint.y, this.turnThreshold);
        if (!this.game.math.fuzzyEqual(cx, this.turnPoint.x, this.turnThreshold) || 
            !this.game.math.fuzzyEqual(cy, this.turnPoint.y, this.turnThreshold) ){
            return false;
        }

        console.debug('[player] turning to', util.dirToString(turnTo));

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

    setTurnPoint(){
        this.turnPoint.x = (this.nearestTile.x * config.gridsize) + (config.gridsize / 2);
        this.turnPoint.y = (this.nearestTile.y * config.gridsize) + (config.gridsize / 2);
        console.debug('[player] setTurnPoint',this.turnPoint,this.nearestTile)
    }

    setNearestTile(){
        this.nearestTile.x = this.game.math.snapToFloor(Math.floor(this.x), config.gridsize) / config.gridsize;
        this.nearestTile.y = this.game.math.snapToFloor(Math.floor(this.y), config.gridsize) / config.gridsize;
    }

    setAdjacentTiles(){
        this.adjacentTiles[Phaser.LEFT]  = this.map.getTileLeft(this.layerWalls.index, this.nearestTile.x, this.nearestTile.y);
        this.adjacentTiles[Phaser.RIGHT] = this.map.getTileRight(this.layerWalls.index, this.nearestTile.x, this.nearestTile.y);
        this.adjacentTiles[Phaser.UP]    = this.map.getTileAbove(this.layerWalls.index, this.nearestTile.x, this.nearestTile.y);
        this.adjacentTiles[Phaser.DOWN]  = this.map.getTileBelow(this.layerWalls.index, this.nearestTile.x, this.nearestTile.y);
    }

    checkDirection(turnTo) {

        if (this.adjacentTiles[turnTo] === null){
            console.debug('[player] checkDirection: no valid tile that way', util.dirToString(turnTo), this.adjacentTiles[turnTo] );
            return false;
        }

        else if ( config.tiles.empty.indexOf(this.adjacentTiles[turnTo].index) === -1 ){
            console.debug('[player] checkDirection: no floor tile that way', util.dirToString(turnTo), this.adjacentTiles[turnTo] );
            return false;
        }

        else if (this.currentDirection === util.tileOpposite(turnTo)){
            console.debug('[player] checkDirection: permitting turn around', util.dirToString(turnTo), this.adjacentTiles[turnTo] );
            return true;
        }

        else{
            console.debug('[player] checkDirection: permitting turn', util.dirToString(turnTo), this.adjacentTiles[turnTo] );
            return true;
        }

    }

}