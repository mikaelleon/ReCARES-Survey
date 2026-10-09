export const O1_CATEGORIES = [
  {
    id: 'water_supply',
    label: 'Water supply or interruptions',
    items: [
      'Frequent water interruptions or no water supply',
      'Water interruptions happen without advance notice',
      'Scheduled interruptions are announced too late',
      'Water stays out for many hours or days',
      'Low water pressure',
      'Dirty, discolored, or foul-smelling water',
      'Leaking or broken water pipes are not repaired quickly',
      'No alternative water source during outages (tanker or refill)',
      'Unclear who to contact or how to report a water problem',
      'No updates on when the water will return',
      'Unfair or unclear water charges',
      'Other',
    ],
  },
  {
    id: 'electricity_power',
    label: 'Power interruptions or electrical hazards',
    items: [
      'Frequent power interruptions',
      'Power outages with no announcement',
      'Hanging, exposed, or unsafe electrical wires',
      'Slow follow-up on reported power problems',
      'Other',
    ],
  },
  {
    id: 'garbage_collection',
    label: 'Garbage collection',
    items: [
      'Missed collection days',
      'Collection schedule is unclear',
      'Garbage left uncollected for days',
      'Improper waste segregation not enforced',
      'Foul odor or pests from garbage areas',
      'Other',
    ],
  },
  {
    id: 'street_lights',
    label: 'Street lights',
    items: ['Lights not working', 'Areas that are too dark at night', 'Repairs take too long', 'Other'],
  },
  {
    id: 'roads_drainage',
    label: 'Roads or drainage',
    items: ['Potholes or damaged roads', 'Flooding or poor drainage', 'Blocked or clogged drains', 'Other'],
  },
  {
    id: 'noise_curfew',
    label: 'Noise or curfew concerns',
    items: [
      'Loud parties or gatherings',
      'Construction noise outside allowed hours',
      'Curfew hours are unclear or unenforced',
      'Other',
    ],
  },
  {
    id: 'parking',
    label: 'Parking',
    items: [
      'Not enough visitor parking',
      'Vehicles blocking driveways or roads',
      'Parking rules are unclear',
      'Other',
    ],
  },
  {
    id: 'security_patrol',
    label: 'Security patrol',
    items: [
      'Guards not visible or not patrolling regularly',
      'Slow response to concerns',
      'Procedures are unclear',
      'Long queues or delays at the gate',
      'Other',
    ],
  },
  {
    id: 'billing_dues',
    label: 'Billing or dues',
    items: [
      'Unclear billing or charges',
      'Difficulty getting a receipt or statement',
      'Disputes not resolved',
      'Other',
    ],
  },
  {
    id: 'renovation_permits',
    label: 'Renovation permits',
    items: [
      'Requirements are unclear',
      'Approval takes too long',
      'Difficulty reaching the engineer or office in charge',
      'Other',
    ],
  },
  {
    id: 'pet_animal',
    label: 'Pet or animal concerns',
    items: ['Stray animals', 'Pets not kept leashed or contained', 'Noise from animals', 'Other'],
  },
  {
    id: 'facilities_amenities',
    label: 'Common areas or facilities',
    items: [
      'Clubhouse, court, or playground not well maintained',
      'Gate or perimeter fence damaged',
      'Overgrown grass or untrimmed trees in common areas',
      'Facility reservation is difficult or unclear',
      'Other',
    ],
  },
  {
    id: 'neighbor_disputes',
    label: 'Disputes between neighbors',
    items: [
      'Boundary or fence disagreements',
      'Complaints are not mediated',
      'Unclear process for filing a complaint',
      'Other',
    ],
  },
] as const;

export type O1CategoryId = (typeof O1_CATEGORIES)[number]['id'];
