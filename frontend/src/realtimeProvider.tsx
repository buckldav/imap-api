let subscriptions = [];

const dataProvider = {
  // regular dataProvider methods like getList, getOne, etc,
  // ...
  subscribe: async (topic, subscriptionCallback) => {
    subscriptions.push({ topic, subscriptionCallback });
    return Promise.resolve({ data: null });
  },

  unsubscribe: async (topic, subscriptionCallback) => {
    subscriptions = subscriptions.filter(
      (subscription) =>
        subscription.topic !== topic ||
        subscription.subscriptionCallback !== subscriptionCallback
    );
    return Promise.resolve({ data: null });
  },

  publish: (topic, event) => {
    if (!topic) {
      return Promise.reject(new Error("missing topic"));
    }
    if (!event.type) {
      return Promise.reject(new Error("missing event type"));
    }
    subscriptions.map(
      (subscription) =>
        topic === subscription.topic && subscription.subscriptionCallback(event)
    );
    return Promise.resolve({ data: null });
  },
};
