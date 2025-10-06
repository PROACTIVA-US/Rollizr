/**
 * Yelp Fusion API Integration
 * Scrapes HVAC company data from Yelp
 */

const axios = require('axios');
require('dotenv').config();

class YelpScraper {
  constructor() {
    this.apiKey = process.env.YELP_API_KEY;
    this.baseUrl = 'https://api.yelp.com/v3';
  }

  /**
   * Search for businesses in a location
   * @param {string} location - City, state (e.g., "Miami, FL")
   * @param {string} term - Search term (default: "HVAC")
   * @param {number} limit - Results per page (max 50)
   * @returns {Promise<Array>} - Array of business data
   */
  async searchBusinesses(location, term = 'HVAC', limit = 50) {
    if (!this.apiKey) {
      throw new Error('YELP_API_KEY not set in .env file');
    }

    try {
      const allBusinesses = [];
      let offset = 0;
      const maxResults = 200; // Yelp API limit

      while (offset < maxResults) {
        const response = await axios.get(`${this.baseUrl}/businesses/search`, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
          params: {
            term: term,
            location: location,
            limit: limit,
            offset: offset,
            sort_by: 'rating',
          },
        });

        const businesses = response.data.businesses;
        allBusinesses.push(...businesses);

        console.log(`Retrieved ${businesses.length} businesses (offset: ${offset})`);

        // Check if we've reached the end
        if (businesses.length < limit) {
          break;
        }

        offset += limit;

        // Rate limiting
        await this.sleep(500);
      }

      console.log(`Total businesses found on Yelp: ${allBusinesses.length}`);

      // Get detailed info for each business
      const companiesWithDetails = [];
      for (const business of allBusinesses) {
        try {
          const details = await this.getBusinessDetails(business.id);
          companiesWithDetails.push(details);

          await this.sleep(100);
        } catch (error) {
          console.error(`Error fetching details for ${business.name}:`, error.message);
          // Fall back to basic data
          companiesWithDetails.push(this.normalizeCompanyData(business));
        }
      }

      return companiesWithDetails;
    } catch (error) {
      console.error('Error searching Yelp:', error.message);
      throw error;
    }
  }

  /**
   * Get detailed business information
   * @param {string} businessId - Yelp business ID
   * @returns {Promise<object>} - Detailed business data
   */
  async getBusinessDetails(businessId) {
    try {
      const response = await axios.get(`${this.baseUrl}/businesses/${businessId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const business = response.data;

      // Get reviews
      const reviews = await this.getBusinessReviews(businessId);
      business.reviews = reviews;

      return this.normalizeCompanyData(business);
    } catch (error) {
      console.error('Error fetching business details:', error.message);
      throw error;
    }
  }

  /**
   * Get business reviews
   * @param {string} businessId - Yelp business ID
   * @returns {Promise<Array>} - Array of reviews
   */
  async getBusinessReviews(businessId) {
    try {
      const response = await axios.get(`${this.baseUrl}/businesses/${businessId}/reviews`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data.reviews || [];
    } catch (error) {
      console.error('Error fetching reviews:', error.message);
      return [];
    }
  }

  /**
   * Normalize Yelp data into our company schema
   * @param {object} business - Yelp business data
   * @returns {object} - Normalized company data
   */
  normalizeCompanyData(business) {
    // Extract domain from URL if available
    let domain = null;
    if (business.url) {
      try {
        const url = new URL(business.url);
        domain = url.hostname.replace('www.', '');
      } catch (e) {
        domain = null;
      }
    }

    // Determine if 24/7
    const is24_7 = business.hours?.[0]?.is_open_now &&
                   business.hours[0]?.open?.some(
                     (h) => h.start === '0000' && h.end === '0000'
                   );

    // Extract services from categories
    const services = this.extractServices(business.categories, business.reviews);

    // Parse phone number
    const phone = business.phone || business.display_phone;

    return {
      // Identifiers
      yelp_id: business.id,
      legal_name: business.name,
      dba: business.name,

      // Contact info
      domain: domain,
      phone: phone,
      website: business.url, // This is Yelp URL, not company website

      // Location
      address: business.location?.address1,
      city: business.location?.city,
      state: business.location?.state,
      zip: business.location?.zip_code,
      latitude: business.coordinates?.latitude,
      longitude: business.coordinates?.longitude,

      // Business info
      vertical: 'HVAC',
      business_status: business.is_closed ? 'CLOSED' : 'OPERATIONAL',

      // Reviews and reputation
      yelp_reviews: {
        count: business.review_count || 0,
        average_rating: business.rating || 0,
        reviews: business.reviews || [],
        yelp_url: business.url,
      },

      // Operations
      service_hours: is24_7 ? '24/7' : 'Business hours',
      categories: business.categories?.map((c) => c.title) || [],
      services: services,
      price_range: business.price,

      // Transactions
      transactions: business.transactions || [], // delivery, pickup, etc.

      // Estimated data
      estimated_employees: this.estimateEmployees(business.review_count),

      // Metadata
      data_source: 'yelp',
      scraped_at: new Date().toISOString(),
      raw_data: business,
    };
  }

  /**
   * Extract services from categories and reviews
   * @param {Array} categories - Yelp categories
   * @param {Array} reviews - Yelp reviews
   * @returns {Array} - Extracted services
   */
  extractServices(categories = [], reviews = []) {
    const services = new Set();

    // Map Yelp categories to services
    const categoryMap = {
      'HVAC': ['HVAC Services'],
      'Heating & Air Conditioning/HVAC': ['HVAC Services'],
      'Air Duct Cleaning': ['Duct Cleaning'],
      'Home Services': ['Residential Services'],
      'Plumbing': ['Plumbing'],
      'Electricians': ['Electrical'],
    };

    categories.forEach((cat) => {
      const title = cat.title || cat.alias;
      if (categoryMap[title]) {
        categoryMap[title].forEach((s) => services.add(s));
      }
    });

    // Extract from reviews
    const serviceKeywords = {
      'AC Installation': ['install', 'installation', 'new ac'],
      'AC Repair': ['repair', 'fix', 'broken'],
      'Heating Services': ['heating', 'furnace', 'heater'],
      'Maintenance Plans': ['maintenance', 'tune-up'],
      'Emergency Service': ['emergency', 'same day', 'quick response'],
      'Duct Cleaning': ['duct', 'cleaning'],
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
   * Estimate employee count
   * @param {number} reviewCount - Total review count
   * @returns {number} - Estimated employees
   */
  estimateEmployees(reviewCount = 0) {
    if (reviewCount < 30) return 3;
    if (reviewCount < 100) return 5;
    if (reviewCount < 200) return 10;
    if (reviewCount < 400) return 15;
    return 20;
  }

  /**
   * Search multiple locations
   * @param {Array} locations - Array of location strings
   * @param {string} term - Search term
   * @returns {Promise<Array>} - Combined results
   */
  async searchMultipleLocations(locations, term = 'HVAC') {
    const allBusinesses = [];

    for (const location of locations) {
      console.log(`\nSearching Yelp in ${location}...`);
      try {
        const businesses = await this.searchBusinesses(location, term);
        allBusinesses.push(...businesses);

        await this.sleep(1000);
      } catch (error) {
        console.error(`Error searching ${location}:`, error.message);
      }
    }

    console.log(`\nTotal businesses from Yelp: ${allBusinesses.length}`);
    return allBusinesses;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = YelpScraper;
