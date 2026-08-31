# Construction Site Management — Expanded Materials, Fuel, Weighbridge & Consumables Requirements

## 1. New top-level modules

The application should organize site operations into these modules:

1. Labour
2. Food & Groceries
3. General Store
4. Machinery
5. Fuel
6. Salary
7. Transport
8. Materials
9. Weighbridge
10. Shops & Suppliers
11. Buildings / Locations
12. Cash & Payments

The modules must be connected rather than functioning as independent expense forms.

---

# 2. Important relationship model

The application should understand the following relationships:

```text
MATERIAL
   │
   ├── Supplier / Source
   │
   ├── Quantity / Weight
   │
   ├── Destination / Building
   │
   ├── Transport
   │
   ├── Weighbridge
   │
   └── Material Cost
```

And:

```text
MACHINERY
   │
   ├── Operator
   ├── Building / Job
   ├── Work
   ├── Hours
   └── FUEL
          │
          ├── Quantity
          ├── Rate
          ├── Cost
          └── Date
```

This is important because the application should eventually answer questions such as:

> How much did the sand actually cost after transport and weighbridge?

and:

> How much diesel did the JCB consume this month?

---

# 3. FOOD & GROCERIES

Food should be its own module.

Do not put all food-related purchases into "Miscellaneous."

## 3.1 Food categories

Initial categories:

### Milk & dairy

- Milk
- Curd
- Buttermilk
- Paneer
- Other dairy

### Staples

- Rice
- Dal
- Wheat
- Flour
- Atta
- Oil
- Sugar
- Salt
- Spices
- Pulses

### Vegetables

- Vegetables
- Leafy vegetables
- Onions
- Potatoes
- Tomatoes
- Other vegetables

### Non-vegetarian

- Chicken
- Mutton
- Fish
- Eggs
- Other non-veg

### Food

- Breakfast
- Lunch
- Dinner
- Meals
- Snacks
- Tea
- Coffee
- Biscuits
- Drinking water

### Other

- Cooking gas
- Kitchen supplies
- Other food expenses

The user must be able to add categories.

---

# 4. Food recipient

Food should support linking the expense to the person or worker group.

Example:

```text
Food

Person:
[ Search worker ]

Worker Type:
[ Labour ▼ ]

Category:
[ Milk ▼ ]

Quantity:
[ 10 ]

Unit:
[ Litres ▼ ]

Date:
[ 30 Aug ]

Amount:
[ ₹600 ]

Comments:
[ Optional ]
```

Or:

```text
Food

For:
[ All Site Workers ▼ ]

Category:
[ Lunch ▼ ]

Date:
[ 30 Aug ]

Amount:
[ ₹3,500 ]
```

The user should not have to enter each worker individually for common group food expenses.

---

# 5. FOOD DATE RANGE

Support:

```text
Single Day
Date Range
```

Example:

```text
From:
25 Aug 2026

To:
30 Aug 2026
```

This is particularly useful for food provided to a worker over several days.

---

# 6. GENERAL STORE MODULE

Create a separate module called:

> **General Store**

This is for everyday site consumables that are neither construction materials nor food.

Examples:

- Sponge
- Cleaning cloth
- Broom
- Mop
- Bucket
- Soap
- Detergent
- Floor cleaner
- Toilet cleaner
- Phenyl
- Brush
- Scrubber
- Garbage bags
- Dustbin
- Tissue
- Paper
- Tape
- Glue
- Chippo glue
- Fevicol
- Adhesives
- Rope
- Plastic sheets
- Batteries
- Torch
- Stationery
- Pens
- Markers
- Registers
- Files
- Printer supplies
- Drinking cups
- Disposable plates
- Other general consumables

The user can add new items.

---

# 7. General Store entry

Example:

```text
GENERAL STORE

Item
[ 🔍 Search item ]

Category
[ Cleaning ▼ ]

Quantity
[ 5 ]

Unit
[ Pieces ▼ ]

Shop
[ 🔍 Search shop ]

Cost
[ ₹350 ]

Date
[ 30 Aug ]

Comments
[ Optional ]

SAVE
```

---

# 8. General Store categories

Initial categories:

### Cleaning

- Sponge
- Scrubber
- Broom
- Mop
- Cleaning cloth
- Floor cleaner
- Phenyl
- Detergent
- Toilet cleaner
- Brush
- Garbage bags

### Adhesives

- Chippo glue
- Fevicol
- Silicone
- Adhesive
- Tape

### Office

- Paper
- Pens
- Markers
- Registers
- Files
- Stationery

### Safety

- Gloves
- Masks
- Safety tape
- Reflective items
- First-aid consumables

### Miscellaneous

User-defined items.

---

# 9. MACHINERY

Machinery should have a master record.

Examples:

- JCB
- Tractor
- Crane
- Compressor
- Excavator
- Concrete mixer
- Generator
- Water tanker
- Truck
- Other

Each machine should have:

```text
Machine ID
Machine Type
Registration/Serial Number — optional
Operator
Owner — optional
Fuel Type
Meter Type
Notes
Active/Inactive
```

---

# 10. FUEL MUST BE LINKED TO MACHINERY

Fuel should **not** simply be recorded as:

```text
Fuel ₹5,000
```

The application should know:

```text
Fuel
   ↓
Machine
   ↓
Project / Building
```

Example:

```text
FUEL

Machine
[ JCB-01 ▼ ]

Fuel
[ Diesel ▼ ]

Quantity
[ 50 ]

Unit
[ Litres ]

Rate
[ ₹92 ]

Total
₹4,600

Date
[ 30 Aug ]

Building / Job
[ North 05 ▼ ]

Given By
[ Search person ]

Comments
[ Optional ]
```

This allows fuel expenditure to be attributed to the machine and job.

Construction guidance specifically recommends recording fuel against equipment and checking equipment meter readings when fuel is issued.

---

# 11. Fuel types

Initial:

- Diesel
- Petrol
- Other

The system should allow additional fuel types.

---

# 12. Fuel quantity and cost

Fuel records should support:

```text
Quantity
Unit
Rate
Total Cost
```

If:

```text
50 litres × ₹92
```

the application should calculate:

```text
₹4,600
```

The user can override the calculated amount when necessary.

---

# 13. MACHINE METER READING

For machines with an hour meter, support:

```text
Previous Meter
Current Meter
Usage
```

Example:

```text
JCB-01

Previous:
1,240 hours

Current:
1,247 hours

Usage:
7 hours
```

This enables future reports such as:

> JCB used 42 hours and consumed 185 litres of diesel.

---

# 14. Fuel efficiency

The system should calculate, where enough data exists:

```text
Litres / machine hour
```

Example:

```text
JCB-01

Hours:
42

Diesel:
185 L

Average:
4.40 L/hour
```

Do not show efficiency if the necessary data is missing.

---

# 15. Fuel purchase vs fuel usage

Keep these separate.

### Fuel purchase

```text
Bought 500 litres diesel
₹46,000
```

### Fuel issue/use

```text
50 litres
JCB-01
North 05
```

This distinction allows the system to track fuel stock later.

---

# 16. FUEL STOCK

The system should be designed to support a fuel tank/store.

Example:

```text
Fuel Stock

Opening:
300 L

Purchases:
500 L

Issued:
350 L

Current:
450 L
```

This should be implemented if practical during the inventory phase.

Do not assume every fuel purchase was consumed immediately.

---

# 17. MATERIALS

Materials should be divided into:

### Bulk materials

- Sand
- M-Sand
- Gravel
- Aggregate
- Stone
- Steel
- Bricks
- RMC
- Cement
- Pipes
- Other bulk materials

### Hardware

- Screws
- Nails
- Bolts
- Nuts
- Washers
- Binding wire
- Anchors
- Fasteners

### Electrical

- Wire
- Cable
- Switches
- Sockets
- MCB
- DB
- Conduit
- Electrical fittings
- LED lights
- Other electrical items

### Plumbing

- PVC pipes
- CPVC pipes
- UPVC pipes
- Elbows
- Tees
- Couplers
- Valves
- Taps
- Fittings
- Other plumbing items

### Finishing

- Paint
- Putty
- Primer
- Adhesives
- Tiles
- Tile adhesive
- Grout
- Other finishing materials

The exact material list must remain user-editable.

---

# 18. MATERIAL VARIANTS

Materials should support variants.

Example:

```text
Steel
 ├── 6 mm
 ├── 8 mm
 ├── 10 mm
 ├── 12 mm
 ├── 16 mm
 ├── 20 mm
 └── 25 mm
```

Bricks:

```text
Bricks
 ├── 9 × 4 × 3
 ├── 9 × 4 × 4
 └── Custom
```

Pipes:

```text
PVC Pipe
 ├── 1 inch
 ├── 2 inch
 ├── 3 inch
 ├── 4 inch
 └── Custom
```

---

# 19. MATERIAL UNITS

Each material should have a suitable unit.

Examples:

```text
Pieces
Boxes
Bags
Kg
Tonnes
Loads
Litres
Metres
Feet
Bundles
Rolls
Sets
```

Do not allow the user to mix units accidentally within the same material record.

For example, steel quantities should not sometimes mean "bags."

Material tracking systems benefit from maintaining a consistent item name and unit for every material.

---

# 20. BULK MATERIALS

Bulk materials should support:

```text
Material
Load Number
Quantity
Weight
Unit
Supplier
Source
Destination
Date
Transport
Weighbridge
Material Cost
Transport Cost
Weighbridge Cost
```

Cost can remain optional where the user does not know it.

---

# 21. WEIGHBRIDGE

Create a dedicated **Weighbridge record**, but it must be linked to a material delivery.

Example:

```text
WEIGHBRIDGE

Material
[ Sand ]

Vehicle
[ AP XX XXXX ]

Supplier
[ XYZ ]

Date
[ 30 Aug ]

Gross Weight
[ 24.80 tonnes ]

Tare Weight
[ 14.20 tonnes ]

Net Weight
[ 10.60 tonnes ]

Weighbridge Fee
[ ₹200 ]

Destination
[ North Site ]

[ SAVE ]
```

The application should calculate:

```text
Net Weight =
Gross Weight - Tare Weight
```

---

# 22. WEIGHBRIDGE LINK

The relationship should be:

```text
Material Delivery
       │
       ├── Vehicle
       ├── Supplier
       ├── Gross Weight
       ├── Tare Weight
       ├── Net Weight
       └── Weighbridge Fee
```

The weighbridge record should never exist as an unrelated expense when it is associated with a material delivery.

---

# 23. Material cost calculation

For a bulk material, the system should be able to calculate:

```text
Material Cost
+
Transport Cost
+
Weighbridge Cost
=
Landed Cost
```

Example:

```text
Sand

Material:
₹20,000

Transport:
₹4,000

Weighbridge:
₹200

----------------
Landed Cost:
₹24,200
```

This is one of the most important calculations in the application.

---

# 24. Cost per unit

Where sufficient information exists, calculate:

```text
Landed Cost / Net Weight
```

Example:

```text
Net Weight:
10.60 tonnes

Landed Cost:
₹24,200

Cost:
₹2,283 / tonne
```

This should be shown as an analytical figure and not overwrite the original transaction values.

---

# 25. Material delivery workflow

The preferred workflow:

```text
ADD MATERIAL DELIVERY
        ↓
Select Material
        ↓
Select Supplier
        ↓
Enter Weight / Quantity
        ↓
Select Destination
        ↓
Add Transport
        ↓
Add Weighbridge
        ↓
Enter Material Cost
        ↓
SAVE
```

The user should be able to skip transport or weighbridge if not applicable.

---

# 26. Combined delivery screen

For a bulk material:

```text
┌───────────────────────────┐
│ MATERIAL DELIVERY         │
│                           │
│ Material                  │
│ [ Sand ▼ ]                │
│                           │
│ Supplier                  │
│ [ 🔍 Search ]             │
│                           │
│ Vehicle                   │
│ [ 🔍 Search ]             │
│                           │
│ Date       Time           │
│ [30 Aug]   [10:30 AM]    │
│                           │
│ Gross Weight              │
│ [24.80] Tonnes            │
│                           │
│ Tare Weight               │
│ [14.20] Tonnes            │
│                           │
│ Net Weight                │
│ 10.60 Tonnes              │
│                           │
│ Material Cost             │
│ ₹ ______                  │
│                           │
│ Transport                 │
│ [+ Add Transport]         │
│                           │
│ Weighbridge               │
│ [+ Add Weighbridge]       │
│                           │
│ Destination               │
│ [North 05 ▼]              │
│                           │
│ [ SAVE DELIVERY ]         │
└───────────────────────────┘
```

---

# 27. Vehicle master

Create reusable vehicles.

Fields:

```text
Vehicle Number
Vehicle Type
Owner
Driver
Capacity — optional
Notes
```

Examples:

```text
AP XX 1234
Truck

TS XX 5678
Tractor
```

The user can search and select existing vehicles.

---

# 28. Weighbridge master

If the same weighbridge is used repeatedly, maintain:

```text
Weighbridge Name
Location
Rate/Fee — optional
Phone — optional
Notes
```

Example:

```text
XYZ Weighbridge
Warangal Road
```

The user can select it instead of typing the name every time.

---

# 29. Weighbridge fee

The fee should be independent from the material weight.

Example:

```text
Net weight:
10.6 tonnes

Weighbridge fee:
₹200
```

The fee should contribute to the landed cost of the associated material delivery.

---

# 30. Transport + Weighbridge + Material relationship

The application should be capable of displaying:

```text
SAND DELIVERY #104

Material
Sand

Net Weight
10.60 tonnes

Material Cost
₹20,000

Transport
Truck
₹4,000

Weighbridge
XYZ Weighbridge
₹200

-------------------------
LANDED COST
₹24,200
```

This should be visible from the material delivery details page.

---

# 31. Material cost without known price

Sometimes the material arrives before the invoice/price is known.

Allow:

```text
Material Cost:
[ Not Known ]
```

The delivery can still be saved.

Later:

```text
Edit Delivery
→ Add Material Cost
```

The system should recalculate landed cost automatically.

---

# 32. Transport cost without material cost

Also support the reverse situation.

Example:

```text
Sand
10 tonnes
Material Cost: Unknown

Transport:
₹4,000

Weighbridge:
₹200
```

The system should show:

```text
Known cost:
₹4,200

Material price:
Pending
```

Do not invent the missing material cost.

---

# 33. Material source

Materials should have:

```text
Supplier
or
Source
```

because bulk materials may come from:

- Supplier
- Quarry
- Sand yard
- Factory
- Local shop
- Other site
- Own stock

---

# 34. Material movement

The application should eventually support:

```text
Received
Issued
Transferred
Returned
Adjusted
```

For example:

```text
Sand
Received: 100 tonnes
Issued: 60 tonnes
Remaining: 40 tonnes
```

This should be designed into the data model even if full inventory management is implemented later.

---

# 35. Building allocation

Material deliveries can be allocated to:

```text
North 01
North 02
West 01
East 03
Common Site
Storage
```

If material is delivered to general site storage, use:

> **Site Store**

rather than forcing a building.

---

# 36. Material cost allocation

If a material is delivered for multiple buildings, support:

```text
Sand delivery:
10 tonnes

Allocation:
North 05 → 6 tonnes
West 02 → 4 tonnes
```

This should be an advanced feature.

For MVP, allow one destination.

---

# 37. General site expenses

The system should also have a controlled miscellaneous/general category.

Potential items:

- Electricity
- Water
- Internet
- Phone
- Repairs
- Maintenance
- Waste disposal
- Security
- Cleaning
- Site office expenses
- Printing
- Stationery
- Permits/fees
- Testing
- Surveying
- Professional services
- Emergency expenses

Construction cost classifications commonly separate direct labour, materials, equipment/fuel, transportation, site expenses, repairs/maintenance, utilities and consumables rather than placing everything into miscellaneous.

---

# 38. Recommended overall category hierarchy

The final application should use:

```text
SITE MANAGEMENT
│
├── LABOUR
│   ├── Work Records
│   └── Labour Payments
│
├── FOOD & GROCERIES
│   ├── Milk
│   ├── Curd
│   ├── Rice
│   ├── Vegetables
│   ├── Non-Veg
│   ├── Meals
│   └── Other
│
├── GENERAL STORE
│   ├── Cleaning
│   ├── Adhesives
│   ├── Office
│   ├── Safety
│   └── Other
│
├── MACHINERY
│   ├── JCB
│   ├── Crane
│   ├── Tractor
│   ├── Compressor
│   └── Other
│
├── FUEL
│   ├── Diesel
│   └── Petrol
│
├── SALARY
│   ├── Watchman
│   ├── Security
│   ├── Office Boy
│   └── House Help
│
├── TRANSPORT
│   ├── Auto
│   ├── Tractor
│   ├── Truck
│   ├── Lorry
│   └── Other
│
├── MATERIALS
│   ├── Sand
│   ├── Steel
│   ├── Bricks
│   ├── Cement
│   ├── Gravel
│   ├── RMC
│   ├── Pipes
│   ├── Electrical
│   ├── Plumbing
│   ├── Hardware
│   └── Finishing
│
├── WEIGHBRIDGE
│
└── GENERAL SITE EXPENSES
```

---

# 39. Important: don't make categories rigid

These are **initial defaults**, not hard-coded categories.

The user must be able to:

```text
+ Add Category
+ Add Item
+ Add Size
+ Add Worker Type
+ Add Work Type
+ Add Machine
+ Add Shop
+ Add Supplier
+ Add Vehicle
+ Add Building
```

---

# 40. Search UX

Every selector should behave like:

```text
[ 🔍 Search material ]

Sand
M-Sand
Steel
Bricks
Cement
Pipes

+ Add New Material
```

After selecting:

```text
Sand ✓
```

the selector closes.

Do not use giant dropdown lists that require scrolling through hundreds of items.

---

# 41. Smart defaults

The application should remember frequently used combinations.

For example:

```text
Sand
→ Truck
→ XYZ Supplier
→ North Site
→ XYZ Weighbridge
```

If the user selects Sand again, suggest:

> Use previous delivery settings?

This should be optional.

---

# 42. Cost summary

For every material delivery, show:

```text
Material Cost
Transport Cost
Weighbridge Cost
Other Delivery Costs
---------------------
Landed Cost
```

For every machine:

```text
Machine Cost
Fuel Cost
Maintenance Cost
----------------
Operating Cost
```

This creates useful real-world cost information without requiring traditional accounting concepts.

---

# 43. Machine operating-cost view

For example:

```text
JCB-01

This Month

Usage:
84 hours

Fuel:
320 L

Fuel Cost:
₹29,440

Machine Hire:
₹50,000

Maintenance:
₹4,500

Total:
₹83,940
```

The application should be designed so this calculation is possible.

---

# 44. Material comparison

The system should eventually show:

```text
SAND

Delivery #1
10.6 tonnes
₹2,283 / tonne landed

Delivery #2
11.2 tonnes
₹2,350 / tonne landed

Delivery #3
10.8 tonnes
₹2,210 / tonne landed
```

This helps identify changes in material/transport costs.

---

# 45. Weighbridge reconciliation

For each bulk delivery:

```text
Supplier Quantity
vs
Weighbridge Quantity
```

If a supplier says:

```text
11 tonnes
```

but weighbridge says:

```text
10.6 tonnes
```

the system should show:

```text
Difference:
0.4 tonnes
```

Do not automatically assume which figure is correct.

---

# 46. Dashboard additions

The dashboard should eventually show:

```text
TODAY

Labour       ₹____
Food         ₹____
Materials    ₹____
Fuel         ₹____
Machinery    ₹____
Transport    ₹____
Salary       ₹____
General      ₹____
```

And:

```text
MATERIALS THIS MONTH

Sand          120 tonnes
Steel          42 tonnes
Bricks       18,000 pcs
Cement        850 bags
```

And:

```text
MACHINERY

JCB
42 hours
185 L diesel

Tractor
28 hours
90 L diesel
```

---

# 47. Most important design rule

Do not model:

```text
Fuel = Expense
Transport = Expense
Weighbridge = Expense
Material = Expense
```

as four unrelated records.

Instead model the operational relationships:

```text
MATERIAL DELIVERY
│
├── Material
├── Supplier
├── Quantity
├── Weight
├── Cost
│
├── TRANSPORT
│   ├── Vehicle
│   ├── Type
│   └── Cost
│
└── WEIGHBRIDGE
    ├── Gross
    ├── Tare
    ├── Net
    └── Fee
```

And:

```text
MACHINE
│
├── Work
├── Hours
├── Building
└── FUEL
    ├── Quantity
    ├── Rate
    └── Cost
```

That data model is what will make the application genuinely useful instead of becoming another prettier Excel sheet.

---

# 48. Priority for implementation

## P0

- Food categories
- General Store
- Machinery
- Fuel linked to machinery
- Material master
- Material sizes/variants
- Material deliveries
- Transport linked to material
- Weighbridge linked to material
- Material cost
- Transport cost
- Weighbridge cost
- Landed-cost calculation
- Searchable selectors
- Add-new functionality

## P1

- Machine hour meter
- Fuel consumption
- Fuel stock
- Material stock
- Material allocation by building
- Weight reconciliation
- Supplier history
- Shop history
- Vehicle master

## P2

- Cost comparison
- Machine efficiency analytics
- Material price trends
- Automated anomaly detection
- OCR of weighbridge slips
- OCR of material invoices
- Voice entry

---

# 49. Example end-to-end workflow

A truck brings sand to the site.

The user opens:

**Materials → Add Delivery**

Selects:

```text
Material:
Sand

Supplier:
ABC Sand Supplier

Vehicle:
TS XX 1234

Destination:
North 05
```

Enters:

```text
Gross:
24.8 tonnes

Tare:
14.2 tonnes
```

System calculates:

```text
Net:
10.6 tonnes
```

User adds:

```text
Material cost:
₹20,000
```

Then:

```text
Transport:
Truck
₹4,000
```

Then:

```text
Weighbridge:
XYZ Weighbridge
₹200
```

System displays:

```text
SAND DELIVERY

Net Weight: 10.6 tonnes

Material       ₹20,000
Transport       ₹4,000
Weighbridge       ₹200
----------------------
Landed Cost    ₹24,200

₹2,283 / tonne
```

This single record should contain all those relationships.

---

# 50. Final product principle

The application should answer three questions for every important resource:

### What happened?

Example:

> 10.6 tonnes of sand arrived.

### Where did it go?

Example:

> North 05.

### What did it really cost?

Example:

> Material ₹20,000 + transport ₹4,000 + weighbridge ₹200 = ₹24,200.

Likewise for machinery:

### What machine?

> JCB-01

### What did it do?

> Soil leveling — North 05 — 7 hours

### What did it consume/cost?

> 32 litres diesel + machinery charge.

This relationship-first design should be reflected in the database before implementing the UI.