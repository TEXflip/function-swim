import numpy as np
from scenes.Window import Window
from Controls import ShaderControl

class FunctionRender2D(Window):
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
        self.render_mode = program.get("render_mode", 0.)
        self.last_position = np.array(self.window_size)/2
        self.current_position = self.last_position
        self.click_position = np.array([0.0, 0.0])
        sc_dict = {
            "color_range": {
                "glsl": program["color_range"],
                "symbol": [",", "."],
                "type": "exp"
            },
            "fun_select": {
                "glsl": program["fun_select"],
                "symbol": "/",
                "type": "switch",
                "range": [0,14]
            },
            "render_mode": {
                "glsl": program["render_mode"],
                "symbol": ["num_0", "num_1", "num_2", "num_3"],
                "type": "button",
                "values": [0,1,2,3]
            }
        }
        self.sc = ShaderControl(sc_dict)

    def render(self, time: float, frame_time: float):
        # self.u_time.value = time
        self.vao.render()
        self.sc.update()

    def mouse_drag_event(self, x, y, dx, dy):
        self.curr_position = self.last_position - abs(self.zoom.value)*(self.click_position - np.array([x, y]))
        self.mouse.value = tuple(np.array([self.curr_position[0] - self.window_size[0] / 2, self.curr_position[1] - self.window_size[1] / 2]) / np.array(self.window_size))

    def mouse_press_event(self, x, y, button):
        self.click_position = np.array([x, y])

    def mouse_release_event(self, x: int, y: int, button: int):
        self.last_position = self.curr_position
    
    def mouse_scroll_event(self, x_offset, y_offet):
        self.zoom.value -= y_offet*abs(self.zoom.value)*0.1
    
    def key_event(self, key, action, modifiers):
        keys = self.wnd.keys

        # Key presses
        if action == keys.ACTION_PRESS:
            if key == keys.SPACE:
                self.sc.set_all_speeds(1.5)
            self.sc.key_event(key)

        # Key releases
        elif action == self.wnd.keys.ACTION_RELEASE:
            if key == keys.SPACE:
                self.sc.set_all_speeds(1.0)
            self.sc.key_event(key, False)

