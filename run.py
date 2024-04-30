
from mqtt.mqttManager import MqttStarter
from bobaHandler.requests import RequestSender
import time

bobaRequestManager = RequestSender()

def mqttMessageHandler(handler, message):
    bobaRequestManager.PostMqttEvent(handler, message)

try:
    mqtt = MqttStarter()
    mqtt.ConnectToMosquitto(mqttMessageHandler)
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    mqtt.DisconnectMosquitto()
    exit()
except Exception as e:
    print("Unable to start mosquitto. Exception: ", e)
    exit()