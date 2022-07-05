#version 430
#define FLT_MAX 3.402823466e+38
#define FLT_MIN 1.175494351e-38
#define DBL_MAX 1.7976931348623158e+308
#define DBL_MIN 2.2250738585072014e-308

uniform float T = 0.;
uniform float color_range = 0.1;
uniform float zoom = 1.;
uniform float res = 0.5; // ray step size
uniform float res2 = 0.1; // min distance before stop the ray = res2*SURF_DISTANCE
uniform vec2 aspect_ratio = vec2(16., 9.);
uniform vec3 camera_position = vec3(-10.0, 15.0, -20.0);
uniform vec3 camera_target = vec3(0.0, 10.0, 0.0);
uniform int render_mode = 1; // 0: classic ray marching, 1: ray marching optimized for functions
uniform vec3 population[3] = vec3[](vec3(0.0, 10.0, 0.0), vec3(2.0, 10.0, 2.0), vec3(-2.0, 10.0, -2.0));
uniform int pop_size = 3;

uniform float world_scale = 1.;
const int NUMBER_OF_STEPS = 128;
const float SURF_DISTANCE = 0.01; // surface distance
const float MAX_DISTANCE = 1000.0;
const float PI = 3.1415926535897932384626433832795;
const float SQRT2 = 1.4142135623730950488016887242097;
vec3 light_position = vec3(0, 5, 0);

in vec2 v_uv;
out vec4 out_color;

float compiled_function(vec2 c){
    float x = c.x;
    float y = c.y;
    float f = 0.;
    // HERE THE CODE IS CHANGED BEFORE LOADING THE SHADER@
    return f;
}

float fun_selection(vec2 c){
    c *= world_scale;
    return compiled_function(c);
}

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

float sphere_intersection(vec3 ro, vec3 rd, vec3 center, float r) {
    // float a = dot(rd, rd);
    float b = 2. * dot(ro, rd) - 2. * dot(rd, center);
    if (b > 0.)
        return FLT_MAX;

    float c = dot(ro, ro) - 2. * dot(ro, center) - r*r + dot(center, center);
    float discr = b * b - 4. * c;

    if (discr < 0.)
        return FLT_MAX;

    return -(b + sqrt(discr)) * 0.5;
}

vec4 population_map(vec3 ro, vec3 rd) {
    float min_dist = FLT_MAX;
    int min_pop = 0;
    for (int i = 0; i < pop_size; i++){
        float dist = sphere_intersection(ro, rd, population[i], 0.1);
        if (min_dist > dist){
            min_dist = dist;
            min_pop = i;
        }
    }
    if (min_dist < FLT_MAX){
        vec3 norm = normalize((ro + min_dist * rd) - population[min_pop]);
        return vec4(norm, min_dist);
    }
    return vec4(-1.);
}

// map the world
float map(in vec3 p)
{
    return (p.y - fun_selection(p.xz) * exp(zoom*0.1));
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

vec3 shadow(in vec3 ro, in vec3 rd, float max_dist)
{
    float dist_origin = 0.0, min_dist = 1000000., min_dist_orig = 1000000.; // distance origin
    float distance_to_closest = 0.;
    
    for (int i = 0; i < 128; ++i)
    {
        vec3 curr_pos = ro + dist_origin * rd;

        distance_to_closest = map(curr_pos);

        if (i>1 && min_dist > distance_to_closest){
            min_dist = distance_to_closest;
            min_dist_orig = dist_origin;
        }
        dist_origin += distance_to_closest * res;

        if(dist_origin > max_dist)
            return vec3(1., min_dist, min_dist_orig); // no shadow

        if (distance_to_closest < SURF_DISTANCE*0.1)
            return vec3(0., 0., 0.); // shadow
            
    }

    return vec3(1., min_dist, min_dist_orig); // this should never happen
}

// ro is the ray origin
// rd is the ray direction
float ray_march(in vec3 ro, in vec3 rd, int MAX_STEPS)
{
    float dist_origin = 0.0; // distance origin
    float distance_to_closest = 0.;
    
    for (int i = 0; i < MAX_STEPS; ++i)
    {
        vec3 curr_pos = ro + dist_origin * rd;

        distance_to_closest = map(curr_pos);

        dist_origin += distance_to_closest * res;

        if (abs(distance_to_closest) < SURF_DISTANCE*res2 || dist_origin > MAX_DISTANCE) break;
    }

    return dist_origin;
}

float ray_march_for_function(in vec3 ro, in vec3 rd, int MAX_STEPS)
{
    float dist_origin = 0.0, _step = 1.; // distance origin
    float distance_to_closest = 0.;
    float prec = 0.;
    
    for (int i = 0; i < MAX_STEPS; ++i)
    {
        vec3 curr_pos = ro + dist_origin * rd;

        distance_to_closest = map(curr_pos) * _step * res;


        if (distance_to_closest < -SURF_DISTANCE) {
            dist_origin = prec;
            _step *= 0.5;
            continue;
        }

        prec = dist_origin;
        dist_origin += distance_to_closest;

        if (abs(distance_to_closest) < SURF_DISTANCE*res2 || dist_origin > MAX_DISTANCE) break;
    }

    return dist_origin;
}

float ray_march_selector(in vec3 ro, in vec3 rd, int MAX_STEPS)
{
    if (render_mode == 0)
        return ray_march(ro, rd, MAX_STEPS);
    else
        return ray_march_for_function(ro, rd, MAX_STEPS);
}

float GetLight(vec3 p, vec3 n) {
    vec3 l = normalize(light_position - p);
    float max_dist = length(light_position - p);
    float dif = clamp(dot(n, l) * .5 + .5, 0., 1.);

    // Shadows Computation
    // compute shadows
    const float shd_f = 0.5; //shadow force
    vec3 rm_out = shadow(p + n * SURF_DISTANCE * 2.01, l, max_dist);
    float shadow = rm_out.x;
    float min_dist = rm_out.y;
    float min_dist_orig = rm_out.z;
    if(shadow > 0.) { // no shadow
        dif *= shd_f + smoothstep(0.01, 0.04, min_dist) * (1. - shd_f);
    }
    else {
        dif *= shd_f;
    }

    return dif;
}

void main()
{
    vec2 uv = (v_uv - 0.5) * aspect_ratio; // center the uv coordniate
    // light_position.xz = vec2(sin(T), cos(T))*2.;

    vec3 ro = camera_position; // ray origin a.k.a. camera position
    // vec3 rd = vec3(uv, 1.0); // ray direction
    vec3 col = vec3(0);

    vec3 rd = R(uv, ro, camera_target, 1.);
    float dist = FLT_MAX;

    vec4 norm_dist = population_map(ro, rd);
    dist = norm_dist.w;

    if (dist < 0.){
        dist = ray_march_selector(ro, rd, NUMBER_OF_STEPS);

        if(dist < MAX_DISTANCE) {
            vec3 p = ro + rd * dist;
            float f = fun_selection(p.xz);
            vec3 nor = get_normal(p);

            // light computation
            col = vec3(GetLight(p, nor)) * cm_viridis(f * color_range);
        }
    }
    else{
        vec3 p = ro + rd * dist;
        col = vec3(GetLight(p, norm_dist.xyz)) * vec3(0.,0.4,1.);
    }

    col = pow(col, vec3(.4545)); // gamma correction (very important)

    out_color = vec4(col, 1.0);
}