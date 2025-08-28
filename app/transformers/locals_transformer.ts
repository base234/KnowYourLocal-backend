import Locals from '#models/locals'

export default class LocalsTransformer {
  static transform(local: Locals) {
    return {
      id: local.id,
      uuid: local.uuid,
      name: local.name,
      detail: local.detail,
      local_type_id: local.local_type_id,
      local_type: local.local_type ? {
        id: local.local_type.id,
        name: local.local_type.name,
        description: local.local_type.description,
        icon: local.local_type.icon,
      } : null,
      created_at: local.createdAt?.toISO(),
      updated_at: local.updatedAt?.toISO(),
    }
  }

  static transformMany(locals: Locals[]) {
    return locals.map(local => this.transform(local))
  }

  static transformPaginated(paginatedData: any) {
    return {
      data: this.transformMany(paginatedData.rows || []),
      meta: {
        current_page: paginatedData.currentPage,
        last_page: paginatedData.lastPage,
        per_page: paginatedData.perPage,
        total: paginatedData.total,
        from: paginatedData.firstPage,
        to: paginatedData.lastPage,
      },
    }
  }
}
