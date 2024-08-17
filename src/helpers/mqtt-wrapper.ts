import mqtt from "mqtt";

export type Subscriber = (message: Buffer) => void;
export class MQTTWrapper {
  private client: mqtt.MqttClient;
  private subscribers: Map<string, Set<Subscriber>> = new Map();
  private recentMessages: Record<string, Buffer[]> = {};

  constructor(brokerUrl: string) {
    this.client = mqtt.connect(brokerUrl);

    this.client.on("connect", () => {
      console.log("Connected to MQTT broker");
    });

    this.client.on("error", (error) => {
      console.error("MQTT error:", error);
    });

    this.client.on("message", (topic, message) => {
      const topicSubscribers = this.subscribers.get(topic);
      if (topicSubscribers) {
        for (const topicSubscriber of topicSubscribers) {
          topicSubscriber(message);
        }
      }
    });
  }

  subscribe(topic: string, callback: Subscriber) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
      this.client.subscribe(topic);
    }
    this.subscribers.get(topic)!.add(callback);
  }

  unsubscribe(topic: string, callback: Subscriber) {
    const topicSubscribers = this.subscribers.get(topic);
    if (topicSubscribers) {
      topicSubscribers.delete(callback);
      if (topicSubscribers.size === 0) {
        this.subscribers.delete(topic);
        this.client.unsubscribe(topic);
      }
    }
  }

  publish(topic: string, message: string) {
    this.client.publish(topic, message);
  }

  disconnect() {
    this.client.end();
  }
}
