export type PortalSDK={init:()=>Promise<void>;data?:import('./crazygames-data').DataModule;user?:{getUserToken?:(options:{signingKeyType:'IN_GAME_AUTH'})=>Promise<string>;isUserAccountAvailable:boolean;getUser:()=>Promise<{__dangerousUserId?:string;username:string;profilePictureUrl?:string}|null>;addAuthListener:(fn:()=>void)=>void;removeAuthListener:(fn:()=>void)=>void};game:{isInstantMultiplayer?:boolean;inviteParams?:Record<string,string>|null;updateRoom?:(room:{roomId:string;isJoinable:boolean;inviteParams:{roomName:string}})=>void;leftRoom?:()=>void;addJoinRoomListener?:(fn:(params:Record<string,string>)=>void)=>void;removeJoinRoomListener?:(fn:(params:Record<string,string>)=>void)=>void;inviteLink?:(params:{roomName:string})=>string|Promise<string>;loadingStart:()=>void;loadingStop:()=>void;gameplayStart:()=>void;gameplayStop:()=>void;settings?:{muteAudio?:boolean};addSettingsChangeListener?:(fn:(s:{muteAudio?:boolean})=>void)=>void;removeSettingsChangeListener?:(fn:(s:{muteAudio?:boolean})=>void)=>void}};
export class CrazyGamesBridge {
 private sdk:PortalSDK|null=null;private loading=true;private playing=false;private sentLoading:boolean|null=null;private sentPlaying:boolean|null=null;private disposed=false;
 private mute:(value:boolean)=>void;
 constructor(mute:(value:boolean)=>void){this.mute=mute;}
 private settings=(s:{muteAudio?:boolean})=>this.mute(s.muteAudio===true);
 async initialize(sdk:PortalSDK|undefined){
  if(!sdk)return false;
  try{await sdk.init();if(this.disposed)return false;this.sdk=sdk;this.settings(sdk.game.settings||{});sdk.game.addSettingsChangeListener?.(this.settings);sdk.game.loadingStart();this.sentLoading=true;this.sync();return true;}catch{return false;}
 }
 setLoading=(value:boolean)=>{this.loading=value;this.sync();};
 setPlaying=(value:boolean)=>{this.playing=value;this.sync();};
 private sync(){if(!this.sdk)return;try{
  if(this.sentLoading!==this.loading){this.sdk.game[this.loading?'loadingStart':'loadingStop']();this.sentLoading=this.loading;}
  const active=this.playing&&!this.loading;
  if(this.sentPlaying!==active){if(active||this.sentPlaying!==null)this.sdk.game[active?'gameplayStart':'gameplayStop']();this.sentPlaying=active;}
 }catch{/* SDK failure must not interrupt the game. */}}
 dispose(){this.setPlaying(false);try{this.sdk?.game.removeSettingsChangeListener?.(this.settings);}catch{}this.disposed=true;}
}
