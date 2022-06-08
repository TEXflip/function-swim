import numpy as np


# TODO this camera control system is bad, fix it
class CameraControl:
    def __init__(self, glsl_camera_pos, glsl_target_pos):
        self.key_press = {
            "W": self.forward,
            "S": self.backward,
            "A": self.left,
            "D": self.right,
            "Shift_L": self.up,
            "Ctrl_L": self.down
        }
        self.glsl_camera_pos = glsl_camera_pos
        self.glsl_target_pos = glsl_target_pos
        self.camera_position = np.array(glsl_camera_pos.value)
        self.camera_target = np.array(glsl_target_pos.value)
        self.orientation = self.camera_target - self.camera_position

        self.velocity = np.array([0.,0.,0.])
        self.speed = 0.1
        self.euler_rates = np.array([0.,0.,0.])
        self.velocity_contributions = {
            "W": np.zeros(3),
            "S": np.zeros(3),
            "A": np.zeros(3),
            "D": np.zeros(3),
            "Shift_L": np.zeros(3),
            "Ctrl_L": np.zeros(3)
        }
    
    def key_event(self, key, press=True):
        if press:
            self.key_press[key]()
        else:
            self.velocity -= self.velocity_contributions[key]
            # print(self.velocity)
        
    def forward(self):
        vel_contribution = self.__normalize(self.orientation)
        self.velocity += vel_contribution
        self.velocity_contributions["W"] = vel_contribution

    def backward(self):
        vel_contribution = -self.__normalize(self.orientation)
        self.velocity += vel_contribution
        self.velocity_contributions["S"] = vel_contribution

    def right(self):
        right = -np.cross(self.orientation, np.array([0.,1.,0.]))
        vel_contribution = self.__normalize(right)
        self.velocity += vel_contribution
        self.velocity_contributions["D"] = vel_contribution

    def left(self):
        right = np.cross(self.orientation, np.array([0.,1.,0.]))
        vel_contribution = self.__normalize(right)
        self.velocity += vel_contribution
        self.velocity_contributions["A"] = vel_contribution
    
    def up(self):
        vel_contribution = np.array([0.,1.,0.])
        self.velocity += vel_contribution
        self.velocity_contributions["Shift_L"] = vel_contribution
    
    def down(self):
        vel_contribution = np.array([0.,-1.,0.])
        self.velocity += vel_contribution
        self.velocity_contributions["Ctrl_L"] = vel_contribution
    
    def mouse_update(self, _mouse):
        mouse = _mouse * 0.1
        x_rot_axis = np.cross(self.orientation, np.array([0.,1.,0.]))
        orientation = self.__rotation_matrix(-mouse[0], np.array([0.,1.,0.])) @ self.__rotation_matrix(mouse[1], x_rot_axis) @ self.orientation
        x_rot_axis = np.cross(orientation, np.array([0.,1.,0.]))
        if np.linalg.norm(x_rot_axis) > 0.4:
            self.orientation = orientation
        
    def __rotation_matrix(self, angle, axis):
        axis = self.__normalize(axis)
        a = np.cos(angle/2)
        b, c, d = -axis*np.sin(angle/2)
        aa, bb, cc, dd = a*a, b*b, c*c, d*d
        bc, ad, ac, ab, bd, cd = b*c, a*d, a*c, a*b, b*d, c*d
        return np.array([[aa+bb-cc-dd, 2*(bc+ad), 2*(bd-ac)],
                            [2*(bc-ad), aa+cc-bb-dd, 2*(cd+ab)],
                            [2*(bd+ac), 2*(cd-ab), aa+dd-bb-cc]])
        
    def update(self):
        self.camera_position += self.velocity * self.speed
        self.camera_target = self.camera_position + self.orientation
        self.glsl_camera_pos.value = tuple(self.camera_position)
        self.glsl_target_pos.value = tuple(self.camera_target)
    
    def __normalize(self, vec):
        norm = np.linalg.norm(vec)
        if norm == 0: return vec
        return vec / norm


# TODO make this fps independent
class ShaderControl:
    def __init__(self, glsl_color_range, glsl_resolution):
        self.key_press = {
            "<": [False, self.increase_color_range],
            ">": [False, self.decrease_color_range],
            "pu": [False, self.increase_resolution],
            "pd": [False, self.decrease_resolution],
        }
        self.color_range = glsl_color_range.value
        self.glsl_color_range = glsl_color_range
        self.cr_speed = 1.0
        self.resolution = glsl_resolution.value
        self.glsl_resolution = glsl_resolution
        self.res_speed = 1.0

    def key_event(self, key, press=True):
        if press:
            self.key_press[key][0] = True
        else:
            self.key_press[key][0] = False

    def increase_color_range(self):
        self.color_range *= 1.01 * self.cr_speed
        self.glsl_color_range.value = self.color_range


    def decrease_color_range(self):
        self.color_range /= 1.01 * self.cr_speed
        self.glsl_color_range.value = self.color_range

    def increase_resolution(self):
        self.resolution /= 1.01 * self.res_speed
        self.glsl_resolution.value = self.resolution
        print(f"resolution: {self.resolution:.2f}", end="\r")


    def decrease_resolution(self):
        self.resolution *= 1.01 * self.res_speed
        self.glsl_resolution.value = self.resolution
        print(f"resolution: {self.resolution:.2f}", end="\r")

    def update(self):
        for key in self.key_press:
            if self.key_press[key][0]:
                self.key_press[key][1]()
