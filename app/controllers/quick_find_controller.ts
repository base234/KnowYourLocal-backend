import { HttpContext } from '@adonisjs/core/http'
import { FoursquareService } from '#services/tools/foursquare_service'

export default class QuickFindController {
  private foursquareService = new FoursquareService()

  /**
   * Quick Find: Search for places and get unique categories
   * This endpoint allows users to search for places by name/query
   * and get back unique categories found in the search results
   * 
   * @param ctx - HTTP context
   * @returns Search results with unique categories
   */
  public async search(ctx: HttpContext) {
    try {
      const { query, ll, radius, fsq_category_ids } = ctx.request.only([
        'query',
        'll', 
        'radius',
        'fsq_category_ids'
      ])

      // // Validate required parameters
      // if (!query) {
      //   return ctx.response.badRequest({
      //     success: false,
      //     message: 'Query parameter is required',
      //     errors: {
      //       query: 'Query parameter is required for search'
      //     }
      //   })
      // }

      // Validate ll format if provided (should be "latitude,longitude")
      if (ll && !/^-?\d+\.\d+,-?\d+\.\d+$/.test(ll)) {
        return ctx.response.badRequest({
          success: false,
          message: 'Invalid latitude/longitude format',
          errors: {
            ll: 'll parameter should be in format "latitude,longitude" (e.g., "18.5941,73.7345")'
          }
        })
      }

      // Validate radius if provided (should be positive number)
      if (radius && (isNaN(Number(radius)) || Number(radius) <= 0)) {
        return ctx.response.badRequest({
          success: false,
          message: 'Invalid radius value',
          errors: {
            radius: 'Radius should be a positive number in meters'
          }
        })
      }

      // Perform the Quick Find search
      const result = await this.foursquareService.quickFind(
        query,
        ll,
        radius ? Number(radius) : undefined,
        fsq_category_ids
      )

      if (result.is_error) {
        return ctx.response.internalServerError({
          success: false,
          message: 'Failed to perform search',
          error: result.error_message
        })
      }

      return ctx.response.ok({
        success: true,
        message: 'Quick Find search completed successfully',
        data: result.data
      })

    } catch (error) {
      console.error('Quick Find Controller Error:', error)
      return ctx.response.internalServerError({
        success: false,
        message: 'Internal server error occurred',
        error: 'An unexpected error occurred while processing your request'
      })
    }
  }

  /**
   * Get available categories for a specific location
   * This endpoint uses the "geotagging candidates" API (formerly "nearby")
   * to get categories available in a specific area
   * 
   * @param ctx - HTTP context
   * @returns Available categories for the location
   */
  public async getLocationCategories(ctx: HttpContext) {
    try {
      const { ll, radius, fsq_category_ids } = ctx.request.only(['ll', 'radius', 'fsq_category_ids'])


    //   // Validate ll format
    //   if (!/^-?\d+\.\d+,-?\d+\.\d+$/.test(ll)) {
    //     return ctx.response.badRequest({
    //       success: false,
    //       message: 'Invalid latitude/longitude format',
    //       errors: {
    //         ll: 'll parameter should be in format "latitude,longitude" (e.g., "18.5941,73.7345")'
    //       }
    //     })
    //   }

      // Search with a generic query to get all available categories in the area
      const result = await this.foursquareService.quickFind(
        '', // Empty query to get all places in the area
        ll,
        radius ? Number(radius) : undefined,
        fsq_category_ids ? fsq_category_ids : undefined
      )

      if (result.is_error) {
        return ctx.response.internalServerError({
          success: false,
          message: 'Failed to get location categories',
          error: result.error_message
        })
      }

      return ctx.response.ok({
        success: true,
        message: 'Location categories retrieved successfully',
        data: {
          location: ll,
          radius: radius ? Number(radius) : 'default (22000m)',
          total_categories_found: result.data.total_categories_found,
          categories: result.data.unique_categories
        }
      })

    } catch (error) {
      console.error('Get Location Categories Error:', error)
      return ctx.response.internalServerError({
        success: false,
        message: 'Internal server error occurred',
        error: 'An unexpected error occurred while processing your request'
      })
    }
  }
}

