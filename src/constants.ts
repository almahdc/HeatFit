/**
 * App-wide constants with no natural home in one component: shared by
 * EarlyAccessBlock, EnergyAssessmentForm and the PDF report generator alike,
 * so it lives here rather than being re-exported from whichever of them
 * happened to define it first.
 */

/** HeatFit's lead inbox: the fallback mailto target and the PDF footer contact. */
export const CONTACT_EMAIL = "heatfit.hello@gmail.com";
