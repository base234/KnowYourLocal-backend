import { HttpContext } from '@adonisjs/core/http'
import Locals from '#models/locals'
import LocalTypes from '#models/local_types'
import LocalsTransformer from '#transformers/locals_transformer'

export default class LocalsController {
  /**
   * Display a list of locals
   */
  async index({ request, response }: HttpContext) {
    try {
      const query = Locals.query()
      
      // Add local_type_id filter if provided
      const localTypeId = request.input('local_type_id')
      if (localTypeId) {
        query.where('local_type_id', localTypeId)
      }
      
      // Add search by name if provided
      const search = request.input('search')
      if (search) {
        query.whereILike('name', `%${search}%`)
      }
      
      // Add pagination
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)
      
      // Now try with preload
      const locals = await query
        // .preload('local_type')  // Temporarily commented out to test
        .paginate(page, limit)
      // return locals
      return response.ok(LocalsTransformer.transformPaginated(locals))
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch locals',
        error: error.message
      })
    }
  }

  /**
   * Display a single local
   */
  async show({ params, response }: HttpContext) {
    try {
      const local = await Locals.query()
        .where('id', params.id)
        .preload('local_type')
        .firstOrFail()
      
      return response.ok(LocalsTransformer.transform(local))
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Local not found'
        })
      }
      return response.internalServerError({
        message: 'Failed to fetch local',
        error: error.message
      })
    }
  }

  /**
   * Create a new local
   */
  async store({ request, response }: HttpContext) {
    try {
      const data = request.only(['name', 'detail', 'local_type_id'])
      
      // Validate required fields
      if (!data.name) {
        return response.badRequest({
          message: 'Name is required'
        })
      }

      // Validate local_type_id exists if provided
      if (data.local_type_id) {
        const localType = await LocalTypes.find(data.local_type_id)
        if (!localType) {
          return response.badRequest({
            message: 'Invalid local type ID'
          })
        }
      }

      const local = await Locals.create(data)
      
      // Reload with local_type relationship
      await local.load('local_type')
      
      return response.created(LocalsTransformer.transform(local))
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to create local',
        error: error.message
      })
    }
  }

  /**
   * Update a local
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const local = await Locals.findOrFail(params.id)
      const data = request.only(['name', 'detail', 'local_type_id'])
      
      // Validate local_type_id exists if provided
      if (data.local_type_id) {
        const localType = await LocalTypes.find(data.local_type_id)
        if (!localType) {
          return response.badRequest({
            message: 'Invalid local type ID'
          })
        }
      }
      
      local.merge(data)
      await local.save()
      
      // Reload with local_type relationship
      await local.load('local_type')
      
      return response.ok(LocalsTransformer.transform(local))
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Local not found'
        })
      }
      return response.internalServerError({
        message: 'Failed to update local',
        error: error.message
      })
    }
  }

  /**
   * Delete a local
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const local = await Locals.findOrFail(params.id)
      await local.delete()
      
      return response.ok({
        message: 'Local deleted successfully'
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Local not found'
        })
      }
      return response.internalServerError({
        message: 'Failed to delete local',
        error: error.message
      })
    }
  }
}
