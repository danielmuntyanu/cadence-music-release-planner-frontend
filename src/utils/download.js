/**
 * Starts a download from a signed link. Storage answers with Content-Disposition: attachment,
 * so the browser saves the file and the page stays where it is.
 *
 * @param {string} url
 * @param {{ newTab?: boolean }} [options] newTab for links that may open instead of saving,
 *   such as a cover set by an external URL, so the app is not navigated away
 */
export function startDownload(url, { newTab = false } = {}) {
  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener'
  if (newTab) link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  link.remove()
}