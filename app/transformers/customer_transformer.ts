import Customer from '#models/customer'

export default class CustomerTransformer {
  public static async transform(customer: Customer) {

    return {
      id: customer.uuid,

      ...(customer.user && {
        user: {
          id: customer.user.uuid,
          username: customer.user.username,
          first_name: customer.user.first_name,
          last_name: customer.user.last_name,
          full_name: `${customer.user.first_name} ${customer.user.last_name}`.trim(),
          email: customer.user.email,
          phone_number: customer.user.phone_number,
          is_email_verified: customer.user.is_email_verified,
          is_phone_number_verified: customer.user.is_phone_number_verified,
          is_onboarding_complete: customer.user.is_onboarding_complete,
          is_event_created: customer.user.is_event_created,
          onboarding_answers: customer.user.onboarding_answers,
          is_banned: customer.user.is_banned,
        },
      }),

      first_name: customer.first_name,
      last_name: customer.last_name,
      full_name: `${customer.first_name} ${customer.last_name}`.trim(),

      is_event_created: customer.is_event_created,

      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
    }
  }

  public static async collection(customers: Customer[]) {
    return Promise.all(customers.map((customer) => this.transform(customer)))
  }
}
