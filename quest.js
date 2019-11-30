var Quest = function (game) {

    this.map = null;
    this.layer = null;
    this.player = null;

    this.safetile = 14;
    this.gridsize = 16;

    this.speed = 150;
    this.threshold = 32;

    this.marker = new Phaser.Point();
    this.turnPoint = new Phaser.Point();

    this.directions = [ null, null, null, null, null ];
    this.opposites = [ Phaser.NONE, Phaser.RIGHT, Phaser.LEFT, Phaser.DOWN, Phaser.UP ];

    this.currentDirection = Phaser.NONE;
    this.activeDirections = [];

};

Quest.prototype = {

    init: function () {

        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;

        Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);

        this.physics.startSystem(Phaser.Physics.ARCADE);

        window.quest = this; // expose for debugging 

    },

    preload: function () {

        //  We need this because the assets are on Amazon S3
        //  Remove the next 2 lines if running locally
        // this.load.baseURL = 'http://files.phaser.io.s3.amazonaws.com/codingtips/issue005/';
        // this.load.crossOrigin = 'anonymous';

        this.load.image('dot', 'assets/dot.png');
        this.load.image('tiles', 'assets/pacman-tiles.png');
        this.load.spritesheet('player', 'assets/pacman.png', 32, 32);
        this.load.tilemap('map', 'assets/pacman-map.json', null, Phaser.Tilemap.TILED_JSON);

    },

    create: function () {

        this.map = this.add.tilemap('map');
        this.map.addTilesetImage('pacman-tiles', 'tiles');

        this.layer = this.map.createLayer('Pacman');

        this.dots = this.add.physicsGroup();

        this.map.createFromTiles(7, this.safetile, 'dot', this.layer, this.dots);

        //  The dots will need to be offset by 6px to put them back in the middle of the grid
        this.dots.setAll('x', 6, false, false, 1);
        this.dots.setAll('y', 6, false, false, 1);

        //  Player should collide with everything except the safe tile
        this.map.setCollisionByExclusion([this.safetile], true, this.layer);

        //  Position Player at grid location 14x17 (the +8 accounts for his anchor)
        this.player = this.add.sprite((14 * 16) + 8, (17 * 16) + 8, 'player', 0);
        this.player.anchor.set(0.5);
        this.player.animations.add('munch', [0, 1, 2, 1], 20, true);

        this.physics.arcade.enable(this.player);
        this.player.body.setSize(16, 16, 0, 0);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player.play('munch');
        // this.movePlayer(Phaser.LEFT);

        // draw grid
        this.debugGrid = this.add.graphics(0,0);
        this.debugGrid.lineColor = '#FF0000';
        this.debugGrid.lineWidth = 1;
        for (let x = 0; x < this.width; x+=this.gridsize){
            for (let y = 0; y < this.height; x+=this.gridsize){
                this.debugGrid.drawRect(x,y,this.gridsize,this.gridsize);
            }    
        }

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
                console.log('this.activeDirections',this.activeDirections);
            }
            // if the key is stored no longer down, remove it
            else if (!key.isDown && index!==-1){
                this.activeDirections.splice(index,1);
                console.log('this.activeDirections',this.activeDirections);
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
            console.debug('checkDirection: no valid tile that way', util.dirToString(turnTo) );
            return false;
        }

        else if (this.directions[turnTo].index !== this.safetile){
            console.debug('checkDirection: no floor tile that way', util.dirToString(turnTo) );
            return false;
        }

        else if (this.currentDirection === this.opposites[turnTo]){
            console.debug('checkDirection: permitting turn around', util.dirToString(turnTo) );
            return true;
        }

        else{
            console.debug('checkDirection: permitting turn', util.dirToString(turnTo) );
            return true;
        }

    },

    turn: function (turnTo) {
        console.log('attempting turn',turnTo);

        var cx = Math.floor(this.player.x);
        var cy = Math.floor(this.player.y);

        //  This needs a threshold, because at high speeds you can't turn because the coordinates skip past
        console.log(cx, this.turnPoint.x, this.threshold, cy, this.turnPoint.y, this.threshold);
        if (!this.math.fuzzyEqual(cx, this.turnPoint.x, this.threshold) || !this.math.fuzzyEqual(cy, this.turnPoint.y, this.threshold))
        {
            return false;
        }

        console.log('turning',turnTo);

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
        console.log('stop');
        this.player.body.velocity.set(0);
        this.currentDirection=Phaser.NONE;
    },

    movePlayer: function (direction) {
        console.log('move', util.dirToString(direction) );

        var speed = this.speed;

        if (direction === Phaser.LEFT || direction === Phaser.UP)
        {
            speed = -speed;
        }

        if (direction === Phaser.LEFT || direction === Phaser.RIGHT)
        {
            this.player.body.velocity.x = speed;
            this.player.body.velocity.y = 0;
        }
        else
        {
            this.player.body.velocity.x = 0;
            this.player.body.velocity.y = speed;
        }

        //  Reset the scale and angle (Player is facing to the right in the sprite sheet)
        this.player.scale.x = 1;
        this.player.angle = 0;

        if (direction === Phaser.LEFT)
        {
            this.player.scale.x = -1;
        }
        else if (direction === Phaser.UP)
        {
            this.player.angle = 270;
        }
        else if (direction === Phaser.DOWN)
        {
            this.player.angle = 90;
        }

        this.currentDirection = direction;

    },

    eatDot: function (pacman, dot) {

        dot.kill();

        if (this.dots.total === 0)
        {
            this.dots.callAll('revive');
        }

    },

    update: function () {
        
        this.physics.arcade.collide(this.player, this.layer);
        this.physics.arcade.overlap(this.player, this.dots, this.eatDot, null, this);

        this.marker.x = this.math.snapToFloor(Math.floor(this.player.x), this.gridsize) / this.gridsize;
        this.marker.y = this.math.snapToFloor(Math.floor(this.player.y), this.gridsize) / this.gridsize;

        //  Update our grid sensors
        this.directions[Phaser.LEFT]  = this.map.getTileLeft(this.layer.index, this.marker.x, this.marker.y);
        this.directions[Phaser.RIGHT] = this.map.getTileRight(this.layer.index, this.marker.x, this.marker.y);
        this.directions[Phaser.UP]    = this.map.getTileAbove(this.layer.index, this.marker.x, this.marker.y);
        this.directions[Phaser.DOWN]  = this.map.getTileBelow(this.layer.index, this.marker.x, this.marker.y);

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
        // 
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