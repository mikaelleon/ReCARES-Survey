export const O1_CATEGORIES = [
  {
    id: 'garbage_collection',
    label: 'Garbage collection',
    items: [
      'Missed collection days',
      'Collection schedule is unclear',
      'Garbage left uncollected for days',
      'Improper waste segregation not enforced',
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
] as const;

export type O1CategoryId = (typeof O1_CATEGORIES)[number]['id'];
