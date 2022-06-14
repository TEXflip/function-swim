import numpy as np

# TODO this camera control system is bad written
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


import operator
# TODO make this fps independent
class ShaderControl:
    def __init__(self, glsl_control_dict: dict):
        self.control_dict = glsl_control_dict
        self.symbols_dict = {}
        for k, v in self.control_dict.items():
            s = v["symbol"]
            if isinstance(s, list):
                if v["type"] in ["exp", "lin"]:
                    self.symbols_dict[s[0]] = {"type": v["type"], "key": k, "press": False, "action": "incr"}
                    self.symbols_dict[s[1]] = {"type": v["type"], "key": k, "press": False, "action": "decr"}
                elif v["type"] in ["button"]:
                    for i, symb in enumerate(s):
                        self.symbols_dict[symb] = {"type": v["type"], "key": k, "press": False, "value": v["values"][i]}
            elif isinstance(s, str):
                self.symbols_dict[s] = {"type": v["type"], "key": k, "press": False, "action": None}

            self.control_dict[k]["value"] = glsl_control_dict[k]["glsl"].value
            self.control_dict[k]["speed"] = 1.0

    def key_event(self, key, press=True):
        if isinstance(key, int):
            key = key_to_symbol(key)
        if key in self.symbols_dict:
            self.symbols_dict[key]["press"] = True if press else False

    def set_all_speeds(self, speed):
        for ctrl in self.control_dict.values():
            ctrl["speed"] = speed

    def set_speed(self, symbol, speed):
        ctrl = self.control_dict[self.symbols_dict[symbol]["key"]]
        ctrl["speed"] = speed
    
    def update_type_exp(self, symbol):
        symb = self.symbols_dict[symbol]
        op = operator.itruediv if "decr"==symb["action"] else operator.imul

        ctrl = self.control_dict[symb["key"]]
        ctrl["value"] = op(ctrl["value"], 1.01 * ctrl["speed"])
        ctrl["glsl"].value = ctrl["value"]
    
    def update_type_lin(self, symbol):
        symb = self.symbols_dict[symbol]
        op = operator.isub if "decr"==symb["action"] else operator.iadd

        ctrl = self.control_dict[symb["key"]]
        ctrl["value"] = op(ctrl["value"], 0.001 * ctrl["speed"])
        ctrl["glsl"].value = ctrl["value"]
    
    def update_type_switch(self, symbol):
        symb = self.symbols_dict[symbol]
        ctrl = self.control_dict[symb["key"]]
        r = ctrl["range"]
        ctrl["value"] = r[0] + ((ctrl["value"] + 1) % (r[1]+1))
        ctrl["glsl"].value = ctrl["value"]
        symb["press"] = False
    
    def update_type_button(self, symbol):
        symb = self.symbols_dict[symbol]
        ctrl = self.control_dict[symb["key"]]
        v = symb["value"]
        ctrl["value"] = v
        ctrl["glsl"].value = v
        symb["press"] = False

    def update(self):
        for symbol in self.symbols_dict.keys():
            if self.symbols_dict[symbol]["press"]:
                self.__getattribute__(f"update_type_{self.symbols_dict[symbol]['type']}")(symbol)
                self.print_value(symbol)
    
    def print_value(self, symbol):
        ctrl = self.control_dict[self.symbols_dict[symbol]["key"]]
        spaces = " "*80
        print(f"{ctrl['glsl'].name}: {ctrl['value']}{spaces}", end="\r")

def key_to_symbol(key):
    if key >= 97 and key <= 122:
        return str(chr(key)).upper()
    if key >= 48 and key <= 57:
        return str(chr(key))
    if key >= 65456 and key <= 65465:
        return "num_"+str(chr(key-65456+48))
    if int(key) in KEY_TO_SYMBOL:
        return KEY_TO_SYMBOL[int(key)]
    return str(chr(key))

KEY_TO_SYMBOL = {
    65379: "ins",
    65535: "del",
    65360: "home",
    65367: "end",
    65365: "pu",
    65366: "pd",
}
    

