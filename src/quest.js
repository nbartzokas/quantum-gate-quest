// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import config from './config';
import Bloch from './bloch';
import Burst from './burst';
import Circuit from './circuit';
import Menu from './menu';
import Player from './player';
import Qubit from './qubit';
import Score from './score';

var Quest = function () {

    this.qubit = null;
    this.map = null;
    this.layerFloor = null;
    this.layerWalls = null;
    this.layerGates = null;
    this.layerReads = null;
    this.player = null;
    this.uiCircuit = null;
    this.uiBloch = null;
    this.music = null;

    this.tileOverlap = null; // holds any special tile the player is currently overlapping

    this.inputActiveDirections = [];

};

Quest.prototype = {

    init: function () {

        this.qubit = new Qubit();
        this.qubit.clear(); // TODO: use callback

        Object.assign(this.scale,config.scale);

        Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);

        this.physics.startSystem(Phaser.Physics.ARCADE);

        window.quest = this; // expose for debugging 

    },

    preload: function () {

        this.load.image('bg','assets/images/bg.png?nocache='+Date.now(),true);
        
        this.load.spritesheet('burst', 'assets/sprites/burst.png', 100, 100);
        this.load.audio('burst_sound','assets/sounds/446145__justinvoke__freeze-hit.wav');

        this.load.spritesheet('powerup', 'assets/sprites/burst.png', 100, 100);
        this.load.audio('powerup_sound','assets/sounds/478342__joao-janz__bouncing-power-up-1-5.wav');

        this.load.spritesheet('spritesheet', 'assets/tiles/tilesheet.png?nocache='+Date.now(), 64, 64);
        this.load.image('tiles', 'assets/tiles/tilesheet.png?nocache='+Date.now());
        this.load.tilemap('map', 'assets/maps/map.json?nocache='+Date.now(), null, Phaser.Tilemap.TILED_JSON);

        // quantum ui
        this.load.image('qcircuit', 'draw.png?nocache='+Date.now(),true);
        this.load.image('qbloch', 'bloch.png?nocache='+Date.now(),true);

        // background music
        this.load.audio('bgmusic', ['assets/sounds/Juhani Junkala [Chiptune Adventures] 1. Stage 1.ogg']);

        // ui icons
        this.load.spritesheet('icons','assets/sprites/icons.png?nocache='+Date.now(),50,50);

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
        this.map.createFromTiles(config.tiles.gate0, -1, 'spritesheet', this.layerGates, this.gates, { frame:config.frames.gate0 });
        this.map.createFromTiles(config.tiles.gateX, -1, 'spritesheet', this.layerGates, this.gates, { frame:config.frames.gateX });
        this.map.createFromTiles(config.tiles.gateH, -1, 'spritesheet', this.layerGates, this.gates, { frame:config.frames.gateH });
        this.map.createFromTiles(config.tiles.gateS, -1, 'spritesheet', this.layerGates, this.gates, { frame:config.frames.gateS });
        this.map.createFromTiles(config.tiles.gateT, -1, 'spritesheet', this.layerGates, this.gates, { frame:config.frames.gateT });
        this.map.createFromTiles(config.tiles.gateTdg, -1, 'spritesheet', this.layerGates, this.gates, { frame:config.frames.gateTdg });

        this.burst = Burst.create(this, config.burst);

        this.reads = this.add.physicsGroup();
        this.map.createFromTiles(config.tiles.readX, -1, 'spritesheet', this.layerReads, this.reads, {frame: config.frames.readX});
        this.map.createFromTiles(config.tiles.readY, -1, 'spritesheet', this.layerReads, this.reads, {frame: config.frames.readY});
        this.map.createFromTiles(config.tiles.readZ, -1, 'spritesheet', this.layerReads, this.reads, {frame: config.frames.readZ});
        this.reads.children.forEach( tile=>{
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
        this.powerup.sound = this.add.audio('powerup_sound');

        this.player = Player.create( this, Object.freeze(Object.assign({},config.player,{
            // TODO: decouple, perhaps with event system
            map: this.map,
            layerWalls: this.layerWalls,
        })));

        this.cursors = this.input.keyboard.createCursorKeys();

        this.score = Score.create(this, config.score);

        // q ui
        this.uiCircuit = Circuit.create(this);
        this.uiCircuit.position.set(0,300);

        this.uiBloch = Bloch.create(this);
        this.uiBloch.position.set(676,136);

        // backgroud music
        this.music = this.add.audio('bgmusic');
        this.music.loop=true;
        this.music.play();

        this.menu = Menu.create(this,config.menu);

        this.add.image(0,0,'bg');

    },

    reloadDynamicAssets: function(){
        this.load.image('qcircuit', 'draw?nocache='+Date.now(),true);
        this.load.image('qbloch', 'bloch?nocache='+Date.now(),true);
        this.load.onLoadComplete.addOnce(()=>{
            // TODO: handle load failure
            // TODO: smooth transition to new image
            // TODO: add animation to draw attention to the change?
            // update q images 
            this.uiBloch.reloadTexture();
            this.uiCircuit.reloadTexture();
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
                // console.debug('this.inputActiveDirections',this.inputActiveDirections);
            }
            // if the key is stored no longer down, remove it
            else if (!key.isDown && index!==-1){
                this.inputActiveDirections.splice(index,1);
                // console.debug('this.inputActiveDirections',this.inputActiveDirections);
            }
        }
        return this.inputActiveDirections;
    },

    checkOverlap: function checkOverlap(spriteA, spriteB) {
        var boundsA = spriteA.getBounds();
        var boundsB = spriteB.getBounds();
        return Phaser.Rectangle.intersects(boundsA, boundsB);
    },

    handleOverlapGate: function (sprite,tile) {
        console.debug('handleOverlapGate',sprite,tile);
        if (!this.tileOverlap){
    
            console.log('applying gate');

            switch (tile.frame){
                case (config.frames.gate0):
            }

            this.qubit.xGate(()=>{
                const z = this.qubit.zRead();
                console.log('done applying gate, readZ',z);

                this.player.tint = (1-z) * 0xff0000 || 0xffffff;
    
                // move burst here and play
                this.burst.position.set( tile.x + tile.width/2, tile.y + tile.height/2 );
                this.burst.play();

                this.reloadDynamicAssets();

            });

            this.tileOverlap = tile;
        }
    },

    // TODO: these handlers smell like a component behavior for a tile overlap system
    handleOverlapRead: function (sprite,tile) {
        console.debug('handleOverlapGate',tile.frame,sprite,tile);
        if (!this.tileOverlap){

            const z = this.qubit.zRead();
            
            console.log('readZ',z);
            if (z===0){
                // move powerup here and play
                this.powerup.x = tile.x + tile.width/2;
                this.powerup.y = tile.y + tile.height/2;
                this.powerup.play('powerup');
                this.powerup.sound.play();
                this.score.value += 1;
                this.score.update();
            }else{
                this.score.value -= 1;
                this.score.update();
            }

            this.tileOverlap = tile;
        }
    },
    handleCollideRead: function (sprite,tile){
        console.log('handleCollideRead',sprite,tile);
        return this.qubit.zRead()===1;
    },

    update: function () {
        
        this.physics.arcade.collide(this.player, this.layerWalls, ()=>console.debug('bonk'));
        this.physics.arcade.collide(this.player, this.reads, null, this.handleCollideRead, this);

        if (this.tileOverlap && !this.checkOverlap(this.player, this.tileOverlap)) { this.tileOverlap = null; }
        this.physics.arcade.overlap(this.player, this.gates, this.handleOverlapGate, null, this);
        this.physics.arcade.overlap(this.player, this.reads, this.handleOverlapRead, null, this);

        // this.player.update();

        const activeDirections = this.getDirectionKeys();

        this.player.control(activeDirections);

    }

};

export default Quest;