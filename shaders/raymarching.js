const fragmentShader = `
#define MAX_STEPS 128
#define MIN_DISTANCE 0.01
#define MAX_DISTANCE 100.
#define PI 3.14159265359
uniform vec2 iResolution;
uniform float iTime;

float sdBoxFrame( vec3 p, vec3 b, float e )
{
  p = abs(p  )-b;
  vec3 q = abs(p+e)-e;
  return min(min(
      length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
      length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
      length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}
float GetDist(vec3 p){
    // vec4 s = vec4(0,1,6,1);
    // float sphereDist = length(p-s.xyz)-s.w;
    vec3 boxpos = vec3(0.0,0.5,0.2);
    boxpos = p - boxpos;
    float sdBox = sdBoxFrame(boxpos,vec3(0.5,0.5,0.5), 0.025);
    float planeDist = -p.z+0.9;
    float d = min(sdBox,planeDist);
    return d;
}
float RayMarch(vec3 ro,vec3 rd){
    float dO=0.;
    for(int i = 0; i <MAX_STEPS;i++){
        vec3 p = ro+rd*dO;
        float dS = GetDist(p);
        dO+=dS;
        if(dO>MAX_DISTANCE||dS<MIN_DISTANCE) break;
    }
    return dO;
}
vec3 GetNormal(vec3 p){
    vec2 e = vec2(1.0,-1.0)*0.5773;
    const float eps = 0.0005;
    return normalize( e.xyy*GetDist( p + e.xyy*eps ) + 
					  e.yyx*GetDist( p + e.yyx*eps ) + 
					  e.yxy*GetDist( p + e.yxy*eps ) + 
					  e.xxx*GetDist( p + e.xxx*eps ) );
}
float GetLight(vec3 p){
    //vec3 lightPos = vec3(0,2.,1.);
    vec3 lightPos = vec3(0,1.,-2.);
    //lightPos.xz+=vec2(sin(iTime),cos(iTime))*2.;
    vec3 l = normalize(lightPos-p);
    vec3 n = GetNormal(p);

    float dif = clamp(dot(n,l),0.,1.);
    float d = RayMarch(p+n*MIN_DISTANCE*2.,l);
    if(d<length(lightPos-p)) dif*=.1;
    return dif;

}
void mainImage( out vec4 fragColor, in vec2 fragCoord ){
    
    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;
    vec3 col = vec3(0);
    vec3 ro = vec3(0,0.3,-2.);
    vec3 rd = normalize(vec3(uv.x,uv.y,1));

    float d = RayMarch(ro,rd);
    vec3 p = ro + rd*d;
    //d/=6.;
    float diff = GetLight(p);
    col = vec3(0.975,0.920,0.961)*diff;
    fragColor = vec4(col,1.0);
}

void main() {
   mainImage(gl_FragColor, gl_FragCoord.xy);
}`

export default fragmentShader;