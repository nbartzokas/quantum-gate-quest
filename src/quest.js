// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import merge from 'deepmerge';

import config from './config';
import Burst from './burst';
import FilterRemoveWhite from './filterRemoveWhite';
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

        Object.assign(this.scale,config.scale);

        Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);

        this.physics.startSystem(Phaser.Physics.ARCADE);

        window.quest = this; // expose for debugging 

    },

    preload: function () {
        
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
        this.load.spritesheet('icons','assets/sprites/icons.png',50,50);

    },

    create: function () {

        this.map = this.add.tilemap('map');
        this.map.addTilesetImage('tileset', 'tiles');

        const mapW = this.map.widthInPixels;
        const mapH = this.map.heightInPixels;

        this.mapLayers = this.add.group();
        // this.mapLayers.x = 0;
        // this.mapLayers.y = 288;

        this.layerFloor = this.map.createLayer('floor',mapW,mapH,this.mapLayers);

        this.layerWalls = this.map.createLayer('walls',mapW,mapH,this.mapLayers);
        this.map.setCollisionByExclusion(config.tiles.empty,true/*collides*/,this.layerWalls);

        this.layerGates = this.map.createLayer('gates',mapW,mapH,this.mapLayers);
        this.layerReads = this.map.createLayer('reads',mapW,mapH,this.mapLayers);

        this.gates = this.add.physicsGroup(Phaser.Physics.ARCADE,this.mapLayers);
        this.map.createFromTiles(config.tiles.gate, -1, 'spritesheet', this.layerGates, this.gates);
        this.gates.children.forEach( tile=>{
            tile.frame=config.frames.gate; // https://github.com/photonstorm/phaser/issues/2175
            // tile.alpha=0.5;
        });

        this.burst = Burst.create(this, Object.assign(
            {},
            {
                group: this.mapLayers,
            },
            merge(config.burst,{
                sprite:{
                    tint: 0x00ff00,
                }
            })
        ));

        this.reads = this.add.physicsGroup(Phaser.Physics.ARCADE,this.mapLayers);
        this.map.createFromTiles(config.tiles.read, -1, 'spritesheet', this.layerReads, this.reads);
        this.reads.children.forEach( tile=>{
            tile.frame=config.frames.read; // https://github.com/photonstorm/phaser/issues/2175
            tile.body.immovable=true;
            tile.body.offset.set(5,5);
            tile.body.width-=10;
            tile.body.height-=10;
            // tile.alpha=0.5;
        });

        this.powerup = this.add.sprite(0,0,'powerup',undefined,this.mapLayers);
        this.powerup.anchor.set(0.5);
        this.powerup.tint = 0xff0000;
        this.powerup.width = 256;
        this.powerup.height = 256;
        this.powerup.animations.add('powerup');
        this.powerup.sound = this.add.audio('powerup_sound');

        this.player = Player.create( this, Object.freeze(Object.assign({},config.player,{
            group: this.mapLayers,
            // TODO: decouple
            map: this.map,
            layerWalls: this.layerWalls,
        })));

        this.cursors = this.input.keyboard.createCursorKeys();

        this.score = Score.create(this, config.score);

        // q ui
        this.uiCircuit = this.add.image(1280,480,'qcircuit');

        this.uiBloch = this.add.group();
        this.uiBlochImageContainer = this.add.group(this.uiBloch);

        this.uiBlochImage = this.add.image(44,44,'qbloch',0,this.uiBlochImageContainer);
        this.uiBlochImage.crop(new Phaser.Rectangle(107,95,288,285));
        this.filter = new FilterRemoveWhite(this,{
            edge0:0.0,
            edge1:0.95
        });
        this.filter.setResolution(config.game.width, config.game.height);
        this.uiBlochImage.filters = [ this.filter ];

        this.uiBloch_xread_label = this.add.image(54,240,'spritesheet',config.icons.readX,this.uiBloch);
        this.uiBloch_yread_label = this.add.image(316,198,'spritesheet',config.icons.readY,this.uiBloch);
        this.uiBloch_zread_label = this.add.image(156,0,'spritesheet',config.icons.readZ,this.uiBloch);

        // backgroud music
        this.music = this.add.audio('bgmusic');
        this.music.loop=true;
        this.music.play();

        // audio controls
        const iconMute = 140;
        const iconUnmute = 120;
        this.sound.mute = false;
        try {
            this.sound.mute = JSON.parse(localStorage.getItem('qgq:mute'));
        }catch(e){
            console.debug('qgq mute setting note found');
        }
        this.muteBtn = this.add.button(this.world.centerX - 95, 400, 'icons', ()=>{
            this.sound.mute = !this.sound.mute;
            localStorage.setItem('qgq:mute', this.sound.mute);
            if (this.sound.mute){
                this.muteBtn.setFrames(iconMute,iconMute,iconUnmute,iconMute);
            }else{
                this.muteBtn.setFrames(iconUnmute,iconUnmute,iconMute,iconUnmute);
            }
        }, this, iconMute, iconUnmute, iconMute);
        if (this.sound.mute){
            this.muteBtn.setFrames(iconMute,iconMute,iconUnmute,iconMute);
        }else{
            this.muteBtn.setFrames(iconUnmute,iconUnmute,iconMute,iconUnmute);
        }

    },

    reloadDynamicAssets: function(){
        console.log('reloadDynamicAssets called');
        this.load.image('qcircuit', 'draw?nocache='+Date.now(),true);
        this.load.image('qbloch', 'bloch?nocache='+Date.now(),true);
        this.load.onLoadComplete.addOnce(()=>{
            console.log('reloadDynamicAssets load completed');
            // TODO: handle load failure
            // update q images 
            this.uiBlochImage.loadTexture('qbloch');
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

    checkOverlap: function checkOverlap(spriteA, spriteB) {
        var boundsA = spriteA.getBounds();
        var boundsB = spriteB.getBounds();
        return Phaser.Rectangle.intersects(boundsA, boundsB);
    },

    handleOverlapGate: function (sprite,tile) {
        console.debug('handleOverlapGate',sprite,tile);
        if (!this.tileOverlap){
    
            console.log('applying xGate');

            this.qubit.xGate(()=>{

                const z = this.qubit.zRead();

                console.log('done applying xGate, readZ',z);
    
                this.player.tint = z * 0xff0000 || 0xffffff;
    
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
        console.log('handleCollideRead',sprite,tile);
        return this.qubit.zRead()===0;
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