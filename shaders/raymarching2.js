const fragmentShader = `
#define AA 1
#define MAX_STEPS 128
#define MIN_DISTANCE 0.01
#define MAX_DISTANCE 100.
#define T_MAX 50.0
#define PI 3.14159265359
uniform vec2 iResolution;
uniform float iTime;
uniform int iComputeShadow;
mat2 Rotate(float a) {
    float s=sin(a); 
    float c=cos(a);
    return mat2(c,-s,s,c);
}
mat3 rotateX(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(1, 0, 0),
        vec3(0, c, -s),
        vec3(0, s, c)
    );
}
mat3 rotateZ(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, -s, 0),
        vec3(s, c, 0),
        vec3(0, 0, 1)
    );
}
mat3 rotateY(float theta) {
    float c = cos(theta);
    float s = sin(theta);
    return mat3(
        vec3(c, 0, s),
        vec3(0, 1, 0),
        vec3(-s, 0, c)
    );
}
float sdBoxFrame( vec3 p, vec3 b, float e )
{
  p = abs(p)-b;
  vec3 q = abs(p+e)-e;
  return min(min(
      length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
      length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
      length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}


float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}
float GetDist(vec3 p){
    //p.y +=noise(p+iTime);
    float planeDist = p.y+0.5;

    //p.x *= abs(sin(p.x+iTime));
    p.xz*=Rotate(0.5*iTime*PI*2.);
    //p.xy*=Rotate(0.5*iTime*PI*2.);

    vec4 s = vec4(0.0,0.0,0.0,0.1);
    float sphereDist = length(p-s.xyz)-s.w;
    vec3 boxpos = vec3(.0,.0,0.0);
    boxpos = p - boxpos;
    float sdBox = sdBoxFrame(boxpos,vec3(0.2,0.2,0.2), 0.025);
    float d = min(sdBox,sphereDist);
    
    d = min(d,planeDist);
    return d;
}

vec3 GetNormal(vec3 p){
    vec2 e = vec2(1.0,-1.0)*0.5773;
    const float eps = 0.0005;
    return normalize( e.xyy*GetDist( p + e.xyy*eps ) + 
					  e.yyx*GetDist( p + e.yyx*eps ) + 
					  e.yxy*GetDist( p + e.yxy*eps ) + 
					  e.xxx*GetDist( p + e.xxx*eps ) );
}

float RayMarch(vec3 ro,vec3 rd){
        float t = 0.0;
        for( int i=0; i<256; i++ )
        {
            vec3 pos = ro + t*rd;
            float h = GetDist(pos);
            if( h<0.0001 || t>T_MAX ) break;
            t += h;
        }

    float dO=0.;
    for(int i = 0; i <MAX_STEPS;i++){
        vec3 p = ro+rd*dO;
        float dS = GetDist(p);
        dO+=dS;
        if(dO>MAX_DISTANCE||dS<MIN_DISTANCE) break;
    }
    return dO;
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
    // camera movement	
	float an = 0.5*(iTime-10.0);
	//vec3 ro = 1.2*vec3( 2.0*cos(an), 0.0, 2.0*sin(an) );
    
    vec3 ro = vec3(0,.0,-1.2);

    vec3 ta = vec3( 0.0, -0.0, 0.0 );
    // camera matrix
    vec3 ww = normalize( ta - ro );
    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );
    vec3 vv = normalize( cross(uu,ww));
   
    // render    
    vec3 tot = vec3(0.0);
    #if AA>1
    for( int m=0; m<AA; m++ )
    for( int n=0; n<AA; n++ )
    {
        // pixel coordinates
        vec2 o = vec2(float(m),float(n)) / float(AA) - 0.5;
        vec2 p = (2.0*(fragCoord+o)-iResolution.xy)/iResolution.y;
        #else    
        vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;
        #endif

	    // create view ray
        vec3 rd = normalize( p.x*uu + p.y*vv + 1.5*ww );

        // raymarch
        const float tmax = float(MAX_STEPS);
        float t = 0.0;
        for( int i=0; i<128; i++ )
        {
            vec3 pos = ro + t*rd;
            float h = GetDist(pos);
            if( h<0.0001 || t>tmax ) break;//CHANGE TO T_MAX TO SKYBOX
            t += h;
        }
        
        // shading/lighting	
        vec3 col = vec3(0.0);
        if( t<tmax )//T_MAX
        {
            vec3 pos = ro + t*rd;
            vec3 nor = GetNormal(pos);
            float dif = clamp( dot(nor,vec3(0.57703)), 0.0, 1.0 );
            float diff = GetLight(pos);
            float amb = 0.5 + 0.5*dot(nor,vec3(0.0,1.0,0.0));
            col = vec3(0.2,0.3,0.4)*amb + vec3(0.85,0.75,0.65)*diff; 
            
        }

        // gamma        
        col = sqrt( col );
	    tot += col;
    #if AA>1
    }
    tot /= float(AA*AA);
    #endif

	fragColor = vec4( tot, 1.0 );
}

void main() {
   mainImage(gl_FragColor, gl_FragCoord.xy);
}`

export default fragmentShader;