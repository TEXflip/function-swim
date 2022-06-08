#version 430
uniform float T;
uniform float color_range = 0.1;
uniform float zoom;
uniform float res = 0.5;
uniform vec2 aspect_ratio;
uniform vec3 camera_position = vec3(-10.0, 15.0, -20.0);
uniform vec3 camera_target = vec3(0.0, 10.0, 0.0);

const int NUMBER_OF_STEPS = 128;
const float SURF_DISTANCE = 0.01; // surface distance
const float MAX_DISTANCE = 1000.0;
const float pi = 3.1415926535897932384626433832795;
const float sqrt2 = 1.4142135623730950488016887242097;
vec3 light_position = vec3(0, 5, 0);

// in vec2 v_uv: screen space coordniate
in vec2 v_uv;
// out color
out vec4 out_color;

vec3 cm_viridis(float t) {
    if (abs(t-0.5) > 0.5)
        return vec3(1.);
    
    const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
    const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
    const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
    const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
    const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
    const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
    const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);

    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));

}

// functions of optimization problems

float sphere(vec2 c){
    float x = c.x;
    float y = c.y;
    float f = x*x + y*y;
    return f/1000.;
}

float rastrigin(vec2 c){
    float x = c.x;
    float y = c.y;

    x = x*x - 10. * cos(2. * pi * x) + 10.;
    y = y*y - 10. * cos(2. * pi * y) + 10.;

    return (x + y )/50.; // set the minimum to 0+ 20.91
}

float ackley(vec2 c){
    float x = c.x;
    float y = c.y;

    float f = -20. * exp(-0.2 * sqrt(0.5 * (x * x + y * y))) - exp(0.5 * (cos(2. * pi * x) + cos(2. * pi * y))) + exp(1.) + 20.;

    return f/2.;
}

float griewank(vec2 c){
    float x = c.x;
    float y = c.y;

    float f = 1. + (x * x / 4000.) + (y * y / 4000.) - cos(x) * cos(y / sqrt2);

    return f * 2.;
}

float rosenbrock(vec2 c){
    c += 1.;  // center the optimial value to (0,0)
    float x = c.x;
    float y = c.y;

    float f = 100. * (y - x * x) * (y - x * x) + (1. - x) * (1. - x);

    return f/1000000.;
}

float schwefel(vec2 c){
    c += 420.968746; // center the optimial value to (0,0)
    float x = c.x;
    float y = c.y;

    float f = 418.9829 * 2. - x * sin(sqrt(abs(x))) - y * sin(sqrt(abs(y)));

    return f/50.;
}

float bukin(vec2 c){
    float x = c.x - 10.;
    float y = c.y + 1.;

    float f = 100. * sqrt(abs(y - 0.01 * x * x)) + 0.01 * abs(x + 10.);

    return f/50.;
}

float drop_wave(vec2 c){
    float x = c.x;
    float y = c.y;

    float f = -(1.+ cos(12. * sqrt(x * x + y * y))) / (0.5 * (x * x + y * y) + 2.);

    return (f+1.)/5.;
}

float eggholder(vec2 c){
    // usually evaluated on the square xi ∈ [-512, 512], so there are better minimas outside the square
    // and the colors are not good
    float x = c.x + 512.;
    float y = c.y + 404.2319;

    float f = -(y + 47.) * sin(sqrt(abs(x / 2. + y + 47.))) - x * sin(sqrt(abs(x - (y + 47.))));

    return (f + 959.6407)/50.;
}

float holder_table(vec2 c){
    // dont go outside xi ∈ [-10, 10] !!!
    float x = c.x + 8.05502;
    float y = c.y + 9.66459;

    float f = -abs(sin(x) * cos(y) * exp(abs(1. - sqrt(x * x + y * y) / pi)));

    return (f+19.2085)/5.;
}

float shaffer(vec2 c){
    float x = c.x;
    float y = c.y;

    float f = 0.5 + (sin(x + y) + (x - y) * (x - y) - 0.5 * (x + y)) * (sin(x + y) + (x - y) * (x - y) - 0.5 * (x + y)) / (1. + 0.001 * (x + y) * (x + y));

    return f/100.;
}

float custom_copilot(vec2 c){
    c /= 10.;
    float x = c.x;
    float y = c.y;

    float f = (sin(x) - x * cos(x)) * (sin(y) - y * cos(y)) * (sin(x + y) - (x + y) * cos(x + y));

    return f/100.;
}

float shuberts(vec2 c){
    float x = c.x;
    float y = c.y;

    float f1 = 0., f2 = 0.;
    for(float i = 1.; i < 6.; i+=1.){
        f1 += i*cos((i+1.)*x + i);
        f2 += i*cos((i+1.)*y + i);
    }

    return (f1*f2)/200.;
}

float fun_selection(vec2 c){
    float f = 0.0;

    // f = sphere(c);
    f = rastrigin(c);
    // f = ackley(c);
    // f = griewank(c);
    // f = rosenbrock(c);
    // f = schwefel(c);
    // f = bukin(c);
    // f = drop_wave(c);
    // f = eggholder(c);
    // f = holder_table(c);
    // f = shaffer(c);
    // f = custom_copilot(c);
    // f = shuberts(c);

    return f;
}

//___________________________Rendering Stuff___________________________________

mat2 Rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

vec3 R(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 f = normalize(l-p),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f,r),
        c = p+f*z,
        i = c + uv.x*r + uv.y*u,
        d = normalize(i-p);
    return d;
}

float sdSphere(in vec3 p, in vec3 c, float r)
{
    return length(p - c) - r;
}

float sdBox( vec3 p, vec3 b)
{
  vec3 q = abs(p - vec3(0.,1., 0.)) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// map the world
float map(in vec3 p)
{
    float plane = (p.y - fun_selection(p.xz) * exp(zoom*0.1));
    // float sphere = sdSphere(p, vec3(0.0, 1.0, 0.0), 0.5);
    // float d = min(plane,sphere);
    return plane;
}

vec2 map_with_gradient(in vec3 p, in vec3 dir)
{
    float d1 = (p.y - fun_selection(p.xz) * exp(zoom*0.1));
    vec3 next = p+dir*SURF_DISTANCE*0.5;
    float d2 = (p.y - fun_selection(next.xz) * exp(zoom*0.1));

    float grad = (d2-d1)/(SURF_DISTANCE*0.5);
    // next.y -= d2;

    return vec2(d1, grad);
}


vec3 get_normal(vec3 p){
	//sampling around the point
	vec2 e = vec2(0.01, 0.0);
	float d = map(p);
	vec3 n = d - vec3(
					map(p-e.xyy),
					map(p-e.yxy),
					map(p-e.yyx));
	return normalize(n);
}

// ro is the ray origin
// rd is the ray direction
vec2 ray_march(in vec3 ro, in vec3 rd, int MAX_STEPS)
{
    float dist_origin = 0.0, min_dist = 10.; // distance origin
    vec3 col;
    
    for (int i = 0; i < MAX_STEPS; ++i)
    {
        vec3 curr_pos = ro + dist_origin * rd;

        float distance_to_closest = map(curr_pos);

        dist_origin += distance_to_closest * res;

        if (dist_origin < 5. && min_dist > distance_to_closest){
            min_dist = distance_to_closest;
        }

        if (abs(distance_to_closest) < SURF_DISTANCE*0.1 || dist_origin > MAX_DISTANCE) break;
    }

    return vec2(dist_origin, min_dist);
}


vec2 ray_march_for_function(in vec3 ro, in vec3 rd, int MAX_STEPS)
{
    float dist_origin = 0.0, min_dist = 10.; // distance origin
    vec3 col;
    
    for (int i = 0; i < MAX_STEPS; ++i)
    {
        vec3 curr_pos = ro + dist_origin * rd;

        float distance_to_closest = map(curr_pos);

        float _step = distance_to_closest;
        if (_step < 2.)
            _step *= 0.1;
        dist_origin += _step;

        if (dist_origin < 5. && min_dist > distance_to_closest){
            min_dist = distance_to_closest;
        }

        if (abs(distance_to_closest) < SURF_DISTANCE || dist_origin > MAX_DISTANCE) break;
    }

    return vec2(dist_origin, min_dist);
}

float GetLight(vec3 p, vec3 n) {
    vec3 l = normalize(light_position - p);
    
    float dif = clamp(dot(n, l) * .5 + .5, 0., 1.);

    // Shadows Computation
    vec2 rm_out = ray_march(p + n * SURF_DISTANCE * 2.01, l, 64);
    float d = rm_out.x;
    float min_dist = rm_out.y;
    if(d < length(light_position - p)) {
        dif *= 0.65;
    }
    else {
        dif *= 0.65+min(smoothstep(0, 1, min_dist*20.), (1.-0.65));
    }
    
    return dif;
}

void main()
{
    vec2 uv = (v_uv - 0.5) * aspect_ratio; // center the uv coordniate
    light_position.xz = vec2(sin(T), cos(T))*2.;

    vec3 ro = camera_position; // ray origin a.k.a. camera position
    // vec3 rd = vec3(uv, 1.0); // ray direction
    vec3 col = vec3(0);

    vec3 rd = R(uv, ro, camera_target, 1.);

    float dist = ray_march(ro, rd, NUMBER_OF_STEPS).x;

    if(dist < MAX_DISTANCE) {
    	vec3 p = ro + rd * dist;
        float f = fun_selection(p.xz);
        vec3 nor = get_normal(p);

        // light computation
    	col = vec3(GetLight(p, nor)) * cm_viridis(f * color_range);
    }

    col = pow(col, vec3(.4545)); // gamma correction (very important)

    out_color = vec4(col, 1.0);
}