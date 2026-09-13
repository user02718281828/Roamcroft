// İki parmaklı hareket, parmaklardan biri kalksa bile yanlış tıklama üretmez.
export class PinchGesture {
  points=new Map<number,{x:number;y:number}>();
  distance=0;
  zoom=17;
  suppress=false;
  begin(id:number,x:number,y:number,zoom:number){
    this.points.set(id,{x,y});
    if(this.points.size===2){this.distance=this.separation();this.zoom=zoom;this.suppress=true;}
    return this.suppress;
  }
  separation(){const [a,b]=[...this.points.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;}
  move(id:number,x:number,y:number){
    if(!this.points.has(id))return null;this.points.set(id,{x,y});
    if(this.points.size!==2||!this.distance)return null;
    const distance=this.separation();return distance>1?Math.max(7,Math.min(22,this.zoom*this.distance/distance)):null;
  }
  end(id:number){const suppress=this.suppress;this.points.delete(id);if(!this.points.size)this.reset();return suppress;}
  reset(){this.points.clear();this.suppress=false;this.distance=0;}
}
