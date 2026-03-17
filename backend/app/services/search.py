import logging

import meilisearch

from app.config import settings

logger = logging.getLogger(__name__)

INDEX_NAME = "products"


def get_meili_client():
    return meilisearch.Client(settings.MEILISEARCH_URL, settings.MEILISEARCH_MASTER_KEY)


def ensure_index():
    """Create product index if it doesn't exist."""
    client = get_meili_client()
    try:
        client.get_index(INDEX_NAME)
    except meilisearch.errors.MeilisearchApiError:
        client.create_index(INDEX_NAME, {"primaryKey": "id"})
        index = client.index(INDEX_NAME)
        index.update_searchable_attributes(["name", "brand", "description", "category"])
        index.update_filterable_attributes(["category", "brand", "is_active"])
        index.update_sortable_attributes(["name", "created_at"])
        logger.info("Meilisearch index '%s' created", INDEX_NAME)


def index_product(product_data: dict) -> None:
    """Add or update a product in the search index."""
    try:
        client = get_meili_client()
        index = client.index(INDEX_NAME)
        index.add_documents([product_data])
        logger.info("Indexed product %s", product_data.get("id"))
    except Exception:
        logger.exception("Failed to index product")


def remove_product(product_id: int) -> None:
    """Remove a product from the search index."""
    try:
        client = get_meili_client()
        index = client.index(INDEX_NAME)
        index.delete_document(product_id)
    except Exception:
        logger.exception("Failed to remove product %d from index", product_id)


def search_products(query: str, category: str | None = None, limit: int = 20, offset: int = 0) -> dict:
    """Search products via Meilisearch."""
    try:
        client = get_meili_client()
        index = client.index(INDEX_NAME)
        filters = ["is_active = true"]
        if category:
            filters.append(f'category = "{category}"')
        result = index.search(
            query,
            {"filter": " AND ".join(filters), "limit": limit, "offset": offset},
        )
        return {"hits": result.get("hits", []), "total": result.get("estimatedTotalHits", 0)}
    except Exception:
        logger.exception("Meilisearch search failed")
        return {"hits": [], "total": 0}
