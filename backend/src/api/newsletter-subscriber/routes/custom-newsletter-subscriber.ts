export default {
  routes: [
    {
      method: 'POST',
      path: '/newsletter-subscribers/subscribe',
      handler: 'newsletter-subscriber.subscribe',
      config: {
        auth: false,
      },
    },
  ],
};
