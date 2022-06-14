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
        with open("./shaders/shader.frag") as f:
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
        # self.mouse = program.get("mouse", [0.0,0.0])
        self.zoom = program.get("zoom", 1.)
        self.last_position = np.array(self.window_size)/2
        self.click_position = np.array([0.0, 0.0])
        self.camera_position = program.get("camera_position", [0.0, 1.0, -2.0])
        self.camera_target = program.get("camera_target", [0.0, 1.0, 0.0])
        self.render_mode = program.get("render_mode", 0)
        self.cm = CameraControl(self.camera_position, self.camera_target)
        sc_dict = {
            "color_range": {
                "glsl": program["color_range"],
                "symbol": [",", "."],
                "type": "exp"
            },
            "res": {
                "glsl": program["res"],
                "symbol": ["pu", "pd"],
                "type": "exp"
            },
            "world_scale": {
                "glsl": program["world_scale"],
                "symbol": ["home", "end"],
                "type": "exp"
            },
            "fun_select": {
                "glsl": program["fun_select"],
                "symbol": "/",
                "type": "switch",
                "range": [0,14]
            }
        }
        self.sc = ShaderControl(sc_dict)
        self.mouse = np.array([0.0, 0.0])

    def render(self, time: float, frame_time: float):
        # self.u_time.value = time
        self.cm.update()
        self.sc.update()
        self.vao.render()
        self.cm.mouse_update(self.mouse)

    def mouse_drag_event(self, x, y, dx, dy):
        # self.curr_position = self.last_position - (self.click_position - np.array([x, y]))
        # self.mouse = tuple(2*np.array([self.curr_position[0] - self.window_size[0] / 2, self.curr_position[1] - self.window_size[1] / 2]) / np.array(self.window_size))
        self.mouse = self.click_position - np.array([x, y])
        self.mouse = self.mouse / np.array(self.window_size)
        pass

    def mouse_press_event(self, x, y, button):
        self.click_position = np.array([x, y])
        pass

    def mouse_release_event(self, x: int, y: int, button: int):
        # self.last_position = self.curr_position
        self.mouse = np.array([0.0, 0.0])
        pass
    
    def mouse_scroll_event(self, x_offset, y_offet):
        self.zoom.value += y_offet
        pass
    
    def key_event(self, key, action, modifiers):
        keys = self.wnd.keys

        # Key presses
        if action == keys.ACTION_PRESS:
            if key == keys.SPACE:
                self.cm.speed = 0.5
                self.sc.set_speed(".", 1.5)
                self.sc.set_speed("pu", 1.1)
            if key == keys.W:
                self.cm.key_event("W")
            if key == keys.A:
                self.cm.key_event("A")
            if key == keys.S:
                self.cm.key_event("S")
            if key == keys.D:
                self.cm.key_event("D")
            if key == keys.F1:
                self.render_mode.value = 0
            if key == keys.F2:
                self.render_mode.value = 1
            self.sc.key_event(key)

            # Using modifiers (shift and ctrl)

            if key == 65505:
                self.cm.key_event("Shift_L")
            if  key == 65507:
                self.cm.key_event("Ctrl_L")

        # Key releases
        elif action == self.wnd.keys.ACTION_RELEASE:
            if key == keys.SPACE:
                self.cm.speed = 0.1
                self.sc.set_all_speeds(1.0)
            if key == keys.W:
                self.cm.key_event("W", False)
            if key == keys.A:
                self.cm.key_event("A", False)
            if key == keys.S:
                self.cm.key_event("S", False)
            if key == keys.D:
                self.cm.key_event("D", False)
            self.sc.key_event(key, False)

            if key == 65505:
                self.cm.key_event("Shift_L", False)
            if key == 65507:
                self.cm.key_event("Ctrl_L", False)


if __name__ == '__main__':
    FunctionRender.run()

    