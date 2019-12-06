export default {
    dirToString: function(dir){
        return dir === Phaser.NONE ? 'NONE' :
               dir === Phaser.LEFT ? 'LEFT' :
               dir === Phaser.RIGHT ? 'RIGHT' :
               dir === Phaser.UP ? 'UP' :
               dir === Phaser.DOWN ? 'DOWN' :
               '';
    }
};