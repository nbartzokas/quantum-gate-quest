window.onload = function(){
    var game = new Phaser.Game(1280, 1280, Phaser.AUTO);
    game.state.add('Game', Quest, true);
    window.game = game;
}