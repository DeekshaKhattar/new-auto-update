import os
import sys
import socket
import win32serviceutil
import win32service
import servicemanager
import win32event
import logging
from datetime import datetime

current_directory = os.getcwd()

path = r'C:\Program Files (x86)\Nexon\resources\nexonservicelog.txt'
if os.path.exists(path):
    log_file = path
else:
    log_file = r'C:\Program Files\Nexon\resources\nexonservicelog.txt'

logging.basicConfig(filename=log_file, level=logging.INFO)

class TeamBotService(win32serviceutil.ServiceFramework):
    _svc_name_ = "NexonService"
    _svc_display_name_ = "Nexon Service"

    def __init__(self, args):
        try:
            win32serviceutil.ServiceFramework.__init__(self, args)
            self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
            socket.setdefaulttimeout(60)
            self.is_alive = True
            logging.info(f'{datetime.now()} : Service has been initialized successfully')
        except Exception as e:
            logging.error(f'{datetime.now()} : {e}')

    def SvcStop(self):
        try:
            self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
            win32event.SetEvent(self.hWaitStop)
            self.is_alive = False
            logging.info(f'{datetime.now()} : Service has been stopped successfully')
        except Exception as e:
            logging.error(e)

    def SvcDoRun(self):
        try:
            servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE,
                                servicemanager.PYS_SERVICE_STARTED,
                                (self._svc_name_, ''))
            self.main()
            logging.info(f'{datetime.now()} : Service has ran successfully')
        except Exception as e:
            logging.error(f'{datetime.now()} : {e}')

    def main(self):
        # Set up the socket server
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind(("127.0.0.1", 12345))  # Change the IP and port as needed
        server_socket.listen(1)

        while self.is_alive:
            try:
                client_socket, client_address = server_socket.accept()
                logging.info(f"{datetime.now()} : Accepted connection from {client_address}")
                command = client_socket.recv(1024).decode("utf-8")
                if not command:
                    break
                if command:
                    for cmd in command.split('<or>'):
                        logging.info(f'{datetime.now()} :Waiting to run {cmd}')
                        exit_code = os.system(cmd)
                        logging.info(f'{datetime.now()} : {cmd} ran with status code {exit_code}')
                        if exit_code == 0:
                            status = f"Command executed successfully: {command}"
                        else:
                            status = f"Command failed with exit code {exit_code}: {command}"
                else:
                    logging.info(f"{datetime.now()} : Invalid command")
                logging.info(f'{datetime.now()} : {status}')
                client_socket.close()
            except Exception as e:
                logging.error(f'{datetime.now()} : {e}')
        server_socket.close()

    # def execute_command(self, command):
    #     os.system(command)


if __name__ == '__main__':
    if len(sys.argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(TeamBotService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(TeamBotService)