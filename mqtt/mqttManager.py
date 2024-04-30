import yaml
import paho.mqtt.client as mqttClient
from pathlib import Path
import re

class MqttStarter:
    __mosquittoClient = None
    __topicsToSubscribe = None
    __config = None
    __mosquittoHandlers = {}

    def __init__(self) -> None:
        self.__loadConfigFile()
        self.__mosquittoClient = mqttClient.Client(mqttClient.CallbackAPIVersion.VERSION1)
        self.__topicsToSubscribe = self.__getTopicsToSubscribe()

    def __loadConfigFile(self):
        try:
            self.__config = yaml.safe_load(open(str(Path.cwd()) + "/config.yaml"))
        except:
            raise Exception("Unable to read config file")
        # Validating the config file is still pending

    def __getTopicsToSubscribe(self) -> list[tuple[str, int]]:
        handlers = self.__config["mqtt-handlers"]
        result = []
        for itemkey, itemValue in handlers.items():
            self.__mosquittoHandlers[itemkey] = itemValue
            result.append((itemValue["topic"], itemValue["qos"]))
        return result
    
    @staticmethod
    def mqtt_wildcard_match(subscription_pattern, topic):
        pattern = re.escape(subscription_pattern)
        pattern = pattern.replace(r'\+', '[^/]+')
        pattern = pattern.replace(r'\#', '.*')
        return re.match(pattern + '$', topic) is not None

    def __onConnect(self):
        def on_connect(client, userdata, flags, rc):
            if rc == 0:
                print("Connected to broker")
                self.__mosquittoClient.subscribe(self.__topicsToSubscribe)
            else:
                print("Connection failed")
                raise Exception("Unable to connect to mosquitto server")
        return on_connect

    def __onMessage(self, messageHandler):
        def on_message(client, userdata, message):
            handler = next(((itemKey, itemValue) for itemKey, itemValue in self.__mosquittoHandlers.items() if self.mqtt_wildcard_match(itemValue["topic"], message.topic)), None)
            if (handler != None):
                messageHandler(handler, message)
        return on_message

    def ConnectToMosquitto(self, messageHandler):
        mosquittoConfig = self.__config["mosquitto"]
        broker_address= mosquittoConfig["host"]
        port = mosquittoConfig["port"]
        user = mosquittoConfig["user"]
        password = mosquittoConfig["pass"]
        self.__mosquittoClient.username_pw_set(user, password=password)
        self.__mosquittoClient.on_connect= self.__onConnect()
        self.__mosquittoClient.on_message= self.__onMessage(messageHandler)
        self.__mosquittoClient.connect(broker_address, port=port)
        self.__mosquittoClient.loop_start()

    def DisconnectMosquitto(self):
        self.__mosquittoClient.disconnect()
        self.__mosquittoClient.loop_stop()

    
