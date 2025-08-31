import type Messages from '#models/messages'

export default class MessagesTransformer {
  public static async transform(message: Messages) {
    return {
      id: message.id,
      uuid: message.uuid,
      local_id: message.local_id,
      role: message.message_by,
      message: message.message,
      metadata: message.metadata,
      message_prompt: message.message_prompt,
      message_summary: message.message_summary,
      user: message.user ? {
        id: message.user.id,
        uuid: message.user.uuid,
        first_name: message.user.first_name,
        last_name: message.user.last_name,
        full_name: message.user.full_name,
        email: message.user.email
      } : null,
      customer: message.customer ? {
        id: message.customer.id,
        uuid: message.customer.uuid,
        first_name: message.customer.first_name,
        last_name: message.customer.last_name,
        email: message.customer.email
      } : null,
      created_at: message.createdAt?.toISO(),
      updated_at: message.updatedAt?.toISO(),
    }
  }

  public static async collection(messages: Messages[]) {
    return Promise.all(messages.map((message) => this.transform(message)))
  }
}
