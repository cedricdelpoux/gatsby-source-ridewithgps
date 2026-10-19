# Queries

The plugin creates one `RideWithGpsRoute` node per route.

## Fields

| Field                                  | Type        | Description                                                              |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `id`                                   | `ID!`       | RideWithGPS id of the route, as a string                                 |
| `user_id`                              | `Int`       | RideWithGPS id of the owner                                              |
| `name`                                 | `String`    | Name                                                                     |
| `description`                          | `String`    | Description                                                              |
| `distance`                             | `Float`     | Total distance, in meters                                                |
| `elevation_gain`                       | `Float`     | Total elevation gain, in meters                                          |
| `elevation_loss`                       | `Float`     | Total elevation loss, in meters                                          |
| `visibility`                           | `String`    | `public`, `followers_only`, `mutual_followers_only` or `private`         |
| `private`                              | `Boolean`   | `true` for every visibility but `public`                                 |
| `activity_types`                       | `[String]`  | Such as `cycling:road` or `walking:hiking`                               |
| `archived`                             | `Boolean`   | Whether you archived the route                                           |
| `html_url`                             | `String`    | Page of the route on ridewithgps.com                                     |
| `url`                                  | `String`    | API url of the route                                                     |
| `locality`, `administrative_area`      | `String`    | Where the route starts                                                   |
| `country_code`                         | `String`    | Country where the route starts                                           |
| `first_lat`, `first_lng`               | `Float`     | First point of the track                                                 |
| `last_lat`, `last_lng`                 | `Float`     | Last point of the track                                                  |
| `sw_lat`, `sw_lng`, `ne_lat`, `ne_lng` | `Float`     | Bounding box of the track                                                |
| `track_type`                           | `String`    | `loop`, `out_and_back`, `point_to_point` or `unknown`                    |
| `terrain`                              | `String`    | `flat`, `rolling` or `climbing`                                          |
| `difficulty`                           | `String`    | `casual`, `easy`, `moderate`, `hard` or `multi_day`                      |
| `surface`                              | `String`    | `paved`, `mostly_paved`, `mixed_surfaces`, `mostly_unpaved` or `unknown` |
| `unpaved_pct`                          | `Float`     | Share of unpaved points, in percent                                      |
| `created_at`, `updated_at`             | `Date`      | Accepts `formatString`, `fromNow`, `difference` and `locale`             |
| `coordinates`                          | `[[Float]]` | The track, as `[longitude, latitude]` pairs                              |

The other fields RideWithGPS returns, such as `course_points`,
`points_of_interest` or `photos`, are on the node too, typed by Gatsby from
your data. The raw `track_points` are not: `coordinates` replaces them.

## Every route

```graphql
query {
    allRideWithGpsRoute(sort: {created_at: DESC}) {
        nodes {
            id
            name
            distance
            elevation_gain
            private
            coordinates
        }
    }
}
```

## Public routes only

```graphql
query {
    allRideWithGpsRoute(filter: {private: {eq: false}}) {
        nodes {
            name
            html_url
        }
    }
}
```

## One route

```graphql
query ($id: String!) {
    rideWithGpsRoute(id: {eq: $id}) {
        name
        description
        distance
        elevation_gain
        activity_types
        updated_at(fromNow: true)
        coordinates
    }
}
```
