"""Update products with placeholder images from picsum/ui-avatars."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.product import Product

db = SessionLocal()

# Map SKUs to relevant product image URLs (using free placeholder services)
# Using dummyimage.com for colored product placeholders with text
images = {
    # MOUSE
    "LOG-G502-H": "https://dummyimage.com/400x400/1a1a2e/eee&text=G502+HERO",
    "LOG-G304": "https://dummyimage.com/400x400/16213e/eee&text=G304",
    "RAZ-DAV3": "https://dummyimage.com/400x400/00b300/fff&text=DeathAdder+V3",
    "RAZ-VMIN": "https://dummyimage.com/400x400/00cc00/fff&text=Viper+Mini",
    "COR-M65U": "https://dummyimage.com/400x400/f5c518/111&text=M65+RGB",
    "HPX-PFH2": "https://dummyimage.com/400x400/cd113b/fff&text=Pulsefire",
    "SS-RIV3": "https://dummyimage.com/400x400/ff6600/fff&text=Rival+3",
    "LOG-MXM3S": "https://dummyimage.com/400x400/2d2d2d/eee&text=MX+Master+3S",
    "LOG-GPXS": "https://dummyimage.com/400x400/0f0f0f/eee&text=G+Pro+X",
    "RAZ-BASV3": "https://dummyimage.com/400x400/009900/fff&text=Basilisk+V3",
    # KEYBOARD
    "COR-K70P": "https://dummyimage.com/400x400/f5c518/111&text=K70+RGB+Pro",
    "RAZ-BWV4": "https://dummyimage.com/400x400/00b300/fff&text=BlackWidow+V4",
    "LOG-G413": "https://dummyimage.com/400x400/333/eee&text=G413+SE",
    "HPX-AO60": "https://dummyimage.com/400x400/cd113b/fff&text=Alloy+60%25",
    "SS-APM": "https://dummyimage.com/400x400/ff6600/fff&text=Apex+Pro+Mini",
    "LOG-MXKS": "https://dummyimage.com/400x400/444/eee&text=MX+Keys+S",
    "COR-K55P": "https://dummyimage.com/400x400/e6b800/111&text=K55+RGB",
    "RAZ-HMN": "https://dummyimage.com/400x400/00cc00/fff&text=Huntsman+Mini",
    "ASUS-RSS": "https://dummyimage.com/400x400/c4302b/fff&text=ROG+Strix",
    "DELL-KB216": "https://dummyimage.com/400x400/666/eee&text=Dell+KB216",
    # MONITOR
    "SAM-G527": "https://dummyimage.com/400x400/1428a0/fff&text=Odyssey+G5",
    "LG-27GP": "https://dummyimage.com/400x400/a50034/fff&text=UltraGear+27",
    "DELL-S24": "https://dummyimage.com/400x400/0076ce/fff&text=Dell+S24",
    "BNQ-EX27": "https://dummyimage.com/400x400/7b2d8b/fff&text=MOBIUZ+27",
    "ASUS-VG24": "https://dummyimage.com/400x400/c4302b/fff&text=TUF+VG249",
    "LG-24MP": "https://dummyimage.com/400x400/a50034/fff&text=LG+24MP",
    "SAM-M527": "https://dummyimage.com/400x400/1428a0/fff&text=Smart+M5",
    "BNQ-GW24": "https://dummyimage.com/400x400/7b2d8b/fff&text=BenQ+GW24",
    # HEADSET
    "HPX-CLD3": "https://dummyimage.com/400x400/cd113b/fff&text=Cloud+III",
    "RAZ-KRV3": "https://dummyimage.com/400x400/00b300/fff&text=Kraken+V3",
    "COR-HS80": "https://dummyimage.com/400x400/f5c518/111&text=HS80+RGB",
    "SS-AN7": "https://dummyimage.com/400x400/ff6600/fff&text=Arctis+Nova+7",
    "SONY-XM5": "https://dummyimage.com/400x400/000/eee&text=WH-1000XM5",
    "JBL-Q100": "https://dummyimage.com/400x400/ff3c00/fff&text=Quantum+100",
    "BOAT-R450": "https://dummyimage.com/400x400/e60000/fff&text=Rockerz+450",
    "LOG-G435": "https://dummyimage.com/400x400/2d2d2d/eee&text=G435",
    # STORAGE
    "WD-SN580-1T": "https://dummyimage.com/400x400/0058a3/fff&text=WD+Blue+1TB",
    "SAM-990E-1T": "https://dummyimage.com/400x400/1428a0/fff&text=990+EVO+1TB",
    "SEA-BAR-2T": "https://dummyimage.com/400x400/6cbb3c/fff&text=Barracuda+2TB",
    "WD-ELE-1T": "https://dummyimage.com/400x400/0058a3/fff&text=Elements+1TB",
    "SAM-T7-1T": "https://dummyimage.com/400x400/1428a0/fff&text=T7+1TB",
    "SEA-EXP-4T": "https://dummyimage.com/400x400/6cbb3c/fff&text=Expansion+4TB",
    "WD-SN850-2T": "https://dummyimage.com/400x400/111/eee&text=Black+SN850X",
    # ACCESSORIES
    "COR-MM350": "https://dummyimage.com/400x400/f5c518/111&text=MM350+Pad",
    "RAZ-GOL-E": "https://dummyimage.com/400x400/00b300/fff&text=Goliathus",
    "LOG-C920": "https://dummyimage.com/400x400/2d2d2d/eee&text=C920+Webcam",
    "LOG-SCAM": "https://dummyimage.com/400x400/444/eee&text=StreamCam",
    "HPX-WREST": "https://dummyimage.com/400x400/cd113b/fff&text=Wrist+Rest",
    "RAZ-SMIN": "https://dummyimage.com/400x400/00cc00/fff&text=Seiren+Mini",
    "COR-CABLE": "https://dummyimage.com/400x400/555/eee&text=Cable+Kit",
}

updated = 0
products = db.query(Product).all()
for p in products:
    if p.sku in images:
        p.image_url = images[p.sku]
        updated += 1

db.commit()
print(f"Updated {updated} product images")
db.close()
