import { BaseSeeder } from '@adonisjs/lucid/seeders'
import LocalTypes from '#models/local_types'

export default class extends BaseSeeder {
  async run() {
    await LocalTypes.createMany([
      {
        name: 'Event Planner',
        description: "Bring every occasion to life with ease! From cozy gatherings to grand celebrations, find venues, ideas, and local services that make planning a breeze. Get inspired by neighborhood vibes and trending experiences to create unforgettable moments. Because the best events start with the perfect plan!",
        icon: "🎯",
      },
      {
        name: 'Newcommer',
        description:"Welcome to your new city—let’s make it feel like home! Find the best places to stay, shop, and explore while getting to know your neighborhood. From daily essentials to exciting experiences, we’ll guide you every step of the way. Start your new chapter with confidence and joy!",
        icon: "✨",
      },
      {
        name: 'Tourist',
        description: "Discover the city like never before! From iconic landmarks to hidden gems, you’ll find everything that makes your trip unforgettable. Get inspired by local flavors, culture, and must-visit spots. Whether it’s your first visit or your tenth, every day can feel like a new adventure!",
        icon: "🌍",
      },
      {
        name: 'Local',
        description: "Fall in love with your own city all over again! Explore neighborhood favorites, try out new hangouts, and uncover experiences right around the corner. From weekend plans to secret gems, there’s always something fresh to enjoy. Your city is buzzing—let’s make the most of it!",
        icon: "🏠",
      },
    ])
  }
}
