import numpy as np
from Window import Example
from Controls import CameraControl, ShaderControl

class FunctionRender(Example):
    gl_version = (3, 3)
    window_size = (1920, 1080)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.vaos = []

        with open("./shaders/shader.vert") as f:
            VERTEX_SHADER = f.read()
        with open("./shaders/shader2D.frag") as f:
            FRAGMENT_SHADER = f.read()

        program = self.ctx.program(
            vertex_shader=VERTEX_SHADER,
            fragment_shader=FRAGMENT_SHADER
        )

        vertex_data = np.array([
            # x,    y,   z,    u,   v
            -1.0, -1.0, 0.0,  0.0, 0.0,
            +1.0, -1.0, 0.0,  1.0, 0.0,
            -1.0, +1.0, 0.0,  0.0, 1.0,
            +1.0, +1.0, 0.0,  1.0, 1.0,
        ]).astype(np.float32)

        content = [(
            self.ctx.buffer(vertex_data),
            '3f 2f',
            'in_vert', 'in_uv'
        )]

        idx_data = np.array([
            0, 1, 2,
            1, 2, 3
        ]).astype(np.int32)

        idx_buffer = self.ctx.buffer(idx_data)
        self.vao = self.ctx.vertex_array(program, content, idx_buffer)
        program["aspect_ratio"].value = tuple(np.array(self.window_size)/min(self.window_size))

        self.u_time = program.get("T", 0.0)

        # User Controls Variables
        self.mouse = program.get("mouse", [0.0,0.0])
        self.zoom = program.get("zoom", 1.)
        self.last_position = np.array(self.window_size)/2
        self.click_position = np.array([0.0, 0.0])
        self.sc = ShaderControl([program["color_range"]], {">", "<"})

    def render(self, time: float, frame_time: float):
        # self.u_time.value = time
        self.vao.render()
        self.sc.update()
        pass


    def mouse_drag_event(self, x, y, dx, dy):
        self.curr_position = self.last_position - abs(self.zoom.value)*(self.click_position - np.array([x, y]))
        self.mouse.value = tuple(np.array([self.curr_position[0] - self.window_size[0] / 2, self.curr_position[1] - self.window_size[1] / 2]) / np.array(self.window_size))
        pass

    def mouse_press_event(self, x, y, button):
        self.click_position = np.array([x, y])
        pass

    def mouse_release_event(self, x: int, y: int, button: int):
        self.last_position = self.curr_position
        pass
    
    def mouse_scroll_event(self, x_offset, y_offet):
        self.zoom.value -= y_offet*abs(self.zoom.value)*0.1
        pass
    
    def key_event(self, key, action, modifiers):
        keys = self.wnd.keys

        # Key presses
        if action == keys.ACTION_PRESS:
            if key == keys.SPACE:
                self.sc.set_all_speeds(1.5)
            if key == keys.PERIOD:
                self.sc.key_event(">")
            if key == keys.COMMA:
                self.sc.key_event("<")

        # Key releases
        elif action == self.wnd.keys.ACTION_RELEASE:
            if key == keys.SPACE:
                self.sc.set_all_speeds(1.0)
            if key == keys.PERIOD:
                self.sc.key_event(">", False)
            if key == keys.COMMA:
                self.sc.key_event("<", False)



if __name__ == '__main__':
    FunctionRender.run()

    