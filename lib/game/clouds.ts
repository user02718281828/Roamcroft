import * as T from 'three';

const CELL = 24, RADIUS = 2;
const sample = (x:number,z:number,seed:number) => {
  const n=Math.sin(x*127.1+z*311.7+seed*17.3)*43758.5453;
  return n-Math.floor(n);
};

export function cloudAnchors(x:number,z:number,seed:number) {
  const result=[];
  for(let cx=Math.floor(x/CELL)-RADIUS;cx<=Math.floor(x/CELL)+RADIUS;cx++)
    for(let cz=Math.floor(z/CELL)-RADIUS;cz<=Math.floor(z/CELL)+RADIUS;cz++) {
      if(sample(cx,cz,seed)>.36)continue;
      result.push({key:`${cx},${cz}`,x:(cx+.2+sample(cx,cz,seed+1)*.6)*CELL,
        z:(cz+.2+sample(cx,cz,seed+2)*.6)*CELL,y:8+sample(cx,cz,seed+3)*3,
        width:7+sample(cx,cz,seed+4)*5,depth:4+sample(cx,cz,seed+5)*3});
    }
  return result;
}

// Kamera yalnızca görünür hücreleri seçer; bulut konumları dünya tohumuna bağlıdır.
export class CloudField extends T.InstancedMesh<T.PlaneGeometry,T.ShaderMaterial> {
  private cell='';
  constructor(){
    super(new T.PlaneGeometry(1,1),new T.ShaderMaterial({
      transparent:true,depthWrite:false,side:T.DoubleSide,
      uniforms:{time:{value:0},tint:{value:new T.Color('#dde4d6')},opacity:{value:.12}},
      vertexShader:`varying vec2 cloudUv;
        uniform float time;
        void main(){
          cloudUv=uv;
          vec4 world=instanceMatrix*vec4(position,1.0);
          world.x+=sin(time*.008)*2.0;
          world.z+=sin(time*.005)*.7;
          gl_Position=projectionMatrix*modelViewMatrix*world;
        }`,
      fragmentShader:`varying vec2 cloudUv;
        uniform vec3 tint;
        uniform float opacity;
        void main(){
          vec2 p=cloudUv*2.0-1.0;
          float edge=length(p*vec2(1.0,1.1));
          float softness=1.0-smoothstep(.15,1.0,edge);
          float wisps=.75+.25*sin(p.x*5.0+p.y*2.0)*cos(p.y*4.0);
          gl_FragColor=vec4(tint,softness*wisps*opacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),25);
    this.count=0;this.frustumCulled=false;this.castShadow=false;this.receiveShadow=false;
    this.instanceMatrix.setUsage(T.DynamicDrawUsage);
  }
  update(x:number,z:number,seed:number,time:number,daylight:number){
    const cell=`${Math.floor(x/CELL)},${Math.floor(z/CELL)},${seed}`;
    if(cell!==this.cell){
      this.cell=cell;
      const anchors=cloudAnchors(x,z,seed),pose=new T.Object3D();
      this.count=anchors.length;
      anchors.forEach((a,i)=>{pose.position.set(a.x,a.y,a.z);pose.rotation.x=-Math.PI/2;
        pose.scale.set(a.width,a.depth,1);pose.updateMatrix();this.setMatrixAt(i,pose.matrix);});
      this.instanceMatrix.needsUpdate=true;
    }
    this.material.uniforms.time.value=time;
    this.material.uniforms.opacity.value=.045+daylight*.075;
    this.material.uniforms.tint.value.setRGB(.35+daylight*.48,.43+daylight*.43,.47+daylight*.34);
  }
}
