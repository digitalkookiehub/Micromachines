import logging

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def process_product_image(self, draft_id: int) -> dict:
    """Process uploaded product image with AI vision and web scraping."""
    from app.database import SessionLocal
    from app.models.product import ProductDraft, DraftStatus
    from app.services.ai_vision import analyze_product_image

    logger.info("Processing product draft %d", draft_id)
    db = SessionLocal()
    try:
        draft = db.query(ProductDraft).filter(ProductDraft.id == draft_id).first()
        if not draft:
            logger.error("Draft %d not found", draft_id)
            return {"status": "failed", "draft_id": draft_id}

        # Step 1: AI Vision analysis
        ai_data = analyze_product_image(draft.image_url)
        draft.ai_detected_data = ai_data

        # Step 2: Web search for specs (sync wrapper)
        brand = ai_data.get("brand", "Unknown")
        model = ai_data.get("model", "Unknown")
        web_data = {
            "description": f"{brand} {model} - Computer peripheral. Please review and update.",
            "specifications": ai_data.get("visible_features", []),
        }
        draft.web_scraped_data = web_data

        # Step 3: Merge into final_data
        draft.final_data = {
            "name": ai_data.get("name", f"{brand} {model}"),
            "brand": brand,
            "category": ai_data.get("category", "accessories"),
            "description": web_data.get("description", ""),
            "specifications": {
                feat: "Yes" for feat in ai_data.get("visible_features", [])
            },
        }
        draft.status = DraftStatus.review
        db.commit()

        logger.info("Draft %d processed successfully", draft_id)
        return {"status": "review", "draft_id": draft_id}

    except Exception as exc:
        logger.exception("Failed to process draft %d", draft_id)
        if draft:
            draft.status = DraftStatus.failed
            db.commit()
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()


@celery_app.task(bind=True, max_retries=3)
def generate_invoice_pdf(self, order_id: int) -> dict:
    """Generate invoice for a paid order."""
    from app.database import SessionLocal
    from app.models.order import Order
    from app.models.invoice import Invoice
    from app.services.invoice_generator import generate_invoice

    logger.info("Generating invoice for order %d", order_id)
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return {"status": "failed", "order_id": order_id}

        existing = db.query(Invoice).filter(Invoice.order_id == order_id).first()
        if existing:
            return {"status": "exists", "invoice_id": existing.id}

        invoice = generate_invoice(order, db)
        # TODO: Generate actual PDF with ReportLab and upload to S3
        logger.info("Invoice %s generated", invoice.invoice_number)
        return {"status": "success", "invoice_id": invoice.id}
    except Exception as exc:
        logger.exception("Failed to generate invoice for order %d", order_id)
        raise self.retry(exc=exc, countdown=30)
    finally:
        db.close()


@celery_app.task
def send_notification_email(to_email: str, subject: str, body: str) -> dict:
    """Send notification email."""
    from app.services.email import send_email

    logger.info("Sending email to %s: %s", to_email, subject)
    success = send_email(to_email, subject, body)
    return {"status": "sent" if success else "failed", "to": to_email}
