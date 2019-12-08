import config from './config';
import Player from './player';
import Qubit from './qubit';
import util from './util';

var Quest = function (game) {

    this.qubit = null;
    this.map = null;
    this.layerFloor = null;
    this.layerWalls = null;
    this.layerGates = null;
    this.layerReads = null;
    this.player = null;
    this.uiCircuit = null;
    this.uiBloch = null;

    this.tileOverlap = null; // holds any special tile the player is currently overlapping
    
    this.tileNearestPlayer = new Phaser.Point();
    this.turnPoint = new Phaser.Point(); // center point of tile player is turning to
    this.turnThreshold = config.gridsize / 2; // fuzziness threshold for testing when player aligns with turnpoint

    this.tilesAdjacentPlayer = [ null, null, null, null, null ];

    this.inputActiveDirections = [];

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

        // quantum ui
        this.load.image('qcircuit', 'draw.png?nocache='+Date.now(),true);
        this.load.image('qbloch', 'bloch.png?nocache='+Date.now(),true);

    },

    create: function () {

        this.map = this.add.tilemap('map');
        this.map.addTilesetImage('tileset', 'tiles');

        this.layerFloor = this.map.createLayer('floor');

        this.layerWalls = this.map.createLayer('walls');
        this.map.setCollisionByExclusion(config.tiles.empty,true/*collides*/,this.layerWalls);

        this.layerGates = this.map.createLayer('gates');
        this.layerReads = this.map.createLayer('reads');

        this.gates = this.add.physicsGroup();
        this.map.createFromTiles(config.tiles.gate, -1, 'spritesheet', this.layerGates, this.gates);
        this.gates.children.forEach( tile=>{
            tile.frame=config.tiles.gate; // https://github.com/photonstorm/phaser/issues/2175
        });

        this.burst = this.add.sprite(0,0,'burst');
        this.burst.anchor.set(0.5);
        this.burst.tint = 0xffdd00;
        this.burst.width = 256;
        this.burst.height = 256;
        this.burst.animations.add('burst');
        this.burst.sound = game.add.audio('burst_sound');

        this.player = Player.create( this, config.player );

        this.reads = this.add.physicsGroup();
        this.map.createFromTiles(config.tiles.read, -1, 'spritesheet', this.layerReads, this.reads);
        this.reads.children.forEach( tile=>{
            tile.frame=config.tiles.read; // https://github.com/photonstorm/phaser/issues/2175
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

        // q ui
        this.uiBloch = this.add.image(1280,0,'qbloch');
        this.uiCircuit = this.add.image(1280,480,'qcircuit');
        this.uiBloch_zread_label = this.add.image(1504,400,'spritesheet',config.tiles.read);

    },

    reloadDynamicAssets: function(){
        console.log('reloadDynamicAssets called');
        this.load.image('qcircuit', 'draw?nocache='+Date.now(),true);
        this.load.image('qbloch', 'bloch?nocache='+Date.now(),true);
        this.load.onLoadComplete.addOnce(()=>{
            console.log('reloadDynamicAssets load completed');
            // TODO: handle load failure
            // update q images 
            this.uiBloch.loadTexture('qbloch');
            this.uiCircuit.loadTexture('qcircuit');
        });
        this.load.start();
    },

    getDirectionKeys: function() {
        const keysAndDirections = [
            [this.cursors.left,  Phaser.LEFT],
            [this.cursors.right, Phaser.RIGHT],
            [this.cursors.up,    Phaser.UP],
            [this.cursors.down,  Phaser.DOWN],
        ];
        for (let [key,direction] of keysAndDirections){
            const index = this.inputActiveDirections.indexOf(direction);
            // if the key is down and not detected and stored yet, store it
            if (key.isDown && index===-1){
                this.inputActiveDirections.splice(0,0,direction);
                console.debug('this.inputActiveDirections',this.inputActiveDirections);
            }
            // if the key is stored no longer down, remove it
            else if (!key.isDown && index!==-1){
                this.inputActiveDirections.splice(index,1);
                console.debug('this.inputActiveDirections',this.inputActiveDirections);
            }
        }
        return this.inputActiveDirections;
    },

    setTurnPoint: function(){
        this.turnPoint.x = (this.tileNearestPlayer.x * config.gridsize) + (config.gridsize / 2);
        this.turnPoint.y = (this.tileNearestPlayer.y * config.gridsize) + (config.gridsize / 2);
    },

    checkDirection: function (turnTo) {

        if (this.tilesAdjacentPlayer[turnTo] === null){
            console.debug('checkDirection: no valid tile that way', util.dirToString(turnTo), this.tilesAdjacentPlayer[turnTo] );
            return false;
        }

        else if ( config.tiles.empty.indexOf(this.tilesAdjacentPlayer[turnTo].index) === -1 ){
            console.debug('checkDirection: no floor tile that way', util.dirToString(turnTo), this.tilesAdjacentPlayer[turnTo] );
            return false;
        }

        else if (this.player.currentDirection === util.tileOpposite(turnTo)){
            console.debug('checkDirection: permitting turn around', util.dirToString(turnTo), this.tilesAdjacentPlayer[turnTo] );
            return true;
        }

        else{
            console.debug('checkDirection: permitting turn', util.dirToString(turnTo), this.tilesAdjacentPlayer[turnTo] );
            return true;
        }

    },

    turn: function (turnTo) {
        console.debug('attempting turn',turnTo);

        var cx = Math.floor(this.player.x);
        var cy = Math.floor(this.player.y);

        console.debug(cx, this.turnPoint.x, this.turnThreshold, cy, this.turnPoint.y, this.turnThreshold);
        if (!this.math.fuzzyEqual(cx, this.turnPoint.x, this.turnThreshold) || !this.math.fuzzyEqual(cy, this.turnPoint.y, this.turnThreshold)){
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

    checkOverlap: function checkOverlap(spriteA, spriteB) {
        var boundsA = spriteA.getBounds();
        var boundsB = spriteB.getBounds();
        return Phaser.Rectangle.intersects(boundsA, boundsB);
    },

    handleOverlapGate: function (sprite,tile) {
        if (!this.tileOverlap){
    
            console.log('applying xGate');

            this.qubit.xGate(()=>{

                const z = this.qubit.zRead();

                console.log('done applying xGate, readZ',z);
    
                this.player.tint = z * 0xff0000 || 0xffffff;
    
                // move burst here and play
                this.burst.x = tile.x + tile.width/2;
                this.burst.y = tile.y + tile.height/2;
                this.burst.play('burst');
                this.burst.sound.play();

                this.reloadDynamicAssets();

            });

            this.tileOverlap = tile;
        }
    },

    // TODO: these handlers smell like a component behavior for a tile overlap system
    handleOverlapRead: function (sprite,tile) {
        if (!this.tileOverlap){

            const z = this.qubit.zRead();
            
            console.log('readZ',z);
            if (z===1){
                console.log('WIN POINT');
                // move powerup here and play
                this.powerup.x = tile.x + tile.width/2;
                this.powerup.y = tile.y + tile.height/2;
                this.powerup.play('powerup');
                this.powerup.sound.play();
                this.score.value += 1;
                this.score.update();
            }else{
                console.log('LOSE POINT');
                this.score.value -= 1;
                this.score.update();
            }

            this.tileOverlap = tile;
        }
    },
    handleCollideRead: function (sprite,tile){
        return this.qubit.zRead()===0;
    },

    update: function () {
        
        this.physics.arcade.collide(this.player, this.layerWalls, ()=>console.debug('bonk'));
        this.physics.arcade.collide(this.player, this.reads, null, this.handleCollideRead, this);

        if (this.tileOverlap && !this.checkOverlap(this.player, this.tileOverlap)) { this.tileOverlap = null; }
        this.physics.arcade.overlap(this.player, this.gates, this.handleOverlapGate, null, this);
        this.physics.arcade.overlap(this.player, this.reads, this.handleOverlapRead, null, this);

        this.tileNearestPlayer.x = this.math.snapToFloor(Math.floor(this.player.x), config.gridsize) / config.gridsize;
        this.tileNearestPlayer.y = this.math.snapToFloor(Math.floor(this.player.y), config.gridsize) / config.gridsize;

        //  Update our grid sensors
        this.tilesAdjacentPlayer[Phaser.LEFT]  = this.map.getTileLeft(this.layerWalls.index, this.tileNearestPlayer.x, this.tileNearestPlayer.y);
        this.tilesAdjacentPlayer[Phaser.RIGHT] = this.map.getTileRight(this.layerWalls.index, this.tileNearestPlayer.x, this.tileNearestPlayer.y);
        this.tilesAdjacentPlayer[Phaser.UP]    = this.map.getTileAbove(this.layerWalls.index, this.tileNearestPlayer.x, this.tileNearestPlayer.y);
        this.tilesAdjacentPlayer[Phaser.DOWN]  = this.map.getTileBelow(this.layerWalls.index, this.tileNearestPlayer.x, this.tileNearestPlayer.y);

        const activeDirections = this.getDirectionKeys();

        // no active directions, stop
        if (activeDirections.length===0){
            if (this.player.currentDirection!==Phaser.NONE){
                console.debug('update: no active direction so stopping');
                this.player.stop();
            }
        }

        // one active direction, move
        else if (activeDirections.length===1){
            const direction = activeDirections[0];

            // if direction is new
            if (this.player.currentDirection!==direction){
                console.debug('update: one active direction',util.dirToString(direction));

                // if direction is not blocked, align with walls in that direction
                if (this.checkDirection(direction)){
                    console.debug('update: active direction is not blocked, aligning');
                    this.setTurnPoint();
                    this.turn(direction);
                }

                // move even if that direction is blocked so that player can move closer to wall until collision
                this.player.move(direction);
            }
        }
        
        // two+ active directions
        else if (activeDirections.length>1){
            const turning = activeDirections[0]; // where player wants to turn
            const direction = activeDirections[1]; // last known valid direction traveling
            
            // if not already moving in turning direction
            if (this.player.currentDirection!==turning){
                console.debug('update: two+ active directions, turning:',util.dirToString(turning),', direction:',util.dirToString(direction));

                // if player is ready to turn
                if (this.checkDirection(turning)){
                    console.debug('update: active turning direction is not blocked, aligning');

                    // turn
                    this.setTurnPoint();
                    this.turn(turning);

                    // move
                    this.player.move(turning);

                }
                
                // if player isn't ready to turn, and isn't already traveling, move
                else if (this.player.currentDirection!==direction){
                    console.debug('update: active turning direction is blocked, moving in secondary direction');

                    this.player.move(direction);
                }
            }
        }
    }

};

export default Quest;