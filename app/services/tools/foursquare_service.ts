import axios from 'axios';

export class FoursquareService {
  private readonly baseUrl = process.env.FOURSQUARE_PLACES_API;
  private readonly apiVersion = process.env.FOURSQUARE_API_VERSION;
  private readonly authToken = process.env.FOURSQUARE_SERVICE_KEY;

  /**
   * Search for places in the FSQ Places database using a location and querying by name, category name, telephone number, taste label, or chain name. For example, search for "coffee" to get back a list of recommended coffee shops.
   *
   * You may pass a location with your request by using one of the following options. If none of the following options are passed, Place Search defaults to geolocation using ip biasing with the optional radius parameter.
   *
   * - ll & radius (circular boundary)
   * - near (geocodable locality)
   * - ne & sw (rectangular boundary)
   *
   * @param query - A string to be matched against all content for this place, including but not limited to venue name, category, telephone number, taste, and tips..
   * @param ll - The latitude/longitude around which to retrieve place information. This must be specified as latitude,longitude (e.g., ll=41.8781,-87.6298).
   * @param radius - Sets a radius distance (in meters) used to define an area to bias search results. The maximum allowed radius is 100,000 meters. Radius can be used in combination with ll or ip biased geolocation only. By using radius, global search results will be omitted. If not provided, default radius applied is 22000 meters.
   * @param fsq_category_ids - Filters the response and returns FSQ Places matching the specified categories. Supports multiple Category IDs, separated by commas.For a complete list of Foursquare Category IDs, refer to the Category Taxonomy page.
   * @param fsq_chain_ids - Filters the response and returns FSQ Places matching the specified chains. Supports multiple chain IDs, separated by commas. For more information on Foursquare Chain IDs, refer to the Chains page.
   * @param exclude_fsq_chain_ids - Filters the response and returns FSQ Places not matching any of the specified chains. Supports multiple chain IDs, separated by commas. Cannot be used in conjunction with exclude_all_chains. For more information on Foursquare Chain IDs, refer to the Chains page.
   * @param exclude_all_chains - Filters the response by only returning FSQ Places that are not known to be part of any chain. Cannot be used in conjunction with exclude_chains.
   * @param fields - Indicate which fields to return in the response, separated by commas. If no fields are specified, all Pro Fields are returned by default. For a complete list of returnable fields, refer to the Places Response Fields page.
   * @param min_price - Restricts results to only those places within the specified price range. Valid values range between 1 (most affordable) to 4 (most expensive), inclusive.
   * @param max_price - Restricts results to only those places within the specified price range. Valid values range between 1 (most affordable) to 4 (most expensive), inclusive.
   * @param open_at - Support local day and local time requests through this parameter. To be specified as DOWTHHMM (e.g., 1T2130), where DOW is the day number 1-7 (Monday = 1, Sunday = 7) and time is in 24 hour format. Places that do not have opening hours will not be returned if this parameter is specified. Cannot be specified in conjunction with open_now.
   * @param open_now - Restricts results to only those places that are open now. Places that do not have opening hours will not be returned if this parameter is specified. Cannot be specified in conjunction with open_at.
   * @param tel_format - Phone number format (e.g., "national (default)", "e164").
   * @param ne - The latitude/longitude representing the north/east points of a rectangle. Must be used with sw parameter to specify a rectangular search box. Global search results will be omitted.
   * @param sw - The latitude/longitude representing the south/west points of a rectangle. Must be used with ne parameter to specify a rectangular search box. Global search results will be omitted.
   * @param near - A string naming a locality in the world (e.g., "Chicago, IL"). If the value is not geocodable, returns an error. Global search results will be omitted.
   * @param sort - Specifies the order in which results are listed. Possible values are: relevance (default), rating, distance.
   * @param limit - The number of results to return, up to 50. Defaults to 10.
   */
  public async searchPlaces(
    query: string,
    ll?: string,
    radius?: number,
    fsq_category_ids?: string,
    // fsq_chain_ids?: string,
    // exclude_fsq_chain_ids?: string,
    // exclude_all_chains?: boolean,
    // fields?: string,
    // min_price?: number,
    // max_price?: number,
    // open_at?: string,
    // open_now?: boolean,
    // tel_format?: string,
    // ne?: string,
    // sw?: string,
    // near?: string,
    sort?: string | "DISTANCE",
    limit?: number,
  ) {
    try {
      // Build query parameters
      const params: Record<string, any> = { query };

      if (ll) params.ll = ll;
      if (radius) params.radius = radius;
      if (fsq_category_ids) params.fsq_category_ids = fsq_category_ids;
      // if (fsq_chain_ids) params.fsq_chain_ids = fsq_chain_ids;
      // if (exclude_fsq_chain_ids) params.exclude_fsq_chain_ids = exclude_fsq_chain_ids;
      // if (exclude_all_chains !== undefined) params.exclude_all_chains = exclude_all_chains;
      // if (fields) params.fields = fields;
      // if (min_price) params.min_price = min_price;
      // if (max_price) params.max_price = max_price;
      // if (open_at) params.open_at = open_at;
      // if (open_now !== undefined) params.open_now = open_now;
      // if (tel_format) params.tel_format = tel_format;
      // if (ne) params.ne = ne;
      // if (sw) params.sw = sw;
      // if (near) params.near = near;
      if (sort) params.sort = sort;
      if (limit) params.limit = limit;

      const response = await axios.get(`${this.baseUrl}/search`, {
        params,
        headers: {
          'X-Places-Api-Version': this.apiVersion,
          'accept': 'application/json',
          'authorization': `Bearer ${this.authToken}`
        }
      });

      const responseData = response.data

      return {
        is_error: false,
        data: responseData,
      };

    } catch (error) {
      return {
        is_error: true,
        error_message: 'Failed to fetch Foursquare information',
      }
    }
  }

  /**
   * Extract unique categories from search results
   * This method processes the search results and extracts unique categories
   * with their fsq_category_id, fsq_place_id, and icon information
   * 
   * @param searchResults - The results from searchPlaces method
   * @returns Array of unique categories with required information
   */
  public extractUniqueCategories(searchResults: any) {
    if (!searchResults || !searchResults.results || !Array.isArray(searchResults.results)) {
      return [];
    }

    const categoryMap = new Map();

    searchResults.results.forEach((place: any) => {
      if (place.categories && Array.isArray(place.categories)) {
        place.categories.forEach((category: any) => {
          const categoryKey = category.fsq_category_id;
          
          if (!categoryMap.has(categoryKey)) {
            categoryMap.set(categoryKey, {
              fsq_category_id: category.fsq_category_id,
              fsq_place_id: place.fsq_place_id,
              plural_name: category.plural_name,
              name: category.name,
              short_name: category.short_name,
              icon: category.icon
            });
          }
        });
      }
    });

    return Array.from(categoryMap.values());
  }

  /**
   * Quick Find: Search for places and extract unique categories
   * This is the main method for the Quick Find functionality
   * 
   * @param query - Search query (e.g., "krishna")
   * @param ll - Latitude/longitude (e.g., "18.5941,73.7345")
   * @param radius - Search radius in meters
   * @param fsq_category_ids - Optional category filter
   * @returns Object with search results and unique categories
   */
  public async quickFind(
    query: string,
    ll?: string,
    radius?: number,
    fsq_category_ids?: string,
    limit?: number,
    sort?: string
  ) {
    try {
      // First, search for places
      const searchResult = await this.searchPlaces(query, ll, radius, fsq_category_ids, sort, limit);
      
      if (searchResult.is_error) {
        return searchResult;
      }

      // Extract unique categories from the search results
      const uniqueCategories = this.extractUniqueCategories(searchResult.data);

      return {
        is_error: false,
        data: {
          search_results: searchResult.data,
          unique_categories: uniqueCategories,
          total_categories_found: uniqueCategories.length
        }
      };

    } catch (error) {
      return {
        is_error: true,
        error_message: 'Failed to perform Quick Find search',
      }
    }
  }

  /**
   * Get photos for a specific place using fsq_place_id
   * This method fetches photos from Foursquare's Places API
   * 
   * @param fsq_place_id - Foursquare place ID
   * @returns Array of photos with metadata
   */
  public async getPlacePhotos(fsq_place_id: string, limit: number = 5) {
    try {
      if (!fsq_place_id) {
        return {
          is_error: true,
          error_message: 'fsq_place_id is required',
        };
      }

      const response = await axios.get(`${this.baseUrl}/${fsq_place_id}/photos`, {
        params: {
          limit: limit
        },
        headers: {
          'X-Places-Api-Version': this.apiVersion,
          'accept': 'application/json',
          'authorization': `Bearer ${this.authToken}`
        }
      });

      const responseData = response.data;

      return {
        is_error: false,
        data: responseData,
      };

    } catch (error) {
      console.error('Foursquare Photos API Error:', error);
      
      // Handle specific error cases
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return {
            is_error: true,
            error_message: 'Place not found or no photos available',
          };
        }
        if (error.response?.status === 401) {
          return {
            is_error: true,
            error_message: 'Unauthorized - Invalid API key',
          };
        }
        if (error.response?.status === 429) {
          return {
            is_error: true,
            error_message: 'Rate limit exceeded - Please try again later',
          };
        }
      }

      return {
        is_error: true,
        error_message: 'Failed to fetch photos from Foursquare',
      };
    }
  }
}
