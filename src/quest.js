import merge from 'deepmerge';

import config from './config';
import Burst from './burst';
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

        this.burst = Burst.create(this, Object.freeze(merge(config.burst,{
            sprite:{
                tint: 0xffdd00,
            }
        })));

        this.player = Player.create( this, Object.freeze(Object.assign({},config.player,{
            // TODO: decouple
            map: this.map,
            layerWalls: this.layerWalls,
        })));

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