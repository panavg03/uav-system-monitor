import { supabase } from "../config/supabase.js";

export async function getAllEngines() {
  const { data, error } = await supabase
    .from("engines")
    .select("*");

  if (error) {
    throw error;
  }

  return data;
}

export async function getEngineById(id) {
  const { data, error } = await supabase
    .from("engines")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const error = new Error("Engine not found");
    error.status = 404;
    throw error;
  }

  return data;
}

export async function getEngineTelemetry(id) {
  // Make sure the engine exists
  const { data: engine, error: engineError } = await supabase
    .from("engines")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (engineError) {
    throw engineError;
  }

  if (!engine) {
    const error = new Error("Engine not found");
    error.status = 404;
    throw error;
  }

  // Get all flights for this engine, newest first
  const { data: flights, error: flightError } = await supabase
    .from("flights")
    .select("id, flight_date, flight_length")
    .eq("engine_id", id)
    .order("flight_date", { ascending: false });

  if (flightError) {
    throw flightError;
  }

  // Check each flight until we find one with telemetry
  for (const flight of flights) {
    const { data: telemetry, error: telemetryError } = await supabase
      .from("flight_telemetry")
      .select("flight_id, sensor_data, sample_count")
      .eq("flight_id", flight.id)
      .maybeSingle();

    if (telemetryError) {
      throw telemetryError;
    }

    if (telemetry) {
      return {
        flight_id: flight.id,
        flight_date: flight.flight_date,
        flight_length: flight.flight_length,
        sample_count: telemetry.sample_count,
        telemetry: telemetry.sensor_data
      };
    }
  }

  // No telemetry found for any flight
  return null;
}

export async function getEngineHealth(id) {
  // Make sure the engine exists and get basic health information
  const { data: engine, error: engineError } = await supabase
    .from("engines")
    .select(`
      id,
      engine_id,
      health_score,
      risk_level,
      total_flight_hours,
      last_flight
    `)
    .eq("id", id)
    .maybeSingle();

  if (engineError) {
    throw engineError;
  }

  if (!engine) {
    const error = new Error("Engine not found");
    error.status = 404;
    throw error;
  }

  // Get alerts for this engine
  const { data: alerts, error: alertsError } = await supabase
    .from("alerts")
    .select(`
      id,
      flight_id,
      alert_type,
      severity,
      title,
      message,
      sensor,
      sensor_value,
      threshold_value,
      acknowledged,
      created_at
    `)
    .eq("engine_id", id)
    .order("created_at", { ascending: false });

  if (alertsError) {
    throw alertsError;
  }

  // Get ML predictions through the flights table
  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select(`
      id,
      flight_id,
      model_name,
      model_version,
      is_fault,
      fault_probability,
      fault_class,
      fault_class_probability,
      health_score,
      risk_level,
      created_at,
      flights!inner(engine_id)
    `)
    .eq("flights.engine_id", id)
    .order("created_at", { ascending: false });

  if (predictionsError) {
    throw predictionsError;
  }

  return {
    engine_id: engine.engine_id,
    health_score: engine.health_score,
    risk_level: engine.risk_level,
    total_flight_hours: engine.total_flight_hours,
    last_flight: engine.last_flight,
    alerts: alerts || [],
    predictions: predictions || []
  };
}