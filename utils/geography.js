// Haversine distance in kilometres. The coordinate differences are converted to
// radians, finds the central angle on a spherical Earth, then multiplies it
// by the mean Earth radius (6,371 km). The result is in kilometres so it can
// be shared by nearby-facility and nearby-water-level lookups.
//
// Formula is adapted from: https://www.movable-type.co.uk/scripts/latlong.html
export function distanceInKilometres(firstPoint, secondPoint) {
  const earthRadiusKilometres = 6371;
  const latitudeDifference = ((secondPoint.latitude - firstPoint.latitude) * Math.PI) / 180;
  const longitudeDifference = ((secondPoint.longitude - firstPoint.longitude) * Math.PI) / 180;
  const firstLatitudeRadians = (firstPoint.latitude * Math.PI) / 180;
  const secondLatitudeRadians = (secondPoint.latitude * Math.PI) / 180;
  const haversineTerm =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitudeRadians) * Math.cos(secondLatitudeRadians) * Math.sin(longitudeDifference / 2) ** 2;

  return earthRadiusKilometres * 2 * Math.atan2(Math.sqrt(haversineTerm), Math.sqrt(1 - haversineTerm));
}
