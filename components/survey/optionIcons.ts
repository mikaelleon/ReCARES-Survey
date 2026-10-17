import {
  Accessibility,
  Building2,
  Car,
  Ear,
  Eye,
  FileText,
  Footprints,
  IdCard,
  Laptop,
  Mail,
  MessagesSquare,
  Package,
  Phone,
  Smartphone,
  Tablet,
  TrafficCone,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icons only where a picture says the choice faster than the words: devices,
 * ways of reaching the HOA, kinds of difficulty, who comes through the gate,
 * and the website features. Keyed by question code, then option id.
 */
const ICONS: Record<string, Record<string, LucideIcon>> = {
  A11: {
    walk_in: Building2,
    phone: Phone,
    facebook: MessagesSquare,
    email_or_website: Mail,
    through_neighbor_or_officer: Users,
  },
  B1: {
    smartphone: Smartphone,
    laptop_desktop: Laptop,
    tablet: Tablet,
    shared_device: Users,
  },
  B3: {
    wifi_broadband: Wifi,
    prepaid_mobile: Smartphone,
    postpaid_mobile: Smartphone,
    no_regular_internet: WifiOff,
  },
  AC1: {
    difficulty_walking_climbing: Footprints,
    uses_wheelchair_or_aid: Accessibility,
    difficulty_seeing: Eye,
    difficulty_hearing: Ear,
    difficulty_reading_forms: FileText,
  },
  P1: {
    visitors: Users,
    drivers: Car,
    deliveries: Package,
  },
  F8: {
    pre_registration: UserCheck,
    closure: TrafficCone,
    forms: FileText,
    registration: IdCard,
    requests: MessagesSquare,
    accessible: Accessibility,
  },
};

export function optionIcon(code: string, optionId: string): LucideIcon | undefined {
  return ICONS[code]?.[optionId];
}
