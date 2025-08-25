import User from '#models/user'

export default class UserTransformer {
  public static async transform(user: User) {
    await user.load('role')
    await user.load('customer')

    return {
      id: user.uuid,

      ...(user.role && {
        role: user.role.type,
        role_description: user.role.description,
      }),

      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      phone_number: user.phone_number,
      is_email_verified: user.is_email_verified,
      is_phone_number_verified: user.is_phone_number_verified,
      is_onboarding_complete: user.is_onboarding_complete,
      is_banned: user.is_banned,

      ...(user.role.type === 'customer' && {
        is_event_created: user.customer?.is_event_created,

        customer: {
          id: user.customer?.uuid,
          first_name: user.customer?.first_name,
          last_name: user.customer?.last_name,
          full_name: `${user.customer?.first_name} ${user.customer?.last_name}`.trim(),
        },
      }),

      created_at: user.createdAt,
      updated_at: user.updatedAt,
    }
  }

  public static async collection(users: User[]) {
    return Promise.all(users.map((user) => this.transform(user)))
  }
}
