// Phaser CE + Webpack loading
// https://github.com/photonstorm/phaser-ce/blob/master/resources/Project%20Templates/Webpack/src/index.js
import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

export default class Menu extends Phaser.Group {
    constructor(){
        super(...arguments);

        this.iconRestart = null;
        this.iconHelp = null;
        this.iconMute = null;
        this.iconUnmute = null;

        this.restartBtn = null;
        this.helpBtn = null;
        this.muteBtn = null;
    }
    
    static create(state,options={}){
        const game = options.game || state.game;
        const group = options.group || state.world;

        const menu = group.add(new Menu(game));
        menu.position.x = options.x||0;
        menu.position.y = options.y||0;

        // icons
        menu.iconRestart = options.icons.restart;
        menu.iconHelp = options.icons.help;
        menu.iconMute = options.icons.mute;
        menu.iconUnmute = options.icons.unmute;
        
        // look for saved mute status in local storage
        try {
            state.sound.mute = JSON.parse(localStorage.getItem('qgq:mute'));
        }catch(e){
            console.debug('qgq mute setting note found');
            state.sound.mute = false;
        }

        // place buttons

        let x = 0;
        let y = 0;
        const sz = 50;

        menu.restartBtn = game.add.button(x, y, 'icons', ()=>{
            state.restart();
        }, menu, menu.iconRestart, menu.iconRestart, menu.iconRestart, menu.iconRestart, menu)

        x+=sz;

        menu.helpBtn = game.add.button(x, y, 'icons', ()=>{
            state.help();
        }, menu, menu.iconHelp, menu.iconHelp, menu.iconHelp, menu.iconHelp, menu)

        x+=sz;

        menu.muteBtn = game.add.button(x, y, 'icons', ()=>{
            state.sound.mute = !state.sound.mute;
            localStorage.setItem('qgq:mute', state.sound.mute);
            menu.updateMuteState(state.sound.mute);
        }, menu, menu.iconMute, menu.iconMute, menu.iconUnmute, menu.iconMute, menu);

        menu.updateMuteState(state.sound.mute);

        return menu;
    }

    updateMuteState(mute){
        if (mute){
            this.muteBtn.setFrames(this.iconMute,this.iconMute,this.iconUnmute,this.iconMute);
        }else{
            this.muteBtn.setFrames(this.iconUnmute,this.iconUnmute,this.iconMute,this.iconUnmute);
        }
    }
}