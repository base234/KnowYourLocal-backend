import Locals from '#models/locals'

export default class LocalsTransformer {
  public static async transform(local: Locals) {
    return {
      uuid: local.uuid,
      name: local.name,
      description: local.description,
      local_type_id: local.local_type_id,
      local_type: local.local_type ? {
        id: local.local_type.uuid,
        icon: local.local_type.icon,
        name: local.local_type.name,
        short_description: local.local_type.short_description,
        description: local.local_type.description,
      } : null,
      co_ordinates: local.co_ordinates,
      location_search_query: local.location_search_query,
      radius: local.radius,
      created_at: local.createdAt?.toISO(),
      updated_at: local.updatedAt?.toISO(),
    }
  }

  public static async collection(locals: Locals[]) {
    return Promise.all(locals.map((local) => this.transform(local)))
  }
}
