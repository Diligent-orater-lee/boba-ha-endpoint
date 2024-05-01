import axios from 'axios';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

export interface HandlerDetails {
    handler: string;
}

interface Message {
    payload: any; // Consider specifying a more precise type if possible
}

interface Config {
    'mqtt-handler-manager': {
        host: string;
    }
}

export class RequestSender {
    private bobaUrl: string | null;
    private config: Config | null;

    constructor() {
        this.config = null;
        this.bobaUrl = null;
        this.loadConfigFile();
    }

    private loadConfigFile(): void {
        try {
            const configPath = path.join(process.cwd(), 'config.yaml');
            const fileContents = fs.readFileSync(configPath, 'utf8');
            this.config = yaml.load(fileContents) as Config;
            this.bobaUrl = this.config['mqtt-handler-manager']['host'];
        } catch (error) {
            throw new Error("Unable to read config file");
        }
    }

    public async postMqttEvent(handler: HandlerDetails, message: Message): Promise<void> {
        try {
            const url = `${this.bobaUrl}/${handler.handler}`;
            const response = await axios.post(url, message.payload);
            console.log(response.data);
        } catch (error) {
            console.error('Error posting MQTT event:', error);
        }
    }
}
