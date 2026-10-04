/**
 * Colored ReCARES wordmark used on auth screens and loaders.
 */
export function RecaresWordmark({ size = 28 }: { size?: number }) {
  return (
    <div className="recares-wordmark" style={{ fontSize: size }} aria-hidden="true">
      <span>Re</span>
      <span className="recares-wordmark__c">C</span>
      <span className="recares-wordmark__ar">AR</span>
      <span className="recares-wordmark__e">E</span>
      <span>S</span>
    </div>
  );
}
