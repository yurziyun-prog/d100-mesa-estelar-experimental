// Transitional runtime context. Domain functions use this explicit shared contract.
// New subsystems should expose pure operations rather than adding hidden globals.
export const state = Object.create(null);
