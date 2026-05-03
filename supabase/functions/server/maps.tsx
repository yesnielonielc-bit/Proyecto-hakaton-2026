import { Context } from "npm:hono";

export async function calculateDistance(c: Context) {
  try {
    const { origin, destination } = await c.req.json();

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'Google Maps API key not configured' }, 500);
    }

    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', origin);
    url.searchParams.append('destinations', destination);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('units', 'metric');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.log('Google Maps API error:', data);
      return c.json({ error: 'Failed to calculate distance' }, 400);
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      return c.json({ error: 'No route found' }, 400);
    }

    return c.json({
      distance: element.distance.text,
      distanceValue: element.distance.value,
      duration: element.duration.text,
      durationValue: element.duration.value,
    });
  } catch (error) {
    console.log('Error calculating distance:', error);
    return c.json({ error: 'Failed to calculate distance' }, 500);
  }
}

export async function geocodeAddress(c: Context) {
  try {
    const { address } = await c.req.json();

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      return c.json({ error: 'Google Maps API key not configured' }, 500);
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.append('address', address);
    url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.log('Geocoding error:', data);
      return c.json({ error: 'Failed to geocode address' }, 400);
    }

    const location = data.results[0]?.geometry?.location;
    if (!location) {
      return c.json({ error: 'Location not found' }, 400);
    }

    return c.json({
      lat: location.lat,
      lng: location.lng,
      formattedAddress: data.results[0].formatted_address,
    });
  } catch (error) {
    console.log('Error geocoding address:', error);
    return c.json({ error: 'Failed to geocode address' }, 500);
  }
}
