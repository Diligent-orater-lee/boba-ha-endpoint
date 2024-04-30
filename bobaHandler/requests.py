import requests
import yaml
from pathlib import Path

class RequestSender:

    __config = None
    __bobaUrl = None

    def __init__(self) -> None:
        self.__loadConfigFile()

    def __loadConfigFile(self):
        try:
            self.__config = yaml.safe_load(open(str(Path.cwd()) + "/config.yaml"))
            self.__bobaUrl = self.__config["mqtt-handler-manager"]["host"]
        except:
            raise Exception("Unable to read config file")

    def PostMqttEvent(self, handler, message):
        handlerDetails = handler[1]
        url = f"{self.__bobaUrl}/{handlerDetails['handler']}"
        response = requests.post(url, data=message.payload)
        print(response)