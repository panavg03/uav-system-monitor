// function createTrapService(supabase) {
//   async function getAllTraps() {
//     const { data, error } = await supabase
//       .from("traps")
//       .select("*");

//     if (error) {
//       throw error;
//     }

//     return data;
//   }

//   async function getTrapById(id) {
//     const { data, error } = await supabase
//       .from("traps")
//       .select("*")
//       .eq("id", id)
//       .maybeSingle();

//     if (error) {
//       throw error;
//     }

//     if (!data) {
//       const error = new Error("Trap not found");
//       error.status = 404;
//       throw error;
//     }

//     return data;
//   }

//   return {
//     getAllTraps,
//     getTrapById,
//   };
// }

// export default createTrapService;   