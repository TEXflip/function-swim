import os

# check if this os is debian based
if os.path.exists('/etc/debian_version'):
    machine = os.popen('uname -m').read().strip()

    # Path of the Bash configuration file
    bashrc_path = os.path.expanduser("~/.bashrc")

    # Create a dictionary of environment variables
    env_vars = {}
    with open(bashrc_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("export "):
                parts = line.split("=")
                key = parts[0].split()[1]
                value = "=".join(parts[1:])
                env_vars[key] = value

    if not ("LD_PRELOAD" in env_vars):
        # run find command and read output
        output = os.popen('find / -name libstdc++.so.6 2>/dev/null').read()
        # split output by new line
        output = output.split('\n')
        LD_PRELOAD = ""
        for line in output:
            if "usr" in line and machine in line:
                print("found libstdc++.so.6 at", line)
                LD_PRELOAD = line.strip()
                break
        
        # Define the environment variable
        env_var_name = "MY_VAR"
        env_var_value = "my_value"

        # Set the environment variable for the current Python process
        os.environ['LD_PRELOAD'] = LD_PRELOAD

        # Add the environment variable to ~/.bashrc
        bashrc_path = os.path.expanduser("~/.bashrc")
        with open(bashrc_path, "a") as f:
            f.write(f"\n# Added by Python script: function-swim setup\nexport LD_PRELOAD={LD_PRELOAD}\n")
    else:
        print("LD_PRELOAD already set")
