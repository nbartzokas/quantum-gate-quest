// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

export default class Help extends Phaser.Group {
    constructor(){
        super(...arguments);
        this.images=[];
        this.index=0;
        this.offset=0;
    }
    
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;

        const help = group.add(new Help(game));
        help.offset = game.height;
        help.images = options.images.map( i => {
            const image = game.add.image(0,0,i,0,help);
            image.x=help.offset;
            image.inputEnabled = true;
            image.events.onInputDown.add(help.next,help)
            return image;
        });

        // look for saved mute status in local storage
        let helped = false;
        try {
            helped = JSON.parse(localStorage.getItem('qgq:helped'));
        }catch(e){
            console.debug('qgq help setting note found');
        }
        if (!helped){
            help.start();
        }
        
        return help;
    }

    start(){
        this.index=0;
        this.images.forEach(i=>i.x=this.offset);
        this.images[this.index].x=0;
    }

    next(){
        if (this.index>=this.images.length){
            return;
        }
        this.images[this.index].x=this.offset;
        this.index++;
        if (this.index<this.images.length){
            this.images[this.index].x=0;
        }else{
            // done
            localStorage.setItem('qgq:helped', true);
        }
    }

}