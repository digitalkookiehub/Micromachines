"""Index all existing products into Meilisearch."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.product import Product
from app.services.search import ensure_index, get_meili_client

db = SessionLocal()

# Create index with settings
print("Setting up Meilisearch index...")
ensure_index()

# Get all active products
products = db.query(Product).filter(Product.is_active == True).all()
print(f"Found {len(products)} active products to index")

# Prepare documents
docs = []
for p in products:
    docs.append({
        "id": p.id,
        "name": p.name,
        "brand": p.brand,
        "category": p.category.value,
        "description": p.description or "",
        "sku": p.sku,
        "is_active": p.is_active,
    })

# Index in batch
client = get_meili_client()
index = client.index("products")
task = index.add_documents(docs)
print(f"Indexing task: {task.task_uid}")

# Wait for indexing to complete
import time
for _ in range(30):
    status = client.get_task(task.task_uid)
    if status.status in ("succeeded", "failed"):
        print(f"Indexing {status.status}!")
        if status.status == "failed":
            print(f"Error: {status.error}")
        break
    time.sleep(0.5)

# Verify
stats = index.get_stats()
print(f"Index stats: {stats.number_of_documents} documents indexed")

db.close()
print("Done!")
