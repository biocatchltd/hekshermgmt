import string
import random

def generate_setting_name() -> str:
    return "".join(random.choice(string.ascii_letters) for i in range(10))