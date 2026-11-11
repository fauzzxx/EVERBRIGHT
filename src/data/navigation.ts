import type { DivisionId } from '../types/catalog';

export interface NavItem {
  label: string;
  /** id of the section on the home page */
  anchor: string;
}

/** Home-page sections in the main menu bar (scroll on the home page). */
export const navigation: NavItem[] = [
  { label: 'Home', anchor: 'top' },
  { label: 'About Us', anchor: 'about' },
  { label: 'Contact', anchor: 'contact' },
];

/** The three divisions, in the order shown in the division bar; each opens its own page. */
export const divisionNavOrder: DivisionId[] = ['uniform', 'police', 'bags'];
