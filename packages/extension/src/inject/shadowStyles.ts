/** Append a `<style>` with the given CSS to a shadow root. */
export function injectShadowStyles(shadow: ShadowRoot, css: string): void {
  const style = document.createElement('style')
  style.textContent = css
  shadow.append(style)
}
