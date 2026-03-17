"""Seed more dealers and 50 additional products."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from decimal import Decimal
from app.database import SessionLocal
from app.models.user import User, UserRole, DealerProfile
from app.models.product import Product, ProductCategory
from app.auth.jwt import hash_password
from app.utils import generate_slug

db = SessionLocal()

# Get admin user for approved_by
admin = db.query(User).filter(User.role == UserRole.admin).first()

# --- More Dealers ---
dealers_data = [
    ("Ravi Tech Solutions", "ravi@techsolutions.in", "Ravi Kumar", "9876500001", "DLR-0002", "27RAVIT1234A1Z5", "gold", 5),
    ("Sharma Computers", "info@sharmacomp.in", "Amit Sharma", "9876500002", "DLR-0003", "29SHARM5678B2Z3", "silver", 0),
    ("Digital Hub India", "sales@digitalhub.in", "Priya Patel", "9876500003", "DLR-0004", "07DIGIT9012C3Z1", "platinum", 10),
    ("CompuWorld Traders", "compuworld@gmail.com", "Suresh Reddy", "9876500004", "DLR-0005", "36COMPU3456D4Z9", "gold", 3),
    ("NetZone Peripherals", "netzone@outlook.com", "Deepak Gupta", "9876500005", "DLR-0006", "33NETZO7890E5Z7", "silver", 0),
    ("TechMart Distributors", "techmart@yahoo.in", "Anita Singh", "9876500006", "DLR-0007", None, "silver", 0),
    ("InfoTech Supplies", "infotech.sup@gmail.com", "Karthik Nair", "9876500007", "DLR-0008", "32INFOT2345F6Z5", "gold", 7),
    ("Peripheral Palace", "palace@peripherals.co", "Meena Joshi", "9876500008", "DLR-0009", "27PERIP6789G7Z3", "silver", 0),
]

for company, email, name, phone, dlr_id, gst, tier, discount in dealers_data:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        continue
    user = User(
        email=email,
        hashed_password=hash_password("dealer123"),
        full_name=name,
        phone=phone,
        role=UserRole.dealer,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.flush()
    profile = DealerProfile(
        user_id=user.id,
        company_name=company,
        dealer_id=dlr_id,
        gst_number=gst,
        tier=tier,
        is_approved=True,
        special_discount=Decimal(str(discount)),
        approved_by=admin.id if admin else None,
    )
    db.add(profile)

db.flush()
print(f"Created {len(dealers_data)} dealers")

# Get dealer for created_by
dealer_user = db.query(User).filter(User.email == "dealer@example.com").first()
creator_id = dealer_user.id if dealer_user else (admin.id if admin else 1)

# --- 50 More Products ---
products = [
    # MOUSE (8)
    ("Logitech G203 Lightsync", "Logitech", "mouse", "LOG-G203", "84716060", "Wired gaming mouse with RGB", {"DPI": "8000", "Buttons": "6"}, 2495, 1700, 100),
    ("Razer Orochi V2", "Razer", "mouse", "RAZ-ORV2", "84716060", "Ultra-lightweight wireless mouse", {"DPI": "18000", "Weight": "60g"}, 5499, 3900, 40),
    ("Corsair Katar Pro XT", "Corsair", "mouse", "COR-KPXT", "84716060", "Ultra-light gaming mouse", {"DPI": "18000", "Weight": "73g"}, 2999, 2100, 65),
    ("HyperX Pulsefire Core", "HyperX", "mouse", "HPX-PFC", "84716060", "RGB gaming mouse", {"DPI": "6200", "Buttons": "7"}, 1999, 1400, 90),
    ("Logitech Pebble M350", "Logitech", "mouse", "LOG-M350", "84716060", "Slim wireless mouse", {"DPI": "1000", "Battery": "18mo"}, 1795, 1200, 120),
    ("Razer Naga X", "Razer", "mouse", "RAZ-NAGX", "84716060", "MMO gaming mouse with 16 buttons", {"DPI": "18000", "Buttons": "16"}, 5999, 4200, 30),
    ("SteelSeries Prime Mini", "SteelSeries", "mouse", "SS-PRMN", "84716060", "Compact esports mouse", {"DPI": "18000", "Weight": "61g"}, 4999, 3500, 35),
    ("Microsoft Arc Mouse", "Microsoft", "mouse", "MS-ARC", "84716060", "Slim foldable Bluetooth mouse", {"Connection": "Bluetooth", "Weight": "82g"}, 5999, 4500, 25),

    # KEYBOARD (8)
    ("Logitech K380 Multi-Device", "Logitech", "keyboard", "LOG-K380", "84716060", "Compact Bluetooth keyboard", {"Layout": "Compact", "Connection": "Bluetooth"}, 2995, 2100, 80),
    ("Corsair K100 RGB", "Corsair", "keyboard", "COR-K100", "84716060", "Flagship mechanical keyboard", {"Switch": "OPX Optical", "Layout": "Full"}, 22999, 17000, 10),
    ("Razer Ornata V3", "Razer", "keyboard", "RAZ-ORN3", "84716060", "Mecha-membrane gaming keyboard", {"Switch": "Mecha-Membrane", "Layout": "Full"}, 5999, 4200, 45),
    ("HyperX Alloy Origins Core", "HyperX", "keyboard", "HPX-AOC", "84716060", "TKL mechanical keyboard", {"Switch": "HyperX Red", "Layout": "TKL"}, 6999, 5000, 30),
    ("Keychron K2 V2", "Keychron", "keyboard", "KEY-K2V2", "84716060", "Wireless mechanical keyboard", {"Switch": "Gateron Brown", "Layout": "75%"}, 6999, 5200, 25),
    ("Logitech G915 TKL", "Logitech", "keyboard", "LOG-G915T", "84716060", "Wireless low-profile mechanical", {"Switch": "GL Tactile", "Layout": "TKL"}, 18995, 14500, 8),
    ("Asus ROG Falchion", "Asus", "keyboard", "ASUS-FALC", "84716060", "65% wireless mechanical keyboard", {"Switch": "Cherry MX Red", "Layout": "65%"}, 11999, 9000, 15),
    ("Redragon K552 Kumara", "Redragon", "keyboard", "RED-K552", "84716060", "Budget mechanical keyboard", {"Switch": "Outemu Blue", "Layout": "TKL"}, 2499, 1600, 150),

    # MONITOR (8)
    ("Acer Nitro XV272U", "Acer", "monitor", "ACR-XV27", "85285900", "27-inch QHD 170Hz IPS gaming monitor", {"Resolution": "2560x1440", "Refresh": "170Hz"}, 22999, 17500, 12),
    ("Samsung M7 32\" Smart", "Samsung", "monitor", "SAM-M732", "85285900", "32-inch 4K smart monitor with DeX", {"Resolution": "3840x2160", "Refresh": "60Hz"}, 28999, 22000, 8),
    ("LG 27UL500 27\" 4K", "LG", "monitor", "LG-27UL5", "85285900", "27-inch 4K UHD IPS monitor", {"Resolution": "3840x2160", "Panel": "IPS"}, 24999, 19000, 15),
    ("Dell P2422H 24\"", "Dell", "monitor", "DELL-P24", "85285900", "24-inch FHD IPS professional monitor", {"Resolution": "1920x1080", "Panel": "IPS"}, 14999, 11000, 25),
    ("BenQ PD2705Q 27\"", "BenQ", "monitor", "BNQ-PD27", "85285900", "27-inch QHD design monitor", {"Resolution": "2560x1440", "Color": "sRGB 100%"}, 32999, 25000, 6),
    ("Asus ProArt PA278QV", "Asus", "monitor", "ASUS-PA27", "85285900", "27-inch QHD professional monitor", {"Resolution": "2560x1440", "Color": "sRGB 100%"}, 27999, 21000, 10),
    ("ViewSonic VX2718", "ViewSonic", "monitor", "VS-VX27", "85285900", "27-inch FHD 165Hz curved gaming", {"Resolution": "1920x1080", "Refresh": "165Hz"}, 14999, 11500, 20),
    ("AOC 24G2 24\"", "AOC", "monitor", "AOC-24G2", "85285900", "24-inch FHD 144Hz IPS gaming", {"Resolution": "1920x1080", "Refresh": "144Hz"}, 12999, 9500, 30),

    # HEADSET (8)
    ("Corsair Virtuoso RGB XT", "Corsair", "headset", "COR-VRXT", "85183000", "Hi-Fi wireless gaming headset", {"Driver": "50mm", "Connection": "Wireless"}, 16999, 12500, 10),
    ("Razer BlackShark V2 Pro", "Razer", "headset", "RAZ-BSV2P", "85183000", "Wireless esports headset", {"Driver": "50mm", "Connection": "2.4GHz"}, 12999, 9500, 15),
    ("SteelSeries Arctis 1", "SteelSeries", "headset", "SS-ARC1", "85183000", "Wireless gaming headset", {"Driver": "40mm", "Connection": "2.4GHz"}, 5999, 4200, 40),
    ("JBL Tune 770NC", "JBL", "headset", "JBL-T770", "85183000", "Wireless ANC headphones", {"Driver": "40mm", "ANC": "Yes"}, 5999, 4000, 50),
    ("Sony WH-CH720N", "Sony", "headset", "SONY-CH72", "85183000", "Wireless noise cancelling headphones", {"Driver": "30mm", "ANC": "Yes"}, 8990, 6500, 35),
    ("Boat Airdopes 141", "Boat", "headset", "BOAT-A141", "85183000", "TWS earbuds with 42hrs playback", {"Type": "TWS", "Battery": "42hrs"}, 1299, 750, 200),
    ("Samsung Galaxy Buds FE", "Samsung", "headset", "SAM-GBFE", "85183000", "True wireless with ANC", {"Type": "TWS", "ANC": "Yes"}, 6999, 5000, 40),
    ("Sennheiser HD 560S", "Sennheiser", "headset", "SEN-560S", "85183000", "Audiophile open-back headphones", {"Driver": "38mm", "Impedance": "120 Ohm"}, 12990, 10000, 10),

    # STORAGE (8)
    ("Samsung 870 EVO 500GB SATA", "Samsung", "storage", "SAM-870E5", "84717020", "SATA SSD for laptops and PCs", {"Capacity": "500GB", "Read": "560 MB/s"}, 3999, 2900, 60),
    ("WD My Passport 2TB", "WD", "storage", "WD-PASS2T", "84717020", "Portable external hard drive", {"Capacity": "2TB", "Interface": "USB 3.0"}, 5499, 4000, 50),
    ("Crucial P3 Plus 1TB NVMe", "Crucial", "storage", "CRU-P3P1T", "84717020", "PCIe Gen4 NVMe M.2 SSD", {"Capacity": "1TB", "Read": "5000 MB/s"}, 4999, 3500, 45),
    ("Seagate One Touch 1TB SSD", "Seagate", "storage", "SEA-OT1TS", "84717020", "Portable SSD with rescue service", {"Capacity": "1TB", "Read": "1030 MB/s"}, 7999, 5800, 20),
    ("Kingston Fury Beast 16GB DDR5", "Kingston", "storage", "KNG-FB16", "84717020", "DDR5 RAM 5200MHz", {"Capacity": "16GB", "Speed": "5200MHz"}, 4499, 3200, 60),
    ("Transcend 256GB microSD", "Transcend", "storage", "TRN-256M", "84717020", "microSD card UHS-I U3", {"Capacity": "256GB", "Speed": "Class 10"}, 1999, 1300, 100),
    ("Samsung 980 PRO 2TB", "Samsung", "storage", "SAM-980P2", "84717020", "PCIe Gen4 NVMe M.2 SSD", {"Capacity": "2TB", "Read": "7000 MB/s"}, 15999, 12000, 10),
    ("Toshiba Canvio 4TB", "Toshiba", "storage", "TOS-CAN4T", "84717020", "Portable external hard drive", {"Capacity": "4TB", "Interface": "USB 3.0"}, 8999, 6500, 25),

    # ACCESSORIES (10)
    ("SteelSeries QcK Heavy XXL", "SteelSeries", "accessories", "SS-QCKXXL", "40169990", "Extra thick gaming mousepad XXL", {"Size": "900x400mm", "Thickness": "6mm"}, 2999, 2000, 50),
    ("Razer Kiyo Pro Webcam", "Razer", "accessories", "RAZ-KIYO", "85258000", "Adaptive light sensor webcam", {"Resolution": "1080p", "FPS": "60"}, 14999, 11000, 12),
    ("Blue Yeti USB Microphone", "Blue", "accessories", "BLU-YETI", "85183000", "Professional USB condenser mic", {"Pattern": "Multi", "Sample": "48kHz"}, 10999, 8000, 20),
    ("Elgato Stream Deck MK.2", "Elgato", "accessories", "ELG-SD15", "84716060", "15-key LCD streaming controller", {"Keys": "15", "Connection": "USB-C"}, 14999, 11500, 8),
    ("APC BX600C-IN 600VA UPS", "APC", "accessories", "APC-600VA", "85044900", "600VA UPS for PCs", {"Capacity": "600VA", "Outlets": "3"}, 3499, 2500, 40),
    ("TP-Link Archer AX55 Router", "TP-Link", "accessories", "TPL-AX55", "85176290", "WiFi 6 AX3000 dual-band router", {"Speed": "AX3000", "WiFi": "WiFi 6"}, 5999, 4200, 30),
    ("Logitech Z150 Speakers", "Logitech", "accessories", "LOG-Z150", "85182900", "Compact stereo speakers", {"Power": "6W", "Connection": "3.5mm"}, 1595, 1100, 80),
    ("Targus 15.6\" Laptop Bag", "Targus", "accessories", "TRG-15BAG", "42021900", "Classic slim laptop briefcase", {"Size": "15.6 inch", "Material": "Polyester"}, 1999, 1300, 70),
    ("Belkin 8-Outlet Surge Strip", "Belkin", "accessories", "BLK-8SURG", "85044900", "8-outlet surge protector", {"Outlets": "8", "Protection": "2160 Joules"}, 2499, 1700, 55),
    ("Anker USB-C Hub 7-in-1", "Anker", "accessories", "ANK-7IN1", "84733020", "USB-C multiport adapter", {"Ports": "HDMI+USB+SD+PD", "PD": "100W"}, 3999, 2800, 35),
]

import urllib.parse

created = 0
for name, brand, category, sku, hsn, desc, specs, mrp, dealer, stock in products:
    existing = db.query(Product).filter(Product.sku == sku).first()
    if existing:
        continue
    slug = generate_slug(f"{brand}-{name}")
    if db.query(Product).filter(Product.slug == slug).first():
        slug = f"{slug}-{sku.lower()}"
    label = urllib.parse.quote(f'{brand} {name}'[:30])
    colors = {'mouse': '4f46e5', 'keyboard': '7e22ce', 'monitor': '0891b2', 'headset': 'be185d', 'storage': '059669', 'accessories': 'b45309'}
    color = colors.get(category, '4f46e5')
    product = Product(
        name=name, slug=slug, brand=brand, sku=sku, hsn_code=hsn,
        category=ProductCategory(category),
        description=desc, specifications=specs,
        customer_price=Decimal(str(mrp)), dealer_price=Decimal(str(dealer)),
        stock_quantity=stock,
        image_url=f'https://placehold.co/400x400/{color}/white?text={label}',
        is_active=True, created_by=creator_id,
    )
    db.add(product)
    created += 1

db.commit()
print(f"Created {created} new products")

# Index new products in Meilisearch
try:
    from app.services.search import get_meili_client
    all_products = db.query(Product).filter(Product.is_active == True).all()
    docs = [{"id": p.id, "name": p.name, "brand": p.brand, "category": p.category.value, "description": p.description or "", "sku": p.sku, "is_active": True} for p in all_products]
    client = get_meili_client()
    index = client.index("products")
    index.add_documents(docs)
    print(f"Indexed {len(docs)} products in Meilisearch")
except Exception as e:
    print(f"Meilisearch indexing skipped: {e}")

db.close()

print("\nNew dealer logins (all password: dealer123):")
for company, email, name, *_ in dealers_data:
    print(f"  {company}: {email}")
