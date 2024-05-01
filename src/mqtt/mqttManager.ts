import mqtt from 'mqtt';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { OperationCanceledException } from 'typescript';

interface MosquittoConfig {
    user: string;
    pass: string;
    host: string;
    port: number;
}

interface HandlerConfig {
    topic: string;
    qos: number;
}

export class MqttStarter {
    private mosquittoClient!: mqtt.MqttClient;
    private config: any; // Ideally, define a more specific type
    private topicsToSubscribe!: Array<[string, number]>;
    private mosquittoHandlers: { [key: string]: HandlerConfig } = {};

    constructor() {
      this.config = this.loadConfigFile();
    }

    public ConnectToMosquitto(callBack: Function) {
      this.mosquittoClient = mqtt.connect(this.getMosquittoUrl(this.config.mosquitto));
      this.topicsToSubscribe = this.getTopicsToSubscribe();

      this.mosquittoClient.on('connect', () => {
          console.log("Connected to broker");
          this.topicsToSubscribe.forEach(topic => {
              this.mosquittoClient.subscribe(topic[0]);
          });
      });

      this.mosquittoClient.on('message', (topic, message) => {
          let handler = this.findHandlerForTopic(topic);
          if (handler) {
              this.handleMessage(handler, message);
          }
      });

      this.mosquittoClient.on('error', (error) => {
        console.error("Connection failed:", error);
        throw new OperationCanceledException()
      });
    }

    private loadConfigFile(): any { // Should define an interface for the return type
        try {
            const configPath = path.join(process.cwd(), 'config.yaml');
            const fileContents = fs.readFileSync(configPath, 'utf8');
            return yaml.load(fileContents);
        } catch (error) {
            throw new Error("Unable to read config file");
        }
    }

    private getMosquittoUrl(mosquittoConfig: MosquittoConfig): string {
        return `mqtt://${mosquittoConfig.user}:${mosquittoConfig.pass}@${mosquittoConfig.host}:${mosquittoConfig.port}`;
    }

    private getTopicsToSubscribe(): Array<[string, number]> {
        const handlers = this.config['mqtt-handlers'];
        let topics: Array<[string, number]> = [];
        for (const key in handlers) {
            this.mosquittoHandlers[key] = handlers[key];
            topics.push([handlers[key]['topic'], handlers[key]['qos']]);
        }
        return topics;
    }

    private findHandlerForTopic(topic: string): [string, HandlerConfig] | null {
        for (const key in this.mosquittoHandlers) {
            if (this.mqttWildcardMatch(this.mosquittoHandlers[key]['topic'], topic)) {
                return [key, this.mosquittoHandlers[key]];
            }
        }
        return null;
    }

    private mqttWildcardMatch(subscriptionPattern: string, topic: string): boolean {
        const pattern = subscriptionPattern.replace(/\+/g, '[^\/]+').replace(/#/g, '.*');
        return new RegExp(`^${pattern}$`).test(topic);
    }

    private handleMessage(handler: [string, HandlerConfig], message: any): void {
        console.log(`Handling message for ${handler[0]}: ${message.toString()}`);
    }

    public disconnect(): void {
        this.mosquittoClient.end();
    }
}
