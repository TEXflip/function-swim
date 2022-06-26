import moderngl_window as mglw

class Scene:
    def __init__(self, window_class):
        self.newScene(window_class)

    def run(self):
        mglw.run_window_config(self.window)
    
    def newScene(self, window_class):
        self.window = window_class
        self.run()
