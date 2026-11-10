export interface NavItem {
  label: string;
  /** id of the section on the home page */
  anchor: string;
}

export const navigation: NavItem[] = [
  { label: 'Home', anchor: 'top' },
  { label: 'About Us', anchor: 'about' },
  { label: 'EVERBRIGHT UNIFORM POLICE', anchor: 'police' },
  { label: 'EVERBRIGHT UNIFORM', anchor: 'uniform' },
  { label: 'Protective Bags', anchor: 'bags' },
  { label: 'Contact', anchor: 'contact' },
];
