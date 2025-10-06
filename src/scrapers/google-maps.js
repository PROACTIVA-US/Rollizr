/**
 * Google Maps Places API Integration
 * Scrapes HVAC company data from Google Maps
 */

const axios = require('axios');
require('dotenv').config();

class GoogleMapsScaper {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  /**
   * Search for HVAC companies in a location
   * @param {string} location - City, state (e.g., "Miami, FL")
   * @param {string} query - Search query (default: "HVAC")
   * @param {number} radius - Search radius in meters (default: 50000 = 50km)
   * @returns {Promise<Array>} - Array of company data
   */
  async searchCompanies(location, query = 'HVAC', radius = 50000) {
    if (!this.apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not set in .env file');
    }

    try {
      // First, geocode the location to get lat/lng
      const geoResponse = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params: {
          query: `${query} companies in ${location}`,
          key: this.apiKey,
        },
      });

      if (geoResponse.data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${geoResponse.data.status}`);
      }

      const places = geoResponse.data.results;
      console.log(`Found ${places.length} companies for "${query}" in ${location}`);

      // Get detailed info for each place
      const companies = [];
      for (const place of places) {
        try {
          const details = await this.getPlaceDetails(place.place_id);
          companies.push(details);

          // Respect rate limits
          await this.sleep(100);
        } catch (error) {
          console.error(`Error fetching details for ${place.name}:`, error.message);
        }
      }

      return companies;
    } catch (error) {
      console.error('Error searching Google Maps:', error.message);
      throw error;
    }
  }

  /**
   * Get detailed information about a place
   * @param {string} placeId - Google Place ID
   * @returns {Promise<object>} - Detailed company data
   */
  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,geometry,types,reviews,business_status,photos',
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Place details failed: ${response.data.status}`);
      }

      const place = response.data.result;

      // Extract and normalize data
      const company = this.normalizeCompanyData(place);

      return company;
    } catch (error) {
      console.error('Error fetching place details:', error.message);
      throw error;
    }
  }

  /**
   * Normalize Google Maps data into our company schema
   * @param {object} place - Google Place data
   * @returns {object} - Normalized company data
   */
  normalizeCompanyData(place) {
    // Parse address
    const addressParts = place.formatted_address?.split(',') || [];
    const city = addressParts[addressParts.length - 3]?.trim() || '';
    const stateZip = addressParts[addressParts.length - 2]?.trim() || '';
    const state = stateZip.split(' ')[0] || '';
    const zip = stateZip.split(' ')[1] || '';

    // Extract domain from website
    let domain = null;
    if (place.website) {
      try {
        const url = new URL(place.website);
        domain = url.hostname.replace('www.', '');
      } catch (e) {
        domain = place.website;
      }
    }

    // Determine if 24/7 from opening hours
    const is24_7 = place.opening_hours?.periods?.length === 1 &&
                   place.opening_hours.periods[0].open?.time === '0000' &&
                   place.opening_hours.periods[0].close === undefined;

    // Extract services from types and reviews
    const services = this.extractServices(place.types, place.reviews);

    // Calculate review velocity (reviews in last 6 months)
    const recentReviews = this.calculateReviewVelocity(place.reviews);

    return {
      // Identifiers
      google_place_id: place.place_id,
      legal_name: place.name,
      dba: place.name,

      // Contact info
      domain: domain,
      phone: place.formatted_phone_number,
      website: place.website,

      // Location
      address: place.formatted_address,
      city: city,
      state: state,
      zip: zip,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,

      // Business info
      vertical: 'HVAC',
      business_status: place.business_status || 'OPERATIONAL',

      // Reviews and reputation
      google_reviews: {
        count: place.user_ratings_total || 0,
        average_rating: place.rating || 0,
        recent_velocity: recentReviews.velocity,
        recent_count: recentReviews.count,
        reviews: place.reviews?.slice(0, 5) || [], // Top 5 reviews
      },

      // Operations
      service_hours: is24_7 ? '24/7' : 'Business hours',
      opening_hours: place.opening_hours,
      services: services,

      // Estimated data (will be refined by Profiler agent)
      estimated_employees: this.estimateEmployees(place.user_ratings_total),
      years_in_business: null, // Will extract from reviews/website

      // Metadata
      data_source: 'google_maps',
      scraped_at: new Date().toISOString(),
      raw_data: place, // Store raw data for reference
    };
  }

  /**
   * Extract likely services from business types and reviews
   * @param {Array} types - Google Place types
   * @param {Array} reviews - Recent reviews
   * @returns {Array} - List of services offered
   */
  extractServices(types = [], reviews = []) {
    const services = new Set();

    // Map Google types to services
    const typeMap = {
      'hvac_contractor': ['HVAC Contractor'],
      'plumber': ['Plumbing'],
      'electrician': ['Electrical'],
      'general_contractor': ['General Contracting'],
    };

    types.forEach((type) => {
      if (typeMap[type]) {
        typeMap[type].forEach((s) => services.add(s));
      }
    });

    // Extract from reviews
    const serviceKeywords = {
      'AC Installation': ['install', 'installation', 'new ac', 'new unit'],
      'AC Repair': ['repair', 'fix', 'broken', 'not working'],
      'Heating Services': ['heating', 'furnace', 'heater'],
      'Maintenance Plans': ['maintenance', 'service plan', 'tune-up', 'checkup'],
      'Emergency Service': ['emergency', '24/7', 'same day'],
      'Duct Cleaning': ['duct', 'cleaning', 'air quality'],
    };

    reviews?.forEach((review) => {
      const text = review.text?.toLowerCase() || '';
      Object.entries(serviceKeywords).forEach(([service, keywords]) => {
        if (keywords.some((kw) => text.includes(kw))) {
          services.add(service);
        }
      });
    });

    return Array.from(services);
  }

  /**
   * Calculate review velocity (reviews in last 6 months)
   * @param {Array} reviews - Google reviews
   * @returns {object} - Velocity data
   */
  calculateReviewVelocity(reviews = []) {
    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);

    const recentReviews = reviews.filter((review) => {
      const reviewTime = review.time * 1000; // Convert to milliseconds
      return reviewTime > sixMonthsAgo;
    });

    const count = recentReviews.length;
    const velocity = count >= 15 ? 'high' : count >= 5 ? 'medium' : 'low';

    return { count, velocity };
  }

  /**
   * Estimate employee count based on review volume
   * Rough heuristic: 1 review per 10 customers, 1 tech handles 200 customers/year
   * @param {number} reviewCount - Total review count
   * @returns {number} - Estimated employee count
   */
  estimateEmployees(reviewCount = 0) {
    if (reviewCount < 50) return 3;
    if (reviewCount < 150) return 5;
    if (reviewCount < 300) return 10;
    if (reviewCount < 500) return 15;
    return 20;
  }

  /**
   * Search multiple locations
   * @param {Array} locations - Array of location strings
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Combined results
   */
  async searchMultipleLocations(locations, query = 'HVAC') {
    const allCompanies = [];

    for (const location of locations) {
      console.log(`\nSearching ${location}...`);
      try {
        const companies = await this.searchCompanies(location, query);
        allCompanies.push(...companies);

        // Rate limiting between locations
        await this.sleep(1000);
      } catch (error) {
        console.error(`Error searching ${location}:`, error.message);
      }
    }

    console.log(`\nTotal companies found: ${allCompanies.length}`);
    return allCompanies;
  }

  /**
   * Sleep utility for rate limiting
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = GoogleMapsScaper;
