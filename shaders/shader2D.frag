#version 430
uniform float T;
uniform vec2 aspect_ratio = vec2(16.,9.)/9.;
uniform vec2 mouse = vec2(0.,0.);
uniform float zoom = 20.;
uniform float color_range = 0.5;
uniform float res = 0.5;

// in vec2 v_uv: screen space coordniate
in vec2 v_uv;
// out color
out vec4 out_color;
const float pi = 3.1415926535897932384626433832795;
const float sqrt2 = 1.4142135623730950488016887242097;

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

vec3 cm_magma(float t) {
    if (abs(t-0.5) > 0.5)
        return vec3(1.);

    const vec3 c0 = vec3(-0.002136485053939582, -0.000749655052795221, -0.005386127855323933);
    const vec3 c1 = vec3(0.2516605407371642, 0.6775232436837668, 2.494026599312351);
    const vec3 c2 = vec3(8.353717279216625, -3.577719514958484, 0.3144679030132573);
    const vec3 c3 = vec3(-27.66873308576866, 14.26473078096533, -13.64921318813922);
    const vec3 c4 = vec3(52.17613981234068, -27.94360607168351, 12.94416944238394);
    const vec3 c5 = vec3(-50.76852536473588, 29.04658282127291, 4.23415299384598);
    const vec3 c6 = vec3(18.65570506591883, -11.48977351997711, -5.601961508734096);

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
    // f = rastrigin(c);
    // f = ackley(c);
    // f = griewank(c);
    f = rosenbrock(c);
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

void main()
{
    vec2 m = mouse;
    m.x *=-1;
    vec2 uv = (v_uv - 0.5) * aspect_ratio * abs(zoom);
    uv += m * aspect_ratio;

    vec3 col = cm_viridis(fun_selection(uv) * color_range);

    out_color = vec4(col, 1.0);
}