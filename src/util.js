export default {

    // Qiskit utilities

    jobCountWinner: function(counts){
        console.log('parsing counts',counts);

        // { "1": 1024 }
        let winner = null;
        let value = 0;
        for (let count of Object.entries(counts)){
            if ( !winner || winner[1] < count[1] ){
                winner = count;
            }
        }
        if (winner !== null){
            value = Math.round(parseFloat(winner[0]));
            value = isNaN(value) ? 0 : value;
        }
        return value;
    },

    // Phaser utilities

    dirToString: function(dir){
        return dir === Phaser.NONE ? 'NONE' :
               dir === Phaser.LEFT ? 'LEFT' :
               dir === Phaser.RIGHT ? 'RIGHT' :
               dir === Phaser.UP ? 'UP' :
               dir === Phaser.DOWN ? 'DOWN' :
               '';
    },

};