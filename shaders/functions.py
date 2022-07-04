FUNCTIONS = {
    "sphere": {
        "function": "f = x*x + y*y;",
        "center":[0,0],
        "normalize": 0.001,
    },

    "rastrigin": { 
        "function": """x = x*x - 10. * cos(2. * PI * x) + 10.;
                    y = y*y - 10. * cos(2. * PI * y) + 10.;
                    f = x+y;""",
        "center":[0,0],
        "normalize": 0.02,
    },

    "ackley": { 
        "function": """f = -20. * exp(-0.2 * sqrt(0.5 * (x * x + y * y))) - exp(0.5 * (cos(2. * PI * x) + cos(2. * PI * y))) + exp(1.) + 20.;""",
        "center":[0,0],
        "normalize": 0.5,
    },

    "griewank": { 
        "function": """f = 1. + (x * x / 4000.) + (y * y / 4000.) - cos(x) * cos(y / SQRT2);""",
        "center":[0,0],
        "normalize": 2,
    },

    "rosenbrock": { 
        "function": """f = 100. * (y - x * x) * (y - x * x) + (1. - x) * (1. - x);""",
        "center":[1,1],
        "normalize": 0.000001,
    },

    "schwefel": {
        "function": """f = 418.9829 * 2. - x * sin(sqrt(abs(x))) - y * sin(sqrt(abs(y)));""",
        "center":[420.968746,420.968746],
        "normalize": 0.02,
    },

    "bukin": { 
        "function": """f = 100. * sqrt(abs(y - 0.01 * x * x)) + 0.01 * abs(x + 10.);""",
        "center":[-10,1],
        "normalize": 0.02,
    },

    "drop_wave": { 
        "function": """f = -(1.+ cos(12. * sqrt(x * x + y * y))) / (0.5 * (x * x + y * y) + 2.);""",
        "center":[0,0],
        "normalize": "f=(f+1.)*0.2;",
    },
    
    "eggholder": { 
        "function": """f = -(y + 47.) * sin(sqrt(abs(x / 2. + y + 47.))) - x * sin(sqrt(abs(x - (y + 47.))));""",
        "center":[512,404.2319],
        "normalize": "f=(f + 959.6407)/50.;",
    },

    "holder_table": { 
        "function": """f = -abs(sin(x) * cos(y) * exp(abs(1. - sqrt(x * x + y * y) / PI)));""",
        "center":[8.05502,9.66459],
        "normalize": "f=(f+19.2085)/5.;",
    },

    "shaffer": { 
        "function": """f = 0.5 + (sin(x + y) + (x - y) * (x - y) - 0.5 * (x + y)) * (sin(x + y) + (x - y) * (x - y) - 0.5 * (x + y)) / (1. + 0.001 * (x + y) * (x + y));""",
        "center":[0,0],
        "normalize": 0.01,
    },

    "custom_copilot": { 
        "function": """f = (sin(x) - x * cos(x)) * (sin(y) - y * cos(y)) * (sin(x + y) - (x + y) * cos(x + y));""",
        "center":[0,0],
        "normalize": 0.01,
    },

    "shuberts": { 
        "function": """
        float f1 = 0., f2 = 0.;
        for(float i = 1.; i < 6.; i+=1.){
            f1 += i*cos((i+1.)*x + i);
            f2 += i*cos((i+1.)*y + i);
        }
        f=(f1*f2);""",
        "center":[0,0],
        "normalize": 0.005,
    },

    "katsuura": { 
        "function": """
            const float arr2k[32] = float[32](2.,4.,8.,16.,32.,64.,128.,256.,512.,1024.,2048.,4096.,8192.,16384.,32768.,65536.,131072.,262144.,524288.,1048576.,2097152.,4194304.,8388608.,16777216.,33554432.,67108864.,134217728.,268435456.,536870912.,1073741824.,2147483648.,4294967296.);
            const float inv_arr2k[32] = float[32](.5,.25,.125,.0625,.03125,.015625,.0078125,.00390625,.001953125,.0009765625,.00048828125,0.000244140625,0.0001220703125,0.00006103515625,0.000030517578125,0.0000152587890625,0.00000762939453125,0.000003814697265625,0.0000019073486328125,0.00000095367431640625,0.000000476837158203125,0.0000002384185791015625,0.00000011920928955078125,0.000000059604644775390625,0.0000000298023223876953125,0.00000001490116119384765625,0.000000007450580596923828125,0.0000000037252902984619140625,0.00000000186264514923095703125,0.000000000931322574615478515625,0.0000000004656612873077392578125,0.00000000023283064365386962890625);


            float arr_x[32];
            float arr_y[32];
            
            // the original katsuura uses max_a = 32
            // but we use max_a = 8 for higher fps
            int i = 0, max_a = 8; 

            for(i = 0; i < max_a; i++){
                arr_x[i] = x * arr2k[i];
                arr_y[i] = y * arr2k[i];
            }

            for(i = 0; i < max_a; i++){
                arr_x[i] = abs(arr_x[i] - round(arr_x[i]));
                arr_y[i] = abs(arr_y[i] - round(arr_y[i]));
            }

            float dot_x = 0., dot_y = 0.;
            for(i = 0; i < max_a; i++){
                dot_x += arr_x[i] * inv_arr2k[i];
                dot_y += arr_y[i] * inv_arr2k[i];
            }

            f = -2.5 + 2.5 * pow((dot_x + 1.) * (dot_y * 2. + 1.), 4.3527528164);
        """,
        "center":[0,0],
        "normalize": 0.0025,
    },

    "weierstrass": { 
        "function": """
            const float inv_arr2k[12] = float[12](1.0,0.5,0.25,0.125,0.0625,0.03125,0.015625,0.0078125,0.00390625,0.001953125,0.0009765625,0.00048828125);
            const float arr3k[12] = float[12](1.,3.,9.,27.,81.,243.,729.,2187.,6561.,19683.,59049.,177147.);

            float x1 = 2 * PI * (x + .5);
            float y1 = 2 * PI * (y + .5);

            float x2 = 0., y2 = 0.;
            for (int i = 0; i < 12; i++){
                x2 += inv_arr2k[i] * cos(x1 * arr3k[i]);
                y2 += inv_arr2k[i] * cos(y1 * arr3k[i]);
            }

            f = ((x2 + y2) * 0.5 + 1.99951171875);
            f = 10. * f*f*f * 0.0005;""",
        "center":[0,0],
        "normalize": 0.0005,
    }
}