/**
 * Open decisions from specification v2, Section 15.
 * Flip these without changing screen structure. Do not treat a flag as a settled research decision.
 */

/** A7 (sex) and A8 (civil status) stay in the written instrument until the analysis plan drops them. */
export const INCLUDE_SEX_AND_CIVIL_STATUS = true;

/**
 * Section T confidentiality sentence.
 * False while any signed-in proponent can read raw responses and sharing with a landlord or the HOA cannot be guaranteed.
 */
export const TENANT_ANSWERS_NOT_SHARED_WITH_LANDLORD_OR_HOA = false;
