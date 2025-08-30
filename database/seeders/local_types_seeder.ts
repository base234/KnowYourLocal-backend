import { BaseSeeder } from '@adonisjs/lucid/seeders'
import LocalTypes from '#models/local_types'

export default class extends BaseSeeder {
  async run() {
    await LocalTypes.createMany([
      {
        icon: "🎉",
        name: 'Event & Occassions',
        description: "Make every occasion memorable! From cozy gatherings to grand celebrations, find venues, ideas, and local services that make planning a breeze. Get inspired by neighborhood vibes and trending experiences to create unforgettable moments!",
        short_description: "Plan unforgettable gatherings with perfect venues, services, and ideas. Make every event simple, stylish, and stress-free",
      },
      {
        icon: "✨",
        name: 'New to City',
        description:"Welcome to your new city. Let's make it feel like home! Find the best places to stay, shop, and explore while getting to know your neighborhood. From daily essentials to exciting experiences, we'll guide you every step of the way to unlock the heart of the city!",
        short_description: "Settle into your new city with ease and excitement. From local shops to must-visit places, we'll help you to unlock the heart of the city!",
      },
      {
        icon: "🌍",
        name: 'Tourist',
        description: "Discover the city like never before! From iconic landmarks to hidden gems, you'll find everything that makes your trip unforgettable. Get inspired by local flavors, culture, and must-visit spots. Whether it's your first visit or your tenth, every day can feel like a new adventure!",
        short_description: "Explore the city's best spots, hidden gems, and local flavors. Every day is a new adventure waiting for you—start exploring now!",
      },
      {
        icon: "🏠",
        name: 'Local',
        description: "Fall in love with your own city all over again! Explore neighborhood favorites, try out new hangouts, and uncover experiences right around the corner. From weekend plans to secret gems, there's always something fresh to enjoy. Your city is buzzing—let's make the most of it!",
        short_description: "Rediscover your city with fresh hangouts, secret gems, and weekend vibes. Fall in love with your hometown again—dive in today!",
      },
    ])
  }
}
