/** A visual "→" that screen readers hear as "to". */
export function Arrow() {
  return (
    <>
      <span aria-hidden="true">→</span>
      <span className="visually-hidden">to</span>
    </>
  )
}
