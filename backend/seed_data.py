"""Seed script: creates admin, dealer, customer users + 50 sample products."""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from decimal import Decimal
from app.database import SessionLocal
from app.models.user import User, UserRole, DealerProfile
from app.models.product import Product, ProductCategory, Category, Brand
from app.auth.jwt import hash_password
from app.utils import generate_slug

db = SessionLocal()

# --- Users ---
admin = User(
    email="admin@micromachines.in",
    hashed_password=hash_password("admin123"),
    full_name="Admin User",
    phone="9000000001",
    role=UserRole.admin,
    is_active=True,
    is_verified=True,
)
db.add(admin)
db.flush()

customer = User(
    email="customer@example.com",
    hashed_password=hash_password("customer123"),
    full_name="Rahul Sharma",
    phone="9000000002",
    role=UserRole.customer,
    is_active=True,
    is_verified=True,
)
db.add(customer)

dealer_user = User(
    email="dealer@example.com",
    hashed_password=hash_password("dealer123"),
    full_name="Priya Electronics",
    phone="9000000003",
    role=UserRole.dealer,
    is_active=True,
    is_verified=True,
)
db.add(dealer_user)
db.flush()

dealer_profile = DealerProfile(
    user_id=dealer_user.id,
    company_name="Priya Computer Peripherals",
    dealer_id="DLR-0001",
    gst_number="27AABCP1234M1Z5",
    is_approved=True,
    approved_by=admin.id,
)
db.add(dealer_profile)
db.flush()

print(f"Created users: admin ({admin.id}), customer ({customer.id}), dealer ({dealer_user.id})")

# --- Categories ---
categories = ["Mouse", "Keyboard", "Monitor", "Headset", "Storage", "Accessories"]
for i, name in enumerate(categories):
    cat = Category(name=name, slug=name.lower(), display_order=i, is_active=True)
    db.add(cat)

# --- Brands ---
brand_names = ["Logitech", "Razer", "Corsair", "HyperX", "SteelSeries", "Samsung",
               "LG", "Dell", "Asus", "BenQ", "WD", "Seagate", "Sony", "JBL", "Boat"]
for name in brand_names:
    db.add(Brand(name=name, is_active=True))

db.flush()

# --- 50 Sample Products ---
products_data = [
    # MOUSE (10)
    ("Logitech G502 HERO", "Logitech", "mouse", "LOG-G502-H", "84716060", "High-performance gaming mouse with HERO 25K sensor", {"DPI": "25600", "Buttons": "11", "Weight": "121g"}, 4995, 3500, 45),
    ("Logitech G304 Lightspeed", "Logitech", "mouse", "LOG-G304", "84716060", "Wireless gaming mouse with HERO sensor", {"DPI": "12000", "Battery": "AA", "Weight": "99g"}, 3495, 2400, 80),
    ("Razer DeathAdder V3", "Razer", "mouse", "RAZ-DAV3", "84716060", "Ergonomic esports mouse", {"DPI": "30000", "Buttons": "5", "Weight": "59g"}, 6999, 5200, 30),
    ("Razer Viper Mini", "Razer", "mouse", "RAZ-VMIN", "84716060", "Ultra-light gaming mouse", {"DPI": "8500", "Buttons": "6", "Weight": "61g"}, 2999, 2100, 55),
    ("Corsair M65 RGB Ultra", "Corsair", "mouse", "COR-M65U", "84716060", "Tunable FPS gaming mouse", {"DPI": "26000", "Buttons": "8", "Weight": "97g"}, 4499, 3200, 40),
    ("HyperX Pulsefire Haste 2", "HyperX", "mouse", "HPX-PFH2", "84716060", "Ultra-light gaming mouse", {"DPI": "26000", "Buttons": "6", "Weight": "53g"}, 4999, 3600, 35),
    ("SteelSeries Rival 3", "SteelSeries", "mouse", "SS-RIV3", "84716060", "Performance gaming mouse", {"DPI": "8500", "Buttons": "6", "Weight": "77g"}, 2499, 1700, 90),
    ("Logitech MX Master 3S", "Logitech", "mouse", "LOG-MXM3S", "84716060", "Advanced wireless mouse for productivity", {"DPI": "8000", "Battery": "Rechargeable", "Weight": "141g"}, 9495, 7200, 25),
    ("Logitech G Pro X Superlight", "Logitech", "mouse", "LOG-GPXS", "84716060", "Ultra-lightweight wireless gaming mouse", {"DPI": "25600", "Weight": "63g", "Battery": "70hrs"}, 12995, 9800, 20),
    ("Razer Basilisk V3", "Razer", "mouse", "RAZ-BASV3", "84716060", "Customizable ergonomic gaming mouse", {"DPI": "26000", "Buttons": "11", "Weight": "101g"}, 4499, 3100, 50),

    # KEYBOARD (10)
    ("Corsair K70 RGB Pro", "Corsair", "keyboard", "COR-K70P", "84716060", "Mechanical gaming keyboard Cherry MX Red", {"Switch": "Cherry MX Red", "Layout": "Full", "Backlight": "RGB"}, 12999, 9500, 20),
    ("Razer BlackWidow V4", "Razer", "keyboard", "RAZ-BWV4", "84716060", "Mechanical gaming keyboard", {"Switch": "Razer Green", "Layout": "Full", "Backlight": "RGB"}, 14999, 11200, 15),
    ("Logitech G413 SE", "Logitech", "keyboard", "LOG-G413", "84716060", "Mechanical gaming keyboard", {"Switch": "Tactile", "Layout": "Full", "Backlight": "White"}, 4995, 3600, 60),
    ("HyperX Alloy Origins 60", "HyperX", "keyboard", "HPX-AO60", "84716060", "Compact mechanical keyboard", {"Switch": "HyperX Red", "Layout": "60%", "Backlight": "RGB"}, 7999, 5800, 35),
    ("SteelSeries Apex Pro Mini", "SteelSeries", "keyboard", "SS-APM", "84716060", "Adjustable mechanical keyboard", {"Switch": "OmniPoint 2.0", "Layout": "60%", "Backlight": "RGB"}, 18999, 14500, 10),
    ("Logitech MX Keys S", "Logitech", "keyboard", "LOG-MXKS", "84716060", "Smart wireless illuminated keyboard", {"Layout": "Full", "Backlight": "White", "Connection": "Bluetooth"}, 9995, 7500, 30),
    ("Corsair K55 RGB Pro", "Corsair", "keyboard", "COR-K55P", "84716060", "IP42 dust/spill resistant keyboard", {"Switch": "Membrane", "Layout": "Full", "Backlight": "RGB"}, 3999, 2800, 70),
    ("Razer Huntsman Mini", "Razer", "keyboard", "RAZ-HMN", "84716060", "60% optical gaming keyboard", {"Switch": "Razer Optical", "Layout": "60%", "Backlight": "RGB"}, 8999, 6500, 25),
    ("Asus ROG Strix Scope", "Asus", "keyboard", "ASUS-RSS", "84716060", "RGB mechanical gaming keyboard", {"Switch": "Cherry MX", "Layout": "Full", "Backlight": "RGB"}, 9999, 7400, 20),
    ("Dell KB216 Wired", "Dell", "keyboard", "DELL-KB216", "84716060", "Multimedia wired keyboard", {"Switch": "Membrane", "Layout": "Full", "Backlight": "None"}, 599, 380, 200),

    # MONITOR (8)
    ("Samsung Odyssey G5 27\"", "Samsung", "monitor", "SAM-G527", "85285900", "27-inch QHD 165Hz curved gaming monitor", {"Resolution": "2560x1440", "Refresh": "165Hz", "Panel": "VA"}, 24999, 19500, 12),
    ("LG UltraGear 27GP850", "LG", "monitor", "LG-27GP", "85285900", "27-inch QHD Nano IPS gaming monitor", {"Resolution": "2560x1440", "Refresh": "180Hz", "Panel": "Nano IPS"}, 29999, 23000, 8),
    ("Dell S2421HN 24\"", "Dell", "monitor", "DELL-S24", "85285900", "24-inch FHD IPS monitor", {"Resolution": "1920x1080", "Refresh": "75Hz", "Panel": "IPS"}, 11499, 8500, 30),
    ("BenQ MOBIUZ EX2710S", "BenQ", "monitor", "BNQ-EX27", "85285900", "27-inch FHD 165Hz gaming monitor", {"Resolution": "1920x1080", "Refresh": "165Hz", "Panel": "IPS"}, 19999, 15500, 15),
    ("Asus TUF Gaming VG249Q", "Asus", "monitor", "ASUS-VG24", "85285900", "24-inch FHD 144Hz gaming monitor", {"Resolution": "1920x1080", "Refresh": "144Hz", "Panel": "IPS"}, 14999, 11500, 18),
    ("LG 24MP400 24\"", "LG", "monitor", "LG-24MP", "85285900", "24-inch FHD IPS monitor", {"Resolution": "1920x1080", "Refresh": "75Hz", "Panel": "IPS"}, 9499, 7200, 40),
    ("Samsung M5 27\" Smart", "Samsung", "monitor", "SAM-M527", "85285900", "27-inch FHD Smart Monitor with speakers", {"Resolution": "1920x1080", "Refresh": "60Hz", "Panel": "VA"}, 17999, 14000, 20),
    ("BenQ GW2480 24\"", "BenQ", "monitor", "BNQ-GW24", "85285900", "24-inch FHD eye-care monitor", {"Resolution": "1920x1080", "Refresh": "60Hz", "Panel": "IPS"}, 10499, 7800, 35),

    # HEADSET (8)
    ("HyperX Cloud III", "HyperX", "headset", "HPX-CLD3", "85183000", "Gaming headset with DTS spatial audio", {"Driver": "53mm", "Connection": "USB/3.5mm", "Mic": "Detachable"}, 7999, 5800, 40),
    ("Razer Kraken V3", "Razer", "headset", "RAZ-KRV3", "85183000", "Wired USB gaming headset with THX", {"Driver": "50mm", "Connection": "USB", "Mic": "Retractable"}, 6999, 5000, 30),
    ("Corsair HS80 RGB Wireless", "Corsair", "headset", "COR-HS80", "85183000", "Premium wireless gaming headset", {"Driver": "50mm", "Connection": "Wireless", "Battery": "24hrs"}, 9999, 7500, 20),
    ("SteelSeries Arctis Nova 7", "SteelSeries", "headset", "SS-AN7", "85183000", "Wireless multi-platform gaming headset", {"Driver": "40mm", "Connection": "2.4GHz/BT", "Battery": "38hrs"}, 13999, 10500, 15),
    ("Sony WH-1000XM5", "Sony", "headset", "SONY-XM5", "85183000", "Industry-leading noise cancelling headphones", {"Driver": "30mm", "Connection": "Bluetooth", "ANC": "Yes"}, 26990, 21000, 10),
    ("JBL Quantum 100", "JBL", "headset", "JBL-Q100", "85183000", "Wired over-ear gaming headset", {"Driver": "40mm", "Connection": "3.5mm", "Mic": "Detachable"}, 2499, 1700, 80),
    ("Boat Rockerz 450 Pro", "Boat", "headset", "BOAT-R450", "85183000", "Wireless headphone with 70hrs playback", {"Driver": "40mm", "Connection": "Bluetooth", "Battery": "70hrs"}, 1499, 900, 120),
    ("Logitech G435 Lightspeed", "Logitech", "headset", "LOG-G435", "85183000", "Ultra-light wireless gaming headset", {"Driver": "40mm", "Connection": "Lightspeed/BT", "Weight": "165g"}, 5495, 3900, 35),

    # STORAGE (7)
    ("WD Blue SN580 1TB NVMe", "WD", "storage", "WD-SN580-1T", "84717020", "PCIe Gen4 NVMe M.2 SSD", {"Capacity": "1TB", "Read": "4150 MB/s", "Interface": "NVMe Gen4"}, 4999, 3600, 50),
    ("Samsung 990 EVO 1TB", "Samsung", "storage", "SAM-990E-1T", "84717020", "PCIe Gen5 NVMe M.2 SSD", {"Capacity": "1TB", "Read": "5000 MB/s", "Interface": "NVMe Gen5"}, 7499, 5500, 30),
    ("Seagate Barracuda 2TB HDD", "Seagate", "storage", "SEA-BAR-2T", "84717020", "3.5-inch internal hard drive", {"Capacity": "2TB", "RPM": "7200", "Interface": "SATA III"}, 4499, 3200, 60),
    ("WD Elements 1TB Portable", "WD", "storage", "WD-ELE-1T", "84717020", "USB 3.0 portable external HDD", {"Capacity": "1TB", "Interface": "USB 3.0", "Form": "2.5-inch"}, 3499, 2400, 70),
    ("Samsung T7 1TB SSD", "Samsung", "storage", "SAM-T7-1T", "84717020", "Portable external SSD", {"Capacity": "1TB", "Read": "1050 MB/s", "Interface": "USB-C"}, 7999, 6000, 25),
    ("Seagate Expansion 4TB", "Seagate", "storage", "SEA-EXP-4T", "84717020", "Desktop external hard drive", {"Capacity": "4TB", "Interface": "USB 3.0", "Form": "3.5-inch"}, 7999, 5800, 20),
    ("WD Black SN850X 2TB", "WD", "storage", "WD-SN850-2T", "84717020", "Gaming NVMe SSD with heatsink", {"Capacity": "2TB", "Read": "7300 MB/s", "Interface": "NVMe Gen4"}, 13999, 10800, 15),

    # ACCESSORIES (7)
    ("Corsair MM350 XL Mousepad", "Corsair", "accessories", "COR-MM350", "40169990", "Extended gaming mousepad", {"Size": "930x400mm", "Surface": "Cloth", "Base": "Anti-skid"}, 1999, 1300, 80),
    ("Razer Goliathus Extended", "Razer", "accessories", "RAZ-GOL-E", "40169990", "Soft gaming mouse mat extended", {"Size": "920x294mm", "Surface": "Micro-texture", "Base": "Rubber"}, 2499, 1700, 60),
    ("Logitech C920 HD Pro Webcam", "Logitech", "accessories", "LOG-C920", "85258000", "Full HD 1080p webcam", {"Resolution": "1080p", "FPS": "30", "Mic": "Stereo"}, 7995, 5800, 30),
    ("Logitech StreamCam", "Logitech", "accessories", "LOG-SCAM", "85258000", "Full HD streaming webcam", {"Resolution": "1080p", "FPS": "60", "Connection": "USB-C"}, 14995, 11500, 15),
    ("HyperX Wrist Rest", "HyperX", "accessories", "HPX-WREST", "40169990", "Ergonomic keyboard wrist rest", {"Material": "Memory Foam", "Size": "Full-size", "Cover": "Cool gel"}, 1999, 1300, 50),
    ("Razer USB Mic Seiren Mini", "Razer", "accessories", "RAZ-SMIN", "85183000", "Ultra-compact condenser microphone", {"Pattern": "Supercardioid", "Connection": "USB", "Frequency": "20Hz-20kHz"}, 4499, 3200, 25),
    ("Cable Management Kit", "Corsair", "accessories", "COR-CABLE", "85444900", "Universal desk cable management system", {"Type": "Clips + Channels", "Material": "ABS", "Color": "Black"}, 999, 600, 100),
]

for i, (name, brand, category, sku, hsn, desc, specs, mrp, dealer, stock) in enumerate(products_data):
    slug = generate_slug(f"{brand}-{name}")
    # Ensure unique slug
    existing = db.query(Product).filter(Product.slug == slug).first()
    if existing:
        slug = f"{slug}-{sku.lower()}"

    product = Product(
        name=name,
        slug=slug,
        brand=brand,
        sku=sku,
        hsn_code=hsn,
        category=ProductCategory(category),
        description=desc,
        specifications=specs,
        customer_price=Decimal(str(mrp)),
        dealer_price=Decimal(str(dealer)),
        stock_quantity=stock,
        image_url=None,
        is_active=True,
        created_by=dealer_user.id,
    )
    db.add(product)

db.commit()
print(f"Seeded {len(products_data)} products, {len(categories)} categories, {len(brand_names)} brands")
print()
print("Login credentials:")
print(f"  Admin:    admin@micromachines.in / admin123")
print(f"  Customer: customer@example.com / customer123")
print(f"  Dealer:   dealer@example.com / dealer123")

db.close()
