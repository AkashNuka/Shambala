# Construction Site Management — Detailed Functional Requirements

## 1. Purpose

Build a **mobile-first construction site management web application** for quickly recording and tracking labour, food, machinery, salaries, transport, materials, and cash transactions.

This document is **standalone** and specifically defines the detailed user workflows and data requirements for these modules.

The application should be designed for real-world use on a mobile phone by someone working at a construction site.

The user should rarely need to type information manually.

The application should rely heavily on:

- Dropdowns
- Searchable dropdowns
- Existing-item selection
- Quick-select buttons
- Date pickers
- Time pickers
- Auto-filled fields
- "Add New" options
- Optional comments
- Reusable people, buildings, materials, shops and machinery

---

# 2. Core UX principle

The application should work like this:

> Select → Search → Choose → Enter amount/details → Save.

Avoid long forms.

For example, if the user wants to record labour:

```text
LABOUR
↓
Building: [North 01 ▼]
Worker: [Search worker...]
Work: [Soil Dressing ▼]
Date: [30 Aug 2026]
Time: [10:30 AM]
Amount: ₹____
Comments: ______
SAVE
```

The user should not have to manually type "North Building 01" every time.

---

# 3. Reusable master data

The application should maintain reusable records for:

## People

Each person should have:

- Name
- Worker type
- Phone number — optional
- Notes — optional
- Active/inactive status

Worker types should include:

- Labour
- Mason
- Helper
- Electrician
- Plumber
- Carpenter
- Watchman
- Security
- Office Boy
- House Help
- Driver
- Operator
- Contractor
- Other

The user must be able to add new worker types.

---

# 4. Searchable selection

Whenever an existing person, material, shop, building, machinery item, etc. is required, use a searchable selector.

Example:

```text
Worker

[ 🔍 Search worker ]

Balakrishna
Bhadraiah
Ramesh
Suresh
```

Typing:

```text
bal
```

should immediately filter:

```text
B. Balakrishna
```

There should always be:

```text
+ Add New
```

if the required item doesn't exist.

---

# 5. Buildings / locations

The construction project consists of multiple buildings/locations.

The system should support building identifiers such as:

```text
North 01
North 02
North 03

West 01
West 02
West 03

East 01
East 02
East 03
```

The user should be able to create additional:

- Directions
- Building numbers
- Blocks
- Areas
- Other site locations

Structure:

```text
Building
    Direction
    Number
    Name (optional)
```

Example:

```text
Direction: North
Number: 05
Name: Villa 05
```

Display:

> **North 05**

rather than requiring the user to type the complete name.

---

# 6. Work types

Labour must have predefined work types.

Initial work types:

- Soil Dressing
- Soil Leveling
- Shifting
- Cleaning
- Steel Unloading

The user must be able to add additional work types.

Examples of future additions:

- Brick Work
- Masonry
- Plastering
- Painting
- Electrical Work
- Plumbing Work
- Excavation
- Loading
- Unloading
- Transportation

Work types should be reusable and searchable.

---

# 7. LABOUR MODULE

## 7.1 Purpose

Record labour work and labour-related payments.

A labour record should capture:

- Building/location
- Worker/labour name
- Worker type
- Work type
- Date
- Time
- Amount
- Payment source
- Person who provided cash, if applicable
- Optional comments

---

## 7.2 Labour entry

Example:

```text
ADD LABOUR

Building
[ North 05 ▼ ]

Worker
[ 🔍 Search worker ]

Worker Type
[ Labour ▼ ]

Work Type
[ Soil Dressing ▼ ]

Date
[ 30 Aug 2026 ]

Time
[ 10:30 AM ]

Amount
[ ₹ 1,200 ]

Payment
[ Cash ▼ ]

Cash Given By
[ 🔍 Search person ]

Comments
[ Optional ]

[ SAVE ]
```

---

# 8. Cash input for labour

The system needs to distinguish between:

### Who performed the work

and

### Who provided the money.

Example:

```text
Worker:
B. Balakrishna

Cash given by:
Varun Sir

Amount:
₹3,200
```

Therefore:

```text
worker_id
cash_provider_id
```

must be separate fields.

Do not assume the person receiving money is the person who supplied the money.

---

# 9. Labour payment vs labour record

The system should allow:

### Work record

```text
Balakrishna
Soil Dressing
North 05
30 Aug
```

and separately:

### Payment

```text
Balakrishna
₹3,200
Cash
```

But the UI should make it easy to combine them when appropriate.

The user should not be forced to create duplicate records.

---

# 10. Labour comments

Comments are optional.

Examples:

```text
Worked half day
Extra work
Shifted soil from North 05
Worked with JCB
```

Never make comments mandatory.

---

# 11. FOOD MODULE

The food module is for food, groceries and worker/site provisions.

A food record should contain:

- Person/worker
- Worker type
- Food category
- Date
- Start date / end date
- Amount — if applicable
- Shop/vendor — optional
- Comments

---

# 12. Food period

The user should be able to select:

### Single day

```text
30 Aug 2026
```

or:

### Date range

```text
From:
25 Aug 2026

To:
30 Aug 2026
```

The UI should make this very easy.

Provide:

```text
(•) Single Day
( ) Date Range
```

---

# 13. Food recipient

Example:

```text
Worker
[ 🔍 Search ]

Worker Type
[ Watchman ▼ ]

Food
[ Grocery ▼ ]

Date
[ 30 Aug 2026 ]

Comments
[ Optional ]
```

The worker type should normally auto-fill from the person's profile.

The user should still be able to change it if necessary.

---

# 14. Food categories

Initial categories:

- Food
- Groceries
- Vegetables
- Milk
- Drinking Water
- Tea/Snacks
- Kitchen Supplies
- Other

The user can add additional categories.

---

# 15. MACHINERY MODULE

Machinery should support:

- Crane
- Tractor
- JCB
- Compressor
- Excavator
- Other machinery

The user must be able to add additional machinery types.

---

# 16. Machinery record

Example:

```text
MACHINERY

Machine
[ JCB ▼ ]

Operator
[ 🔍 Search operator ]

Building
[ North 05 ▼ ]

Date
[ 30 Aug 2026 ]

Start Time
[ 09:00 AM ]

End Time
[ 02:00 PM ]

Hours
[ 5 ]

Amount
[ ₹ ______ ]

Comments
[ Optional ]
```

The system should be able to calculate:

```text
End Time - Start Time = Hours
```

when times are provided.

Alternatively, the user can directly enter hours.

---

# 17. Machinery flexibility

Not every machine will be charged by the hour.

Therefore support:

```text
Charging Type

Hourly
Daily
Fixed Amount
Load
Other
```

Example:

```text
JCB
5 hours
₹6,000
```

or:

```text
Crane
1 day
₹8,000
```

---

# 18. SALARY MODULE

Salary is different from ordinary labour payments.

Salary records should contain:

- Employee/worker
- Worker type
- From date
- To date
- Salary amount
- Payment date
- Payment method
- Person who provided cash, if applicable
- Comments

---

# 19. Salary worker types

Initial options:

- Watchman
- Security
- Office Boy
- House Help

Allow additional types.

---

# 20. Salary entry

Example:

```text
SALARY

Employee
[ 🔍 Search ]

Worker Type
[ Watchman ▼ ]

Salary Period

From
[ 01 Aug 2026 ]

To
[ 31 Aug 2026 ]

Salary
[ ₹ ______ ]

Payment Date
[ 31 Aug 2026 ]

Payment Method
[ Cash ▼ ]

Cash Given By
[ 🔍 Search ]

Comments
[ Optional ]

[ SAVE SALARY ]
```

---

# 21. TRANSPORT MODULE

Transport must be linked to materials whenever possible.

This is important.

A transport record should not simply be:

```text
Transport ₹2,000
```

It should be possible to say:

```text
Material:
Sand

Supplier/Source:
XYZ

Transport:
Auto

From:
Location A

To:
North Site

Cost:
₹2,000
```

---

# 22. Transport types

Initial options:

- Auto
- Tractor
- Truck
- Lorry
- Mini Truck
- Tempo
- Other

Allow additional transport types.

---

# 23. Transport-material relationship

Transport should support:

```text
Transport
    ↓
Material Delivery
    ↓
Material
```

Example:

```text
Material:
Sand

Load:
1

Weight:
10 tonnes

Transport:
Truck

Transport Cost:
₹4,000
```

The transport record should be linked to that specific material delivery.

---

# 24. Material delivery

A delivery should have:

- Material
- Supplier/source
- Date
- Time — optional
- Quantity
- Unit
- Weight — optional
- Vehicle/transport type
- Transport record
- Destination/building/site
- Comments

---

# 25. MATERIAL MODULE

Materials should be divided into:

### Large / bulk materials

Examples:

- Sand
- Steel
- Bricks
- Gravel
- RMC
- Stone
- Pipes
- Other bulk materials

### Small purchased materials

Examples:

- Screws
- Electrical items
- Plumbing items
- Hardware
- Tools
- Fittings
- Small shop purchases

---

# 26. Bulk material entry

Large material entries do not necessarily require a cost.

The system should allow:

```text
MATERIAL DELIVERY

Material
[ Sand ▼ ]

Date
[ 30 Aug 2026 ]

Quantity
[ 1 ]

Unit
[ Load ▼ ]

Weight
[ 10 ]

Weight Unit
[ Tonnes ▼ ]

Supplier/Source
[ 🔍 Search ]

Destination
[ North 05 ▼ ]

Transport
[ Link Transport ]

Comments
[ Optional ]
```

Cost should be optional.

---

# 27. Steel

Steel needs size/diameter information.

Example:

```text
Steel

Size
[ 8 mm ▼ ]

Quantity
[ 5 ]

Unit
[ Tonnes ▼ ]

Weight
[ 5.2 ]

Date
[ 30 Aug 2026 ]
```

Steel sizes should be configurable.

Initial examples:

- 6 mm
- 8 mm
- 10 mm
- 12 mm
- 16 mm
- 20 mm
- 25 mm

Allow custom sizes.

---

# 28. Bricks

Bricks also need size/type.

Example:

```text
Bricks

Type/Size
[ 9 × 4 × 3 ▼ ]

Quantity
[ 5,000 ]

Unit
[ Pieces ▼ ]

Weight
[ Optional ]

Date
[ 30 Aug 2026 ]
```

The user must be able to add custom brick sizes.

---

# 29. Pipes

Pipes should support:

- Pipe type
- Diameter/size
- Length
- Quantity
- Unit
- Supplier
- Date
- Destination

Example:

```text
PVC Pipe
4 inch
20 pieces
North 05
```

---

# 30. Small shop materials

Small items purchased from shops should support much more specific information.

Example:

```text
SHOP MATERIAL

Shop
[ 🔍 Search shop ]

Material
[ Screw ▼ ]

Size
[ 2 inch ▼ ]

Quantity
[ 5 ]

Unit
[ Boxes ▼ ]

Cost
[ ₹1,250 ]

Date
[ 30 Aug 2026 ]

Comments
[ Optional ]
```

---

# 31. Screws

Screws should specifically support:

- Type
- Size
- Number of boxes
- Units per box — optional
- Total quantity — optional
- Shop
- Cost
- Date

Example:

```text
Screw
Size: 2 inch
Boxes: 5
Shop: ABC Hardware
Cost: ₹1,250
```

---

# 32. Other small materials

The same flexible model should support:

```text
Electrical wire
Switches
Sockets
PVC fittings
Nails
Bolts
Nuts
Washers
Tape
Adhesive
Plumbing fittings
Hardware
```

Each item can optionally have:

- Size
- Brand
- Quantity
- Unit
- Boxes
- Cost
- Shop
- Date
- Comments

---

# 33. Shop master

Create reusable shops.

Each shop should contain:

```text
Shop Name
Location
Phone — optional
Notes — optional
```

Example:

```text
ABC Hardware
XYZ Electricals
Sandeep Kirana
```

The user can search:

```text
[ 🔍 Search shop ]
```

and select an existing shop.

---

# 34. Cost rules for materials

The system must distinguish between:

### Cost known

Example:

```text
Screws
5 boxes
₹1,250
```

and:

### Cost not recorded

Example:

```text
Sand
10 tonnes
Cost not entered
```

Do not force a cost for bulk materials.

The system should allow:

```text
Cost
[ Skip / Not Available ]
```

---

# 35. Material + transport combined entry

The preferred workflow should allow:

```text
ADD MATERIAL

Material
[ Sand ]

Weight
[ 10 Tonnes ]

Supplier
[ XYZ ]

Destination
[ North 05 ]

Transport
[ + Add Transport ]
```

Then:

```text
TRANSPORT

Type
[ Truck ]

From
[ Quarry ]

Cost
[ ₹4,000 ]
```

Saving the material should automatically link the transport record.

---

# 36. Linking

Records should have relationships.

Example:

```text
Material Delivery #102
       │
       ├── Sand
       ├── 10 tonnes
       ├── XYZ Supplier
       └── North 05
             │
             └── Transport #55
                   ├── Truck
                   └── ₹4,000
```

When viewing the material delivery, the user should be able to see:

> Transport cost: ₹4,000

When viewing the transport record, the user should be able to see:

> Material: Sand — 10 tonnes

---

# 37. Date and time

Every major transaction should support a date.

Where useful, also support time.

Required date fields:

- Labour
- Food
- Machinery
- Salary payment
- Transport
- Materials

Time should be optional unless the workflow requires it.

The application should default to:

```text
Today
Current time
```

but allow modification.

---

# 38. Comments

Comments should be available throughout the application.

They should always be optional.

Use a small expandable field:

```text
+ Add comment
```

rather than taking up space in the main form.

---

# 39. Search everywhere

Search should be available for:

- Workers
- Employees
- Suppliers
- Shops
- Materials
- Buildings
- Work types
- Machinery
- Transport
- Transactions

Search should support partial matches.

Example:

```text
Search: bal
```

returns:

```text
B. Balakrishna
Balaji Electricals
```

---

# 40. Recent selections

The application should learn from usage.

If the user frequently selects:

```text
North 05
Labour
Balakrishna
Soil Dressing
Cash
```

these should appear under:

### Recent

This dramatically reduces data-entry time.

---

# 41. Add-new behavior

Every dropdown/search selector should have:

```text
+ Add New
```

Example:

```text
Worker
----------------
Search...

Ramesh
Balakrishna
Suresh

+ Add New Worker
```

The user should not need to leave the current form.

---

# 42. Form persistence

If the user accidentally navigates away from a form, the application should warn them or preserve the entered values.

Do not silently discard partially entered financial information.

---

# 43. Validation

Required fields should be clearly indicated.

For labour:

Required:

- Worker
- Work type
- Date
- Amount, if recording a payment

Optional:

- Building
- Time
- Comments
- Cash provider

For material delivery:

Required:

- Material
- Date
- Quantity or weight

Optional:

- Cost
- Supplier
- Transport
- Destination
- Comments

---

# 44. Dashboard summaries

The dashboard should eventually provide:

```text
TODAY

Labour
₹____

Food
₹____

Machinery
₹____

Materials
₹____

Transport
₹____

Salary
₹____
```

And:

```text
THIS MONTH

Total expenditure
₹________
```

---

# 45. Activity history

The application should show recent activity:

```text
Today

₹3,200
Labour — Balakrishna

₹1,200
Food — Sandeep Kirana

10 tonnes
Sand received

₹4,000
Transport — Truck
Linked to Sand delivery
```

---

# 46. Filtering

Transactions should be filterable by:

- Date
- Date range
- Building
- Worker
- Worker type
- Work type
- Material
- Material size
- Shop
- Supplier
- Machinery
- Category
- Payment method
- Amount

---

# 47. Building-level view

A particularly useful feature should be:

```text
BUILDINGS

North 01
North 02
North 03
...
West 01
...
East 01
```

Selecting a building should show:

```text
North 05

Labour
₹____

Materials
₹____

Machinery
₹____

Transport
₹____

Total recorded
₹____
```

and the associated transactions.

---

# 48. Worker-level view

Selecting a worker should show:

```text
Balakrishna

Worker Type:
Labour

Labour Records:
...

Payments:
...

Total Paid:
₹____

Recent Work:
Soil Dressing
Shifting
Cleaning
```

---

# 49. Material-level view

Selecting:

```text
Sand
```

should show:

```text
Total loads
Total weight
Suppliers
Deliveries
Transport costs
```

The user should be able to see where the material went.

---

# 50. Important distinction

The application must keep these concepts separate:

### Work

What someone did.

### Payment

Money paid to someone.

### Material

What arrived at the site.

### Transport

How the material arrived.

### Money source

Where the payment came from.

### Person

Who received/provided money.

This separation prevents the application from becoming another messy spreadsheet.

---

# 51. Recommended mobile entry architecture

The home screen should have large action buttons:

```text
┌───────────────────────────┐
│       SITE MANAGER        │
│                           │
│      + ADD EXPENSE        │
│                           │
│ ┌─────────┐ ┌───────────┐ │
│ │ LABOUR  │ │ MATERIAL  │ │
│ └─────────┘ └───────────┘ │
│                           │
│ ┌─────────┐ ┌───────────┐ │
│ │  FOOD   │ │ MACHINERY │ │
│ └─────────┘ └───────────┘ │
│                           │
│ ┌─────────┐ ┌───────────┐ │
│ │ SALARY  │ │ TRANSPORT │ │
│ └─────────┘ └───────────┘ │
│                           │
│ Recent                    │
│ ...                       │
└───────────────────────────┘
```

---

# 52. Quick Add

The user should also be able to tap:

```text
+ ADD
```

and choose:

```text
Labour
Food
Machinery
Salary
Transport
Material
Money In
Payment
```

---

# 53. Do not overload the first screen

Advanced fields should be hidden under:

```text
+ More details
```

For example:

Labour initially:

```text
Worker
Work
Building
Amount
Date
```

Advanced:

```text
Time
Cash provider
Worker type
Comments
```

---

# 54. Database design principles

The implementation should avoid separate databases/tables for:

```text
North labour
West labour
Cement
Sand
Steel
Bricks
```

Instead, use normalized master data.

Core entities:

```text
Person
Building
WorkType
Material
MaterialVariant
Shop
Supplier
Machinery
TransportType
Account
Transaction
MaterialDelivery
TransportRecord
LabourRecord
FoodRecord
SalaryRecord
```

Relationships should be used rather than duplicated text.

---

# 55. Extensibility

The user must be able to add:

- New buildings
- New workers
- New worker types
- New work types
- New machinery
- New material types
- New material sizes
- New shops
- New suppliers
- New transport types
- New food categories

without changing the application code.

These should be database-driven master records.

---

# 56. Data entry philosophy

The application should prioritize:

### Speed

Few taps.

### Accuracy

Select existing records rather than repeatedly typing names.

### Flexibility

Optional fields where information isn't available.

### Traceability

Related records should be linked.

### Simplicity

No accounting terminology in the normal user interface.

---

# 57. Critical implementation requirement

Before building the UI, the coding agent should create the data model and relationships for:

```text
People
Buildings
Work Types
Materials
Material Variants/Sizes
Shops
Suppliers
Machinery
Transport Types
Transactions
Labour
Food
Salary
Material Deliveries
Transport
```

Then build the UI around those relationships.

Do not build independent forms first and attempt to connect them later.

---

# 58. Priority

### P0 — Must have

- Mobile-first interface
- Searchable dropdowns
- Add/select existing people
- Buildings
- Labour
- Work types
- Cash provider
- Food
- Machinery
- Salary
- Transport
- Materials
- Material sizes
- Shop materials
- Date/date range
- Optional comments
- Linking transport to material
- Add-new functionality

### P1 — Important

- Building-level history
- Worker history
- Material history
- Supplier history
- Recent selections
- Filters
- Reports
- Cash balance

### P2 — Later

- OCR
- AI categorization
- Voice entry
- Offline mode
- Advanced analytics
- Tally export

---

# 59. Final product goal

The finished application should feel less like accounting software and more like a **simple digital site register**.

A site manager should be able to pull out a phone and do this:

> Select **Labour** → select **Balakrishna** → select **Soil Dressing** → select **North 05** → enter ₹3,200 → select **Cash** → select **Varun Sir** → Save.

Or:

> Select **Material** → select **Sand** → enter **10 tonnes** → select **North 05** → add **Truck ₹4,000** → Save.

Or:

> Select **Food** → select **Ramesh** → select **Groceries** → select date range → Save.

Or:

> Select **Salary** → select **Watchman** → select employee → select August period → enter salary → Save.

The application should make these common operations **faster than maintaining the current Excel workbook**, while retaining enough structured information to produce useful reports later.