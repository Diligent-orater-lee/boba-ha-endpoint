// Assuming that MqttStarter and RequestSender have TypeScript definitions available or are converted to TypeScript classes.
import { MqttStarter } from './mqtt/mqttManager';
import { HandlerDetails, RequestSender } from './bobaHandler/requests';

const bobaRequestManager = new RequestSender();

// The 'message' type should be defined based on what postMqttEvent expects, here's a simple guess:
interface Message {
    payload: any;  // Replace 'any' with more specific type if possible
}

function mqttMessageHandler(handler: HandlerDetails, message: Message): void {
    bobaRequestManager.postMqttEvent(handler, message);
}

const mqtt = new MqttStarter();

process.on('SIGINT', () => {
    mqtt.disconnect();
    console.log('Disconnected from MQTT broker');
    process.exit();
});

try {
    mqtt.ConnectToMosquitto(mqttMessageHandler);
    console.log('MQTT Client started successfully');
} catch (error: any) {  // Using 'any' for the error type; consider using a more specific type if known
    console.error("Unable to start mosquitto. Exception:", error);
    process.exit();
}
