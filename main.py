import argparse, sys
from scenes import FunctionRender3D, FunctionRender2D, Scene


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="tool to visualize and explore 2D functions in realtime")
    parser.add_argument("--mode", "-d", dest="mode2D", default=False, action="store_true", help="render the function on a 2D plane")
    args = parser.parse_args()
    
    sys.argv = [sys.argv[0]] # modernGL takes some arguments, this line is needed to clean the argv

    scenes = [FunctionRender3D, FunctionRender2D]
    Scene(scenes[1] if args.mode2D else scenes[0])