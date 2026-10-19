// Declared so that a site's queries work before the first route is fetched,
// and on fields RideWithGPS leaves null on every route. Inference stays on for
// the rest of the route, and for whatever `routes.extend` adds.
const types = `
  type RideWithGpsRoute implements Node {
    id: ID!
    user_id: Int
    url: String
    html_url: String
    name: String
    description: String
    visibility: String
    private: Boolean
    archived: Boolean
    activity_types: [String]
    distance: Float
    elevation_gain: Float
    elevation_loss: Float
    locality: String
    administrative_area: String
    country_code: String
    first_lat: Float
    first_lng: Float
    last_lat: Float
    last_lng: Float
    sw_lat: Float
    sw_lng: Float
    ne_lat: Float
    ne_lng: Float
    track_type: String
    terrain: String
    difficulty: String
    surface: String
    unpaved_pct: Float
    created_at: Date @dateformat
    updated_at: Date @dateformat
    coordinates: [[Float!]!]
  }
`

module.exports = {types}
