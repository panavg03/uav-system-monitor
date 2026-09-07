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
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getEngineTelemetry(id) {
  const { data, error } = await supabase
    .from("engines")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getEngineHealth(id) {
  const { data, error } = await supabase
    .from("engines")
    .select("id, engine_id, health_score, risk_level, total_flight_hours, last_flight")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}