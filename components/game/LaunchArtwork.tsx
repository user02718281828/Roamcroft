/** User-supplied brand illustration. It is not an in-game screenshot. */
export default function LaunchArtwork() {
  return <img className="launch-art" src="/brand/roamcroft-logo.webp" width={900} height={507}
    alt="Roamcroft" fetchPriority="high" decoding="async"/>;
}
