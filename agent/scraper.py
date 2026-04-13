"""Website scraper — extracts content from a business URL for profile building."""

import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse


async def scrape_website(url: str, max_pages: int = 10) -> str:
    """
    Scrapes a business website and returns concatenated text content.
    Follows internal links up to max_pages to build a comprehensive picture.
    """
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"

    domain = urlparse(url).netloc
    visited: set[str] = set()
    to_visit = [url]
    all_content: list[str] = []

    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=15.0,
        headers={"User-Agent": "BillSplain Bot/1.0 (business profile builder)"},
    ) as client:
        while to_visit and len(visited) < max_pages:
            current_url = to_visit.pop(0)
            if current_url in visited:
                continue
            visited.add(current_url)

            try:
                response = await client.get(current_url)
                if response.status_code != 200:
                    continue
                if "text/html" not in response.headers.get("content-type", ""):
                    continue
            except (httpx.RequestError, httpx.TimeoutException):
                continue

            soup = BeautifulSoup(response.text, "html.parser")

            # Remove script, style, nav, footer elements
            for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                tag.decompose()

            # Extract page title
            title = soup.title.string.strip() if soup.title and soup.title.string else ""

            # Extract meta description
            meta_desc = ""
            meta_tag = soup.find("meta", attrs={"name": "description"})
            if meta_tag and meta_tag.get("content"):
                meta_desc = meta_tag["content"]

            # Extract main text content
            text = soup.get_text(separator="\n", strip=True)

            # Limit text per page
            text = text[:5000]

            page_content = f"=== PAGE: {current_url} ===\n"
            if title:
                page_content += f"Title: {title}\n"
            if meta_desc:
                page_content += f"Description: {meta_desc}\n"
            page_content += f"\n{text}\n\n"
            all_content.append(page_content)

            # Find internal links to follow
            for link in soup.find_all("a", href=True):
                href = link["href"]
                full_url = urljoin(current_url, href)
                parsed = urlparse(full_url)

                # Only follow same-domain links
                if parsed.netloc == domain and full_url not in visited:
                    # Skip common non-content paths
                    skip = any(
                        s in parsed.path.lower()
                        for s in [
                            "/blog", "/news", "/press", "/careers",
                            "/privacy", "/terms", "/cookie", "/login",
                            "/signup", "/cart", "/checkout",
                        ]
                    )
                    if not skip:
                        to_visit.append(full_url)

    combined = "\n".join(all_content)

    # Truncate to ~30k chars to fit in Claude context
    if len(combined) > 30000:
        combined = combined[:30000] + "\n\n[Content truncated]"

    return combined
