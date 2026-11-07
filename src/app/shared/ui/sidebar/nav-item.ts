import { IconName } from '../icon/icons';
import { Tone } from '../tone';

export interface NavItem {
  label: string;
  icon: IconName;
  tone: Tone;
  path: string;
  // Cuándo marcarlo como página actual; por defecto, si la URL empieza con `path`
  activeWhen?: (url: string) => boolean;
}
