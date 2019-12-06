// import config from './config';
import util from './util';

class Qubit {
    constructor(){
        this.x = [];
        this.y = [];
        this.z = [];
    }
    /**
     * Take a Z measurement
     * Because game needs this function to be synchronous,
     * z measurements are pre-computed during gate applications.
     * Read functions return a random measurement from the 
     * precomputed set.
     * @returns {number} measurement
     */
    zRead(){
        return this.z[Math.floor(Math.random()*this.z.length)];
    }
    /**
     * Apply an X-Gate to the qubit
     * @param {function} cb 
     * @returns {object} JSON response
     */
    xGate(cb){
        return fetch('/q/xgate').then(cb);
    }
};

var Quest = function (game) {

    this.qubit = null;

    this.map = null;
    this.layerFloor = null;
    this.layerWalls = null;
    this.layerGates = null;
    this.layerReads = null;
    this.player = null;

    this.gridsize = 64;

    this.tilesEmpty = [-1,0];
    this.tileWall = 4;
    this.tileGate = 75;
    this.tileRead = 41;

    this.tileOverlap = null;

    this.speed = 200;
    this.threshold = this.gridsize/2;

    this.marker = new Phaser.Point();
    this.turnPoint = new Phaser.Point();

    this.directions = [ null, null, null, null, null ];
    this.opposites = [ Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP ];

    this.currentDirection = Phaser.NONE;
    this.activeDirections = [];

};

Quest.prototype = {

    init: function () {

        this.qubit = new Qubit();

        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;

        Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);

        this.physics.startSystem(Phaser.Physics.ARCADE);

        window.quest = this; // expose for debugging 

    },

    preload: function () {
        
        this.load.spritesheet('burst', 'assets/sprites/burst.png', 100, 100);
        this.load.audio('burst_sound','assets/sounds/446145__justinvoke__freeze-hit.wav');

        this.load.spritesheet('powerup', 'assets/sprites/burst.png', 100, 100);
        this.load.audio('powerup_sound','assets/sounds/478342__joao-janz__bouncing-power-up-1-5.wav');

        this.load.spritesheet('spritesheet', 'assets/tiles/tilesheet.png', 64, 64);
        this.load.image('tiles', 'assets/tiles/tilesheet.png');
        this.load.tilemap('map', 'assets/maps/map.json', null, Phaser.Tilemap.TILED_JSON);

    },

    create: function () {

        this.map = this.add.tilemap('map');
        this.map.addTilesetImage('tileset', 'tiles');

        this.layerFloor = this.map.createLayer('floor');

        this.layerWalls = this.map.createLayer('walls');
        this.map.setCollisionByExclusion(this.tilesEmpty,true/*collides*/,this.layerWalls);

        this.layerGates = this.map.createLayer('gates');
        this.layerReads = this.map.createLayer('reads');

        this.gates = this.add.physicsGroup();
        this.map.createFromTiles(this.tileGate, -1, 'spritesheet', this.layerGates, this.gates);
        this.gates.children.forEach( tile=>{
            tile.frame=this.tileGate; // https://github.com/photonstorm/phaser/issues/2175
        });

        this.burst = this.add.sprite(0,0,'burst');
        this.burst.anchor.set(0.5);
        this.burst.tint = 0xffdd00;
        this.burst.width = 256;
        this.burst.height = 256;
        this.burst.animations.add('burst');
        this.burst.sound = game.add.audio('burst_sound');

        //  Position Player at grid location 14x17 (the +8 accounts for his anchor)
        this.player = this.add.sprite(10*this.gridsize, 10*this.gridsize, 'spritesheet', 66);
        this.player.anchor.set(0.5);
        this.player.animations.add('walk-left',  [94,95,94,96], 10, true);
        this.player.animations.add('walk-right', [91,92,91,93], 10, true);
        this.player.animations.add('walk-up',    [68,69,68,70], 10, true);
        this.player.animations.add('walk-down',  [65,66,65,67], 10, true);

        this.physics.arcade.enable(this.player);

        this.reads = this.add.physicsGroup();
        this.map.createFromTiles(this.tileRead, -1, 'spritesheet', this.layerReads, this.reads);
        this.reads.children.forEach( tile=>{
            tile.frame=this.tileRead; // https://github.com/photonstorm/phaser/issues/2175
            tile.body.immovable=true;
            tile.body.offset.set(5,5);
            tile.body.width-=10;
            tile.body.height-=10;
        });

        this.powerup = this.add.sprite(0,0,'powerup');
        this.powerup.anchor.set(0.5);
        this.powerup.tint = 0xff0000;
        this.powerup.width = 256;
        this.powerup.height = 256;
        this.powerup.animations.add('powerup');
        this.powerup.sound = game.add.audio('powerup_sound');

        this.cursors = this.input.keyboard.createCursorKeys();

        this.score = {
            value:0,
            toString: function(){ return 'Score: '+this.value; },
            text: game.add.text(0,0, 'Score: 0', {
                font: '65px Arial',
                fill: '#ff0044',
                align: 'left'
            }),
            update: function(){ this.text.setText(this.toString()); }
        };

    },

    getDirectionKeys: function() {
        const keysAndDirections = [
            [this.cursors.left,  Phaser.LEFT],
            [this.cursors.right, Phaser.RIGHT],
            [this.cursors.up,    Phaser.UP],
            [this.cursors.down,  Phaser.DOWN],
        ];
        for (let [key,direction] of keysAndDirections){
            const index = this.activeDirections.indexOf(direction);
            // if the key is down and not detected and stored yet, store it
            if (key.isDown && index===-1){
                this.activeDirections.splice(0,0,direction);
                console.debug('this.activeDirections',this.activeDirections);
            }
            // if the key is stored no longer down, remove it
            else if (!key.isDown && index!==-1){
                this.activeDirections.splice(index,1);
                console.debug('this.activeDirections',this.activeDirections);
            }
        }
        return this.activeDirections;
    },

    setMarker: function(){
        this.turnPoint.x = (this.marker.x * this.gridsize) + (this.gridsize / 2);
        this.turnPoint.y = (this.marker.y * this.gridsize) + (this.gridsize / 2);
    },

    checkDirection: function (turnTo) {

        if (this.directions[turnTo] === null){
            console.debug('checkDirection: no valid tile that way', util.dirToString(turnTo), this.directions[turnTo] );
            return false;
        }

        else if ( this.tilesEmpty.indexOf(this.directions[turnTo].index) === -1 ){
            console.debug('checkDirection: no floor tile that way', util.dirToString(turnTo), this.directions[turnTo] );
            return false;
        }

        else if (this.currentDirection === this.opposites[turnTo]){
            console.debug('checkDirection: permitting turn around', util.dirToString(turnTo), this.directions[turnTo] );
            return true;
        }

        else{
            console.debug('checkDirection: permitting turn', util.dirToString(turnTo), this.directions[turnTo] );
            return true;
        }

    },

    turn: function (turnTo) {
        console.debug('attempting turn',turnTo);

        var cx = Math.floor(this.player.x);
        var cy = Math.floor(this.player.y);

        //  This needs a threshold, because at high speeds you can't turn because the coordinates skip past
        console.debug(cx, this.turnPoint.x, this.threshold, cy, this.turnPoint.y, this.threshold);
        if (!this.math.fuzzyEqual(cx, this.turnPoint.x, this.threshold) || !this.math.fuzzyEqual(cy, this.turnPoint.y, this.threshold))
        {
            return false;
        }

        console.debug('turning',turnTo);

        //  Grid align before turning
        if (turnTo===Phaser.LEFT||turnTo===Phaser.RIGHT){
            this.player.y = this.turnPoint.y;
            this.player.body.reset(this.turnPoint.x, this.player.y);
        }else if (turnTo===Phaser.UP||turnTo===Phaser.DOWN){
            this.player.x = this.turnPoint.x;
            this.player.body.reset(this.turnPoint.x, this.player.y);
        }

        return true;

    },

    stopPlayer: function () {
        console.debug('stop');
        this.player.body.velocity.set(0);
        this.currentDirection=Phaser.NONE;
        this.player.animations.stop(null,true);
    },

    movePlayer: function (direction) {
        console.debug('move', util.dirToString(direction) );

        var speed = this.speed;

        if (direction === Phaser.LEFT || direction === Phaser.UP) {
            speed = -speed;
        }

        if (direction === Phaser.LEFT || direction === Phaser.RIGHT) {
            this.player.body.velocity.x = speed;
            this.player.body.velocity.y = 0;
        } else {
            this.player.body.velocity.x = 0;
            this.player.body.velocity.y = speed;
        }

        if (direction === Phaser.LEFT){
            this.player.play('walk-left');
        }
        else if (direction === Phaser.RIGHT){
            this.player.play('walk-right');
        }
        else if (direction === Phaser.UP){
            this.player.play('walk-up');
        }
        else if (direction === Phaser.DOWN){
            this.player.play('walk-down');
        }

        this.currentDirection = direction;

    },

    checkOverlap: function checkOverlap(spriteA, spriteB) {
        var boundsA = spriteA.getBounds();
        var boundsB = spriteB.getBounds();
        return Phaser.Rectangle.intersects(boundsA, boundsB);
    },

    handleOverlapGate: function (sprite,tile) {
        // console.log(sprite,tile);
        if (!this.tileOverlap){

            this.qubit.xGate()
            .then(this.qubit.zRead())
            .then(function(v){

                console.log(arguments);

                // this.player.tint = newZ * 0xff0000 || 0xffffff;
    
                // // move burst here and play
                // this.burst.x = tile.x + tile.width/2;
                // this.burst.y = tile.y + tile.height/2;
                // this.burst.play('burst');
                // this.burst.sound.play();

            });
    
            this.tileOverlap = tile;
        }
    },

    // TODO: these handlers smell like a component behavior for a tile overlap system
    handleOverlapRead: function (sprite,tile) {
        if (!this.tileOverlap){

            this.qubit.zRead(function(z){

                console.log(arguments);

                // console.log('readZ',z);
                // if (z===1){
                //     console.log('WIN POINT');
                //     // move powerup here and play
                //     this.powerup.x = tile.x + tile.width/2;
                //     this.powerup.y = tile.y + tile.height/2;
                //     this.powerup.play('powerup');
                //     this.powerup.sound.play();
                //     this.score.value += 1;
                //     this.score.update();
                // }else{
                //     console.log('LOSE POINT');
                //     this.score.value -= 1;
                //     this.score.update();
                // }
            });

            this.tileOverlap = tile;
        }
    },
    handleCollideRead: function (sprite,tile){
        return this.qubit.z===0;
    },

    update: function () {
        
        this.physics.arcade.collide(this.player, this.layerWalls, ()=>console.debug('bonk'));
        this.physics.arcade.collide(this.player, this.reads, null, this.handleCollideRead);

        if (this.tileOverlap && !this.checkOverlap(this.player, this.tileOverlap)) { this.tileOverlap = null; }
        this.physics.arcade.overlap(this.player, this.gates, this.handleOverlapGate, null, this);
        this.physics.arcade.overlap(this.player, this.reads, this.handleOverlapRead, null, this);

        this.marker.x = this.math.snapToFloor(Math.floor(this.player.x), this.gridsize) / this.gridsize;
        this.marker.y = this.math.snapToFloor(Math.floor(this.player.y), this.gridsize) / this.gridsize;

        //  Update our grid sensors
        this.directions[Phaser.LEFT]  = this.map.getTileLeft(this.layerWalls.index, this.marker.x, this.marker.y);
        this.directions[Phaser.RIGHT] = this.map.getTileRight(this.layerWalls.index, this.marker.x, this.marker.y);
        this.directions[Phaser.UP]    = this.map.getTileAbove(this.layerWalls.index, this.marker.x, this.marker.y);
        this.directions[Phaser.DOWN]  = this.map.getTileBelow(this.layerWalls.index, this.marker.x, this.marker.y);

        const activeDirections = this.getDirectionKeys();

        // no active directions, stop
        if (activeDirections.length===0){
            if (this.currentDirection!==Phaser.NONE){
                console.debug('update: no active direction so stopping');
                this.stopPlayer();
            }
        }

        // one active direction, move
        else if (activeDirections.length===1){
            const direction = activeDirections[0];

            // if direction is new
            if (this.currentDirection!==direction){
                console.debug('update: one active direction',util.dirToString(direction));

                // if direction is not blocked, align with walls in that direction
                if (this.checkDirection(direction)){
                    console.debug('update: active direction is not blocked, aligning');
                    this.setMarker();
                    this.turn(direction);
                }

                // move even if that direction is blocked so that player can move closer to wall until collision
                this.movePlayer(direction);
            }
        }
        
        // two+ active directions
        else if (activeDirections.length>1){
            const turning = activeDirections[0]; // where player wants to turn
            const direction = activeDirections[1]; // last known valid direction traveling
            
            // if not already moving in turning direction
            if (this.currentDirection!==turning){
                console.debug('update: two+ active directions, turning:',util.dirToString(turning),', direction:',util.dirToString(direction));

                // if player is ready to turn
                if (this.checkDirection(turning)){
                    console.debug('update: active turning direction is not blocked, aligning');

                    // turn
                    this.setMarker();
                    this.turn(turning);

                    // move
                    this.movePlayer(turning);

                }
                
                // if player isn't ready to turn, and isn't already traveling, move
                else if (this.currentDirection!==direction){
                    console.debug('update: active turning direction is blocked, moving in secondary direction');

                    this.movePlayer(direction);
                }
            }
        }
    }

};

export default Quest;