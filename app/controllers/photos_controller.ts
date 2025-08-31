import { HttpContext } from '@adonisjs/core/http'
import { FoursquareService } from '#services/tools/foursquare_service'

export default class PhotosController {
  private foursquareService = new FoursquareService()

  /**
   * Get photos for a specific place using fsq_place_id
   * This endpoint fetches photos from Foursquare's Places API
   * 
   * @param ctx - HTTP context
   * @returns Array of photos with metadata
   */
  public async getPlacePhotos(ctx: HttpContext) {
    try {
      const { fsq_place_id } = ctx.request.qs()

      // Validate required parameters
      if (!fsq_place_id) {
        return ctx.response.badRequest({
          success: false,
          message: 'fsq_place_id parameter is required',
          errors: {
            fsq_place_id: 'fsq_place_id parameter is required to fetch photos'
          }
        })
      }

      // Fetch photos from Foursquare
      const result = await this.foursquareService.getPlacePhotos(fsq_place_id.trim())

      if (result.is_error) {
        // Handle different error types with appropriate HTTP status codes
        if (result.error_message && result.error_message.includes('Place not found')) {
          return ctx.response.notFound({
            success: false,
            message: 'Place not found or no photos available',
            error: result.error_message,
            fsq_place_id: fsq_place_id
          })
        }
        
        if (result.error_message && result.error_message.includes('Unauthorized')) {
          return ctx.response.unauthorized({
            success: false,
            message: 'Authentication failed',
            error: result.error_message
          })
        }
        
        if (result.error_message && result.error_message.includes('Rate limit exceeded')) {
          return ctx.response.tooManyRequests({
            success: false,
            message: 'Rate limit exceeded',
            error: result.error_message
          })
        }

        return ctx.response.internalServerError({
          success: false,
          message: 'Failed to fetch photos',
          error: result.error_message || 'Unknown error occurred'
        })
      }

      // Return successful response with photos data
      return ctx.response.ok({
        success: true,
        message: 'Photos retrieved successfully',
        data: {
          fsq_place_id: fsq_place_id,
          total_photos: Array.isArray(result.data) ? result.data.length : 0,
          photos: result.data
        }
      })

    } catch (error) {
      console.error('Photos Controller Error:', error)
      return ctx.response.internalServerError({
        success: false,
        message: 'Internal server error occurred',
        error: 'An unexpected error occurred while processing your request'
      })
    }
  }

  /**
   * Get photos for a specific place using path parameter
   * Alternative endpoint that accepts fsq_place_id as URL parameter
   * 
   * @param ctx - HTTP context
   * @returns Array of photos with metadata
   */
  public async getPlacePhotosByPath(ctx: HttpContext) {
    try {
      const fsq_place_id = ctx.params.fsq_place_id

      // Validate required parameters
      if (!fsq_place_id) {
        return ctx.response.badRequest({
          success: false,
          message: 'fsq_place_id parameter is required',
          errors: {
            fsq_place_id: 'fsq_place_id parameter is required to fetch photos'
          }
        })
      }
      const limit = 3
      // Fetch photos from Foursquare
      const result = await this.foursquareService.getPlacePhotos(fsq_place_id.trim(), limit)

      if (result.is_error) {
        // Handle different error types with appropriate HTTP status codes
        if (result.error_message && result.error_message.includes('Place not found')) {
          return ctx.response.notFound({
            success: false,
            message: 'Place not found or no photos available',
            error: result.error_message,
            fsq_place_id: fsq_place_id
          })
        }
        
        if (result.error_message && result.error_message.includes('Unauthorized')) {
          return ctx.response.unauthorized({
            success: false,
            message: 'Authentication failed',
            error: result.error_message
          })
        }
        
        if (result.error_message && result.error_message.includes('Rate limit exceeded')) {
          return ctx.response.tooManyRequests({
            success: false,
            message: 'Rate limit exceeded',
            error: result.error_message
          })
        }

        return ctx.response.internalServerError({
          success: false,
          message: 'Failed to fetch photos',
          error: result.error_message || 'Unknown error occurred'
        })
      }

      // Return successful response with photos data
      return ctx.response.ok({
        success: true,
        message: 'Photos retrieved successfully',
        data: {
          fsq_place_id: fsq_place_id,
          total_photos: Array.isArray(result.data) ? result.data.length : 0,
          photos: result.data
        }
      })

    } catch (error) {
      console.error('Photos Controller Error:', error)
      return ctx.response.internalServerError({
        success: false,
        message: 'Internal server error occurred',
        error: 'An unexpected error occurred while processing your request'
      })
    }
  }
}
