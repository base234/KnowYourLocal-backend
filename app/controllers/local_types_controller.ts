import { HttpContext } from '@adonisjs/core/http'
import LocalTypes from '#models/local_types'
import LocalTypesTransformer from '#transformers/local_types_transformer'

export default class LocalTypesController {
  /**
   * Display a list of local types
   */
  async index({ response }: HttpContext) {
    try {
      const localTypes = await LocalTypes.all()
      return response.ok(LocalTypesTransformer.transformMany(localTypes))
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch local types',
        error: error.message
      })
    }
  }

  /**
   * Display a single local type
   */
  async show({ params, response }: HttpContext) {
    try {
      const localType = await LocalTypes.findOrFail(params.id)
      return response.ok(LocalTypesTransformer.transform(localType))
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Local type not found'
        })
      }
      return response.internalServerError({
        message: 'Failed to fetch local type',
        error: error.message
      })
    }
  }

  /**
   * Create a new local type
   */
  async store({ request, response }: HttpContext) {
    try {
      const data = request.only(['name', 'description', 'icon'])
      
      // Validate required fields
      if (!data.name) {
        return response.badRequest({
          message: 'Name is required'
        })
      }

      const localType = await LocalTypes.create(data)
      return response.created(LocalTypesTransformer.transform(localType))
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to create local type',
        error: error.message
      })
    }
  }

  /**
   * Update a local type
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const localType = await LocalTypes.findOrFail(params.id)
      const data = request.only(['name', 'description', 'icon'])
      
      localType.merge(data)
      await localType.save()
      
      return response.ok(LocalTypesTransformer.transform(localType))
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Local type not found'
        })
      }
      return response.internalServerError({
        message: 'Failed to update local type',
        error: error.message
      })
    }
  }

  /**
   * Delete a local type
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const localType = await LocalTypes.findOrFail(params.id)
      await localType.delete()
      
      return response.ok({
        message: 'Local type deleted successfully'
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Local type not found'
        })
      }
      return response.internalServerError({
        message: 'Failed to delete local type',
        error: error.message
      })
    }
  }
}
